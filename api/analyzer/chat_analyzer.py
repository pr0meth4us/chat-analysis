import json
from typing import Dict, List, Optional, Union, Callable
import emoji
import pandas as pd

from . import chat_analysis as af
from . import sentiment_lexicons
from .df_parser import DfParser
from .utils import AnalysisUtils


class ChatAnalyzer:
    def __init__(self,
                 file_path_or_messages: Union[str, List[Dict]],
                 input_type: str = 'file',
                 progress_callback: Optional[Callable] = None,
                 participants: Optional[List[str]] = None,
                 metadata: Optional[Dict] = None,
                 filter_settings: Optional[Dict] = None):
        self.input_type = input_type
        self.file_path = file_path_or_messages if input_type == 'file' else None
        self.data = [] if input_type == 'file' else file_path_or_messages
        self.df = pd.DataFrame()
        self.report = {}
        self.progress_callback = progress_callback
        self.participants = participants or []
        self.metadata = metadata or {}
        self.filter_settings = filter_settings or {}
        self.message_parser = DfParser(self.participants)
        self.utils = AnalysisUtils()
        self.analysis_keywords = sentiment_lexicons.ANALYSIS_KEYWORDS
        self.positive_base = sentiment_lexicons.HAPPY_BASE
        self.negative_base = sentiment_lexicons.SAD_BASE
        self.sexual_content = sentiment_lexicons.SEXUAL_CONTENT

        stopwords = sentiment_lexicons.COMPREHENSIVE_STOPWORDS
        name_stop_words = set()
        for name in self.participants:
            name_stop_words.update(name.lower().split())
        self.dynamic_generic_words = stopwords.union(name_stop_words)

    def filter_personal_messages(self, exclude_info_sharing: bool = True,
                                 confidence_threshold: float = 0.4) -> pd.DataFrame:
        if not exclude_info_sharing:
            return self.df

        personal_df = self.df[
            (~self.df['is_info_sharing']) |
            (self.df['info_sharing_confidence'] < confidence_threshold)
            ].copy()
        return personal_df

    def load_and_preprocess(self):
        """Load data and preprocess messages with comprehensive parsing."""
        self._update_progress(10, "Loading data")
        if self.input_type == 'file':
            with open(self.file_path, 'r', encoding='utf-8') as f:
                content = f.read().strip()
                self.data = json.loads(content) if content.startswith('[') else [json.loads(line) for line in
                                                                                 content.split('\n') if line.strip()]
        if not self.data:
            raise ValueError("No data to preprocess.")

        self._update_progress(20, f"Initializing {len(self.data)} messages")
        df = pd.DataFrame(self.data)
        df['message'] = df['message'].astype(str).fillna('')
        df['sender'] = df['sender'].astype('category')
        df['datetime'] = pd.to_datetime(df['timestamp'], errors='coerce')
        df.dropna(subset=['datetime'], inplace=True)
        df.sort_values('datetime', inplace=True, ignore_index=True)
        if df.empty:
            raise ValueError("No valid messages with timestamps found.")

        self._update_progress(40, "Parsing message content")
        parsed_data = df.apply(self.message_parser.parse_message_content, axis=1)
        parsed_df = pd.json_normalize(parsed_data)
        df = df.join(parsed_df)

        self._update_progress(60, "Engineering features")
        df['message_length'] = df['text_content'].str.len()
        df['word_count'] = df['text_content'].str.split().str.len()
        df['has_emoji'] = df['text_content'].apply(lambda x: bool(emoji.emoji_list(x)))
        df['has_question'] = df['text_content'].str.contains(r'\?', na=False)
        df['has_url'] = df['urls'].apply(len) > 0
        dt = df['datetime'].dt
        df['date'] = pd.to_datetime(dt.date)
        df['hour'] = dt.hour
        df['day_of_week'] = dt.day_name()
        df['is_weekend'] = dt.weekday >= 5
        df['time_gap_minutes'] = df['datetime'].diff().dt.total_seconds().fillna(0) / 60
        df['conversation_id'] = (df['time_gap_minutes'] > 60).cumsum().astype(int)
        self.df = df
        self._update_progress(70, "Preprocessing completed")

    def _update_progress(self, progress_percent: float, step_name: str):
        if self.progress_callback:
            try:
                self.progress_callback(progress_percent=max(0, min(100, progress_percent)), step_name=step_name)
            except Exception as e:
                print(f"Progress callback error: {e}")

    def generate_comprehensive_report(self,
                                      modules_to_run: Optional[List[str]] = None,
                                      exclude_info_sharing: bool = True,
                                      confidence_threshold: float = 0.4) -> Dict:
        if self.df.empty:
            return {"error": "DataFrame is empty, cannot generate report."}

        analysis_df = self.filter_personal_messages(exclude_info_sharing=exclude_info_sharing,
                                                    confidence_threshold=confidence_threshold)

        if exclude_info_sharing:
            total_messages = len(self.df)
            info_sharing_messages = len(self.df[self.df['is_info_sharing']])
            self.report['info_sharing_stats'] = {
                'total_messages': total_messages,
                'info_sharing_messages': info_sharing_messages,
                'personal_messages': len(analysis_df),
                'info_sharing_percentage': round((info_sharing_messages / total_messages) * 100,
                                                 2) if total_messages > 0 else 0,
                'info_sharing_by_category': self.df[self.df['is_info_sharing']][
                    'info_sharing_category'].value_counts().to_dict(),
                'confidence_threshold_used': confidence_threshold
            }

        ANALYSIS_REGISTRY = self._get_analysis_registry()
        run_queue = []
        active_modules = modules_to_run if modules_to_run else list(ANALYSIS_REGISTRY.keys())
        for module_name in active_modules:
            if module_name not in ANALYSIS_REGISTRY: continue
            for dep in ANALYSIS_REGISTRY[module_name]['deps']:
                if dep not in run_queue: run_queue.append(dep)
            if module_name not in run_queue: run_queue.append(module_name)

        total_modules, start_progress, progress_range = len(run_queue), 75, 25

        # --- THIS IS THE NEW, STANDARDIZED LOOP ---
        for i, module_name in enumerate(run_queue):
            current_progress = start_progress + (i / total_modules) * progress_range
            self._update_progress(current_progress, f"Running {module_name}")
            try:
                module_info = ANALYSIS_REGISTRY[module_name]

                # Start with static arguments
                kwargs = module_info.get('args', {}).copy()

                # Automatically inject data from dependencies based on our convention
                for dependency_key in module_info.get('deps', []):
                    # Construct the parameter name (e.g., "response_metrics" -> "response_metrics_data")
                    arg_name = f"{dependency_key}_data"
                    # Fetch the result from the dependency and add it to kwargs
                    kwargs[arg_name] = self.report.get(dependency_key, {})

                # The function call is now completely generic
                result = module_info['func'](analysis_df, **kwargs)
                self.report[module_name] = result

            except Exception as e:
                error_msg = f"Error in module '{module_name}': {type(e).__name__} - {e}"
                print(error_msg)
                self.report[module_name] = {"error": error_msg}

        if self.metadata: self.report['metadata'] = self.metadata
        if self.filter_settings: self.report['filter_settings'] = self.filter_settings
        self._update_progress(100, "Analysis completed")
        return self.utils.convert_to_serializable(self.report)

    def _get_analysis_registry(self) -> Dict:
        return {
            'dataset_overview': {'func': af.dataset_overview, 'deps': [], 'args': {}},
            'first_last_messages': {'func': af.first_last_messages, 'deps': [], 'args': {}},
            'temporal_patterns': {'func': af.temporal_patterns, 'deps': [], 'args': {}},
            'word_analysis': {'func': af.analyze_word_patterns, 'deps': [],
                              'args': {'word_pattern': self.message_parser.word_pattern,
                                       'generic_words': self.dynamic_generic_words}},
            'topic_modeling': {'func': af.analyze_topics, 'deps': [],
                               'args': {'generic_words': self.dynamic_generic_words}},
            'user_behavior': {'func': af.analyze_user_behavior, 'deps': [], 'args': {}},
            'argument_analysis': {'func': af.analyze_argument_language, 'deps': [],
                                  'args': {'argument_words': self.analysis_keywords['ARGUMENT']}},
            'sad_tone_analysis': {'func': af.analyze_sad_tone, 'deps': [],
                                  'args': {'sad_words': self.analysis_keywords['SAD']}},
            'romance_tone_analysis': {'func': af.analyze_romance_tone, 'deps': [],
                                      'args': {'romance_words': self.analysis_keywords['ROMANTIC']}},
            'happy_tone_analysis': {'func': af.analyze_happy_tone, 'deps': [],
                                    'args': {'positive_words': self.analysis_keywords['HAPPY']}},
            'sexual_tone_analysis': {'func': af.analyze_sexual_tone, 'deps': [],
                                     'args': {'sexual_words': self.sexual_content}},
            'sentiment_analysis': {'func': af.analyze_sentiment, 'deps': [],
                                   'args': {'word_pattern': self.message_parser.word_pattern,
                                            'positive_words': self.positive_base,
                                            'negative_words': self.negative_base}},
            'unbroken_streaks': {'func': af.analyze_unbroken_streaks, 'deps': [], 'args': {}},
            'ghost_periods': {'func': af.detect_ghost_periods, 'deps': [], 'args': {}},
            'icebreaker_analysis': {'func': af.icebreaker_analysis, 'deps': [], 'args': {}},
            'response_metrics': {'func': af.calculate_response_metrics, 'deps': [], 'args': {}},
            'conversation_patterns': {'func': af.analyze_conversation_patterns, 'deps': [], 'args': {}},
            'rapid_fire_analysis': {'func': af.analyze_rapid_fire_conversations, 'deps': [], 'args': {}},
            'reaction_analysis': {'func': af.analyze_reactions, 'deps': [], 'args': {}},
            'emoji_analysis': {'func': af.emoji_analysis, 'deps': [], 'args': {}},
            'question_analysis': {'func': af.analyze_questions, 'deps': [],
                                  'args': {'sentence_pattern': self.message_parser.sentence_pattern}},
            'link_analysis': {'func': af.analyze_shared_links, 'deps': [], 'args': {'url_pattern': self.message_parser.url_pattern}},
            'attachment_analysis': {'func': af.analyze_attachments, 'deps': [], 'args': {}},
            'relationship_metrics': {'func': af.calculate_relationship_metrics,
                                     'deps': ['response_metrics'], 'args': {}},
            'emotion_analysis': {'func': af.analyze_emotions_ml, 'deps': [], 'args': {}},

        }