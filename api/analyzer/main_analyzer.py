import json
import re
import warnings
from datetime import datetime, date
import numpy as np
import pandas as pd
import emoji
from . import analysis_modules as af
from . import sentiment_lexicons

warnings.filterwarnings('ignore', category=UserWarning, module='sklearn')
warnings.filterwarnings('ignore', category=RuntimeWarning)


class ChatAnalyzer:
    def __init__(self, file_path_or_messages, input_type='file', progress_callback=None):
        self.input_type = input_type
        self.file_path = file_path_or_messages if input_type == 'file' else None
        self.data = [] if input_type == 'file' else file_path_or_messages
        self.df = pd.DataFrame()
        self.report = {}
        self.progress_callback = progress_callback

        # Pre-compile regex patterns for performance
        self.url_pattern = re.compile(r'https?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(),]|%[0-9a-fA-F][0-9a-fA-F])+|www\.')
        self.word_pattern = re.compile(r'\b\w+\b')
        self.english_pattern = re.compile(r'\b[a-zA-Z]+\b')
        self.khmer_pattern = re.compile(r'[\u1780-\u17FF]+')
        self.sentence_pattern = re.compile(r'(?<!\w\.\w.)(?<![A-Z][a-z]\.)(?<=\.|\?|\!)\s')
        self.url_pattern = re.compile(r'https?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(),]|%[0-9a-fA-F][0-9a-fA-F])+|www\.')
        self.word_pattern = re.compile(r'\b\w+\b')
        self.sentence_pattern = re.compile(r'(?<!\w\.\w.)(?<![A-Z][a-z]\.)(?<=\.|\?|\!)\s')
        self.generic_words = sentiment_lexicons.generic_words
        self.khmer_stopwords = sentiment_lexicons.khmer_stopwords
        self.positive_words = sentiment_lexicons.positive_words
        self.negative_words = sentiment_lexicons.negative_words
        self.sad_words = sentiment_lexicons.sad_words
        self.romance_words = sentiment_lexicons.romance_words
        self.sexual_words = sentiment_lexicons.sexual_words
        self.argument_words = sentiment_lexicons.argument_words

    def _find_reaction_type(self, message: str):
        if not isinstance(message, str) or len(message.strip()) == 0:
            return None

        message = message.strip()

        reaction_patterns = [
            re.compile(r'^(Liked|Laughed at|Emphasized|Loved|Disliked|Questioned)\s+"(.*)"$', re.IGNORECASE),
            re.compile(r'^(Liked|Laughed at|Emphasized|Loved|Disliked|Questioned)\s+(.*)$', re.IGNORECASE),
            re.compile(r'^You reacted (.*) to this message$', re.IGNORECASE),
            re.compile(r'^(.+) reacted (.*) to this message$', re.IGNORECASE),
            re.compile(r'^Reacted with (.+) to (.*)$', re.IGNORECASE),
            re.compile(r'^(.+) reacted to your message with (.+)$', re.IGNORECASE),
            re.compile(r'^You reacted to (.+)\'s message with (.+)$', re.IGNORECASE),
            re.compile(r'^(.+) (loved|liked|disliked|laughed at|was amazed by|got angry at) your message$',
                       re.IGNORECASE),
            re.compile(r'^You (loved|liked|disliked|laughed at|were amazed by|got angry at) (.+)\'s message$',
                       re.IGNORECASE),
            re.compile(
                r'^(You |[a-zA-Z\s]+?)(loved|liked|disliked|laughed at|emphasized|questioned) (an image|a message|a photo|a video)$',
                re.IGNORECASE),
            re.compile(r'^Reacted\s+(.+?)\s+to a message$', re.IGNORECASE),
            re.compile(r'^(.+) added (😀|😂|😢|😡|👍|👎|❤️|😍|😮|😠|🔥|💯|👏|🎉) to (.+)$', re.IGNORECASE),
            re.compile(r'^You added (😀|😂|😢|😡|👍|👎|❤️|😍|😮|😠|🔥|💯|👏|🎉) to (.+)$', re.IGNORECASE),
            re.compile(r'reacted|reaction', re.IGNORECASE),
        ]

        for pattern in reaction_patterns:
            match = pattern.search(message)
            if match:
                groups = match.groups()

                for group in groups:
                    if group and group.strip():
                        clean_group = group.strip().lower()

                        skip_words = {'you', 'your', 'to', 'this', 'message', 'an', 'a', 'the', 'with'}
                        if clean_group not in skip_words and len(clean_group) > 1:
                            reaction_mapping = {
                                'loved': 'love',
                                'liked': 'like',
                                'disliked': 'dislike',
                                'laughed at': 'laugh',
                                'emphasized': 'emphasize',
                                'questioned': 'question',
                                'was amazed by': 'wow',
                                'got angry at': 'angry',
                                '😀': 'happy',
                                '😂': 'laugh',
                                '😢': 'sad',
                                '😡': 'angry',
                                '👍': 'like',
                                '👎': 'dislike',
                                '❤️': 'love',
                                '😍': 'love',
                                '😮': 'wow',
                                '😠': 'angry',
                                '🔥': 'fire',
                                '💯': 'hundred',
                                '👏': 'clap',
                                '🎉': 'celebrate'
                            }

                            return reaction_mapping.get(clean_group, clean_group)

                return 'reaction'

        return None

    def load_and_preprocess(self):

        self._update_progress(10, "Loading data")

        if self.input_type == 'file' and self.file_path:
            with open(self.file_path, 'r', encoding='utf-8') as f:
                content = f.read().strip()
                self.data = json.loads(content) if content.startswith('[') else [json.loads(line) for line in
                                                                                 content.split('\n') if line.strip()]
        if not self.data: raise ValueError("No data to preprocess.")
        self._update_progress(30, f"Preprocessing {len(self.data)} messages")
        df = pd.DataFrame(self.data)

        # --- Basic Preprocessing (same as before) ---
        df['message'] = df['message'].astype(str).fillna('')
        df['sender'] = df['sender'].astype('category')
        df['datetime'] = pd.to_datetime(df['timestamp'], errors='coerce')
        df.dropna(subset=['datetime'], inplace=True)
        df.sort_values('datetime', inplace=True, ignore_index=True)
        if df.empty: raise ValueError("No valid messages with timestamps found.")
        self._update_progress(50, "Engineering features")
        df['reaction_type'] = df['message'].apply(self._find_reaction_type)
        df['is_reaction'] = df['reaction_type'].notna()
        df['text_content'] = df['message'].where(~df['is_reaction'], '')
        df['message_length'] = df['message'].str.len()
        df['word_count'] = df['message'].str.split().str.len()
        df['has_emoji'] = df['message'].apply(lambda x: bool(emoji.emoji_list(x)))
        df['has_question'] = df['text_content'].str.contains(r'\?', na=False) # Check only non-reactions
        df['has_url'] = df['text_content'].str.contains(self.url_pattern, na=False) # Check only non-reactions
        dt = df['datetime'].dt
        df['date'] = pd.to_datetime(dt.date)
        df['hour'] = dt.hour
        df['day_of_week'] = dt.day_name()
        df['is_weekend'] = dt.weekday >= 5
        df['time_gap_minutes'] = df['datetime'].diff().dt.total_seconds().fillna(0) / 60
        new_conv_mask = df['time_gap_minutes'] > 60
        df['conversation_id'] = new_conv_mask.cumsum().astype(int)

        self.df = df
        self._update_progress(70, "Preprocessing completed")

    def _update_progress(self, progress_percent: float, step_name: str):
        """Simplified progress update helper."""
        if self.progress_callback:
            try:
                self.progress_callback(
                    progress_percent=max(0, min(100, progress_percent)),
                    step_name=step_name
                )
            except Exception as e:
                print(f"Progress callback error: {e}")

    def convert_to_serializable(self, obj):
        """
        Recursively converts numpy/pandas types and non-string dictionary keys
        to JSON serializable types.
        """
        if isinstance(obj, (np.integer, np.int64, np.int32)):
            return int(obj)
        if isinstance(obj, (np.floating, np.float64, np.float32)):
            return float(obj)
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        if isinstance(obj, pd.Series):
            return obj.to_dict()
        if isinstance(obj, (datetime, pd.Timestamp, date)):
            return obj.isoformat()
        if isinstance(obj, dict):
            return {self.convert_to_serializable(k): self.convert_to_serializable(v) for k, v in obj.items()}
        if isinstance(obj, (list, tuple)):
            return [self.convert_to_serializable(i) for i in obj]
        if pd.isna(obj):
            return None
        return obj

    def generate_comprehensive_report(self, modules_to_run: list = None):
        if self.df.empty:
            return {"error": "DataFrame is empty, cannot generate report."}

        ANALYSIS_REGISTRY = {
            'dataset_overview': {'func': af.dataset_overview, 'deps': [], 'args': {}},
            'first_last_messages': {'func': af.first_last_messages, 'deps': [], 'args': {}},
            'temporal_patterns': {'func': af.temporal_patterns, 'deps': [], 'args': {}},
            'unbroken_streaks': {'func': af.analyze_unbroken_streaks, 'deps': [], 'args': {}},
            'ghost_periods': {'func': af.detect_ghost_periods, 'deps': [], 'args': {}},
            'icebreaker_analysis': {'func': af.icebreaker_analysis, 'deps': [], 'args': {}},
            'response_metrics': {'func': af.calculate_response_metrics, 'deps': [], 'args': {}},
            'conversation_patterns': {'func': af.analyze_conversation_patterns, 'deps': [], 'args': {}},
            'rapid_fire_analysis': {'func': af.analyze_rapid_fire_conversations, 'deps': [], 'args': {}},
            'word_analysis': {'func': af.analyze_word_patterns, 'deps': [],
                              'args': {'word_pattern': self.word_pattern, 'english_pattern': self.english_pattern,
                                       'khmer_pattern': self.khmer_pattern, 'generic_words': self.generic_words,
                                       'khmer_stopwords': self.khmer_stopwords}},
            'emoji_analysis': {'func': af.emoji_analysis, 'deps': [], 'args': {}},
            'question_analysis': {'func': af.analyze_questions, 'deps': [],
                                  'args': {'sentence_pattern': self.sentence_pattern}},
            'link_analysis': {'func': af.analyze_shared_links, 'deps': [], 'args': {'url_pattern': self.url_pattern}},
            'sentiment_analysis': {'func': af.analyze_sentiment, 'deps': [],
                                   'args': {'word_pattern': self.word_pattern, 'positive_words': self.positive_words,
                                            'negative_words': self.negative_words}},
            'topic_modeling': {'func': af.analyze_topics, 'deps': [],
                               'args': {'generic_words': self.generic_words}},
            'user_behavior': {'func': af.analyze_user_behavior, 'deps': [], 'args': {}},
            'argument_analysis': {'func': af.analyze_argument_language, 'deps': [],
                                  'args': {'argument_words': self.argument_words}},
            'sad_tone_analysis': {'func': af.analyze_sad_tone, 'deps': [], 'args': {'sad_words': self.sad_words}},
            'romance_tone_analysis': {'func': af.analyze_romance_tone, 'deps': [],
                                      'args': {'romance_words': self.romance_words}},
            'sexual_tone_analysis': {'func': af.analyze_sexual_tone, 'deps': [],
                                     'args': {'sexual_words': self.sexual_words}},
            'happy_tone_analysis': {'func': af.analyze_happy_tone, 'deps': [],
                                    'args': {'positive_words': self.positive_words}},
            'relationship_metrics': {
                'func': af.calculate_relationship_metrics,
                'deps': ['conversation_patterns', 'response_metrics'],
                'args': {}
            },
            'emotion_analysis': {'func': af.analyze_emotions_ml, 'deps': [], 'args': {}},

        }

        # Build execution queue with dependencies
        run_queue = []
        active_modules = modules_to_run if modules_to_run else list(ANALYSIS_REGISTRY.keys())

        for module_name in active_modules:
            if module_name not in ANALYSIS_REGISTRY:
                continue
            for dep in ANALYSIS_REGISTRY[module_name]['deps']:
                if dep not in run_queue:
                    run_queue.append(dep)
            if module_name not in run_queue:
                run_queue.append(module_name)

        total_modules = len(run_queue)
        start_progress = 75  # Start after preprocessing
        progress_range = 25   # Use remaining 25% for analysis

        for i, module_name in enumerate(run_queue):
            # Calculate progress: 75% + (current_module/total_modules) * 25%
            current_progress = start_progress + (i / total_modules) * progress_range
            self._update_progress(current_progress, f"Running {module_name}")

            try:
                module_info = ANALYSIS_REGISTRY[module_name]
                kwargs = module_info['args']

                if module_name == 'relationship_metrics':
                    kwargs['conversation_patterns_data'] = self.report.get('conversation_patterns', {})
                    kwargs['response_metrics_data'] = self.report.get('response_metrics', {})

                result = module_info['func'](self.df, **kwargs)
                self.report[module_name] = result

            except Exception as e:
                error_msg = f"Error in module '{module_name}': {type(e).__name__} - {e}"
                print(error_msg)
                self.report[module_name] = {"error": error_msg}

        self._update_progress(100, "Analysis completed")
        return self.convert_to_serializable(self.report)