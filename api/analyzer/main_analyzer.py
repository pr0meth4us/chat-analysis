import json
import re
import warnings
from datetime import datetime, date
from typing import Dict, Any, List, Optional, Union, Callable

import numpy as np
import pandas as pd
import emoji
from . import analysis_modules as af
from . import sentiment_lexicons

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

        # --- STATIC REGEX PATTERNS ---
        self.url_pattern = re.compile(r'((?:https?://|www\.)[a-zA-Z0-9./\?=\-_%&@#~;,\+]+[a-zA-Z0-9/])')
        self.attachment_pattern = re.compile(r'^sent\s+an\s+attachment\.', re.IGNORECASE)
        self.word_pattern = re.compile(r'\b\w+\b')
        self.english_pattern = re.compile(r'\b[a-zA-Z]+\b')
        self.khmer_pattern = re.compile(r'[\u1780-\u17FF]+')
        self.sentence_pattern = re.compile(r'(?<!\w\.\w.)(?<![A-Z][a-z]\.)(?<=\.|\?|\!)\s')

        # --- LEXICONS & DYNAMIC STOP WORDS ---
        self.generic_words = sentiment_lexicons.generic_words

        # Create dynamic stop word list including participant names
        name_stop_words = set()
        for name in self.participants:
            name_stop_words.update(name.lower().split())
        self.dynamic_generic_words = self.generic_words.union(name_stop_words)

        # Load sentiment lexicons
        self.khmer_stopwords = sentiment_lexicons.khmer_stopwords
        self.positive_words = sentiment_lexicons.positive_words
        self.negative_words = sentiment_lexicons.negative_words
        self.sad_words = sentiment_lexicons.sad_words
        self.romance_words = sentiment_lexicons.romance_words
        self.sexual_words = sentiment_lexicons.sexual_words
        self.argument_words = sentiment_lexicons.argument_words
        self.metadata = metadata or {}
        self.filter_settings = filter_settings or {}

    def _build_dynamic_inline_reaction_pattern(self) -> Optional[re.Pattern]:
        """Builds a regex that uses the emoji library for comprehensive emoji matching."""
        if not self.participants:
            return None

        sorted_names = sorted(self.participants, key=len, reverse=True)
        names_pattern_part = '|'.join(re.escape(name) for name in sorted_names)

        # Use comprehensive emoji pattern
        emoji_pattern = r'[\U0001F300-\U0001FAFF\u2600-\u27BF]'

        dynamic_pattern = re.compile(
            rf'(.*?)({emoji_pattern})\s*({names_pattern_part})$',
            re.UNICODE
        )
        return dynamic_pattern

    def _detect_info_sharing(self, message: str) -> Dict[str, Any]:
        if not isinstance(message, str) or len(message.strip()) == 0:
            return {
                'is_info_sharing': False,
                'confidence': 0.0,
                'indicators': [],
                'category': None
            }

        message = message.strip()
        indicators = []
        confidence_score = 0.0
        category = None

        # Pattern 1: News/Article indicators
        news_patterns = [
            r'\b(has since|according to|it is reported|sources say|officials said)\b',
            r'\b(government|ministry|official|spokesperson|representative)\b',
            r'\b(announced|declared|stated|confirmed|revealed)\b',
            r'\b(policy|agreement|treaty|declaration|resolution)\b',
            r'\b(meeting|conference|summit|talks|negotiations)\b',
            r'\b(dispute|conflict|tension|dialogue|consultation)\b'
        ]

        # Pattern 2: Formal announcements
        announcement_patterns = [
            r'\b(call for papers|deadline|submission|application)\b',
            r'\b(pleased to announce|we are announcing|it is announced)\b',
            r'\b(timeline|schedule|dates|registration)\b',
            r'\b(conference|workshop|seminar|symposium)\b',
            r'\b(partnership|collaboration|in cooperation with)\b',
            r'\b(interested candidates|applicants|participants)\b'
        ]

        # Pattern 3: Academic/Formal writing indicators
        formal_patterns = [
            r'\b(furthermore|however|nevertheless|therefore|consequently)\b',
            r'\b(in conclusion|in summary|to summarize|in other words)\b',
            r'\b(research|study|analysis|findings|methodology)\b',
            r'\b(implementation|framework|guidelines|provisions)\b'
        ]

        # Pattern 4: Quotation marks around large blocks (news quotes)
        quote_patterns = [
            r'"[^"]{100,}"',  # Long quoted text (100+ chars)
            r'["""][^"""]{100,}["""]'  # Smart quotes with long content
        ]

        # Pattern 5: Formal dates and times
        date_patterns = [
            r'\b\d{1,2}\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\b',
            r'\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b',
            r'\b\d{2}:\d{2}\s*(AM|PM|am|pm)\b'
        ]

        # Pattern 6: Organizational/Institutional names
        org_patterns = [
            r'\b[A-Z]{2,}(?:\s+[A-Z]{2,})*\b',  # Acronyms like ASEAN, DOC, COC
            r'\b(Academy|University|Institute|Foundation|Organization|Association)\b',
            r'\b(Cambodia|ASEAN|China|Beijing|Ministry|Department)\b'
        ]

        # Pattern 7: Professional/Academic language
        professional_patterns = [
            r'\b(implementation|coordination|consultations|provisions|bilateral)\b',
            r'\b(digital transformation|skills gap|practitioners|candidates)\b',
            r'\b(volume|publication|manuscript|submission|proposal)\b'
        ]

        # Check each pattern category
        pattern_categories = [
            ('news', news_patterns),
            ('announcement', announcement_patterns),
            ('formal', formal_patterns),
            ('academic', professional_patterns)
        ]

        for cat_name, patterns in pattern_categories:
            matches = 0
            for pattern in patterns:
                if re.search(pattern, message, re.IGNORECASE):
                    matches += 1
                    indicators.append(f"{cat_name}_language")

            if matches >= 2:  # Multiple matches in same category
                confidence_score += 0.3
                if not category:
                    category = cat_name

        # Check quote patterns
        for pattern in quote_patterns:
            if re.search(pattern, message):
                confidence_score += 0.4
                indicators.append('long_quotes')
                if not category:
                    category = 'quoted_content'

        # Check date patterns
        date_matches = sum(1 for pattern in date_patterns if re.search(pattern, message))
        if date_matches >= 2:
            confidence_score += 0.2
            indicators.append('formal_dates')

        # Check organizational patterns
        org_matches = sum(1 for pattern in org_patterns if re.search(pattern, message))
        if org_matches >= 3:
            confidence_score += 0.3
            indicators.append('organizational_names')

        # Additional heuristics
        word_count = len(message.split())

        # Very long messages with formal structure
        if word_count > 100:
            sentences = re.split(r'[.!?]+', message)
            valid_sentences = [s for s in sentences if s.strip()]
            if valid_sentences:
                avg_sentence_length = sum(len(s.split()) for s in valid_sentences) / len(valid_sentences)

                if avg_sentence_length > 15:  # Long, complex sentences
                    confidence_score += 0.2
                    indicators.append('complex_sentences')

        # Check for lack of personal pronouns (less personal)
        personal_pronouns = re.findall(r'\b(I|me|my|mine|you|your|yours|we|us|our|ours)\b', message, re.IGNORECASE)
        pronoun_ratio = len(personal_pronouns) / max(word_count, 1)

        if pronoun_ratio < 0.02 and word_count > 50:  # Very few personal pronouns in longer text
            confidence_score += 0.2
            indicators.append('impersonal_tone')

        # Check for formal punctuation patterns
        if re.search(r':\s*$', message) or message.count(';') >= 2:
            confidence_score += 0.1
            indicators.append('formal_punctuation')

        # Cap confidence at 1.0
        confidence_score = min(confidence_score, 1.0)

        # Determine if it's information sharing (threshold: 0.4)
        is_info_sharing = confidence_score >= 0.4

        return {
            'is_info_sharing': is_info_sharing,
            'confidence': round(confidence_score, 3),
            'indicators': list(set(indicators)),  # Remove duplicates
            'category': category,
            'word_count': word_count
        }

    def _find_reaction_type(self, message: str) -> Optional[str]:
        """Identifies if a message is a reaction and returns the reaction type."""
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
            re.compile(r'^(.+) (loved|liked|disliked|laughed at|was amazed by|got angry at) your message$', re.IGNORECASE),
            re.compile(r'^You (loved|liked|disliked|laughed at|were amazed by|got angry at) (.+)\'s message$', re.IGNORECASE),
            re.compile(r'^(You |[a-zA-Z\s]+?)(loved|liked|disliked|laughed at|emphasized|questioned) (an image|a message|a photo|a video)$', re.IGNORECASE),
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
                                'loved': 'love', 'liked': 'like', 'disliked': 'dislike', 'laughed at': 'laugh',
                                'emphasized': 'emphasize', 'questioned': 'question', 'was amazed by': 'wow',
                                'got angry at': 'angry', '😀': 'happy', '😂': 'laugh', '😢': 'sad',
                                '😡': 'angry', '👍': 'like', '👎': 'dislike', '❤️': 'love', '😍': 'love',
                                '😮': 'wow', '😠': 'angry', '🔥': 'fire', '💯': 'hundred', '👏': 'clap', '🎉': 'celebrate'
                            }
                            return reaction_mapping.get(clean_group, clean_group)
                return 'reaction'
        return None

    def filter_personal_messages(self, exclude_info_sharing: bool = True, confidence_threshold: float = 0.4) -> pd.DataFrame:
        if not exclude_info_sharing:
            return self.df

        # Filter out information sharing messages
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
                self.data = json.loads(content) if content.startswith('[') else [json.loads(line) for line in content.split('\n') if line.strip()]

        if not self.data:
            raise ValueError("No data to preprocess.")

        self._update_progress(20, f"Initializing {len(self.data)} messages")
        df = pd.DataFrame(self.data)

        # Basic data cleaning
        df['message'] = df['message'].astype(str).fillna('')
        df['sender'] = df['sender'].astype('category')
        df['datetime'] = pd.to_datetime(df['timestamp'], errors='coerce')
        df.dropna(subset=['datetime'], inplace=True)
        df.sort_values('datetime', inplace=True, ignore_index=True)

        if df.empty:
            raise ValueError("No valid messages with timestamps found.")

        self._update_progress(40, "Parsing message content")

        dynamic_inline_pattern = self._build_dynamic_inline_reaction_pattern()

        def parse_message_content(row) -> dict:
            """Parse message content to identify reactions, attachments, and info sharing."""
            message = row['message']
            sender = row['sender']

            result = {
                'is_reaction': False,
                'is_attachment': False,
                'is_info_sharing': False,
                'info_sharing_confidence': 0.0,
                'info_sharing_category': None,
                'info_sharing_indicators': [],
                'reaction_type': None,
                'text_content': '',
                'urls': []
            }

            if not message.strip():
                return result

            text_to_parse = message

            # Check for attachments
            if sender:
                prefix_pattern = re.compile(rf'^{re.escape(sender)}\s+sent\s+an\s+attachment\.', re.IGNORECASE)
                if prefix_pattern.search(text_to_parse):
                    result['is_attachment'] = True
                    result['text_content'] = ''
                    return result

            if dynamic_inline_pattern:
                inline_match = dynamic_inline_pattern.search(text_to_parse)
                if inline_match:
                    result['text_content'] = inline_match.group(1).strip()
                    result['reaction_type'] = inline_match.group(2).strip()
                    result['is_reaction'] = False

                    # Extract URLs from text content
                    urls_in_text = self.url_pattern.findall(result['text_content'])
                    if urls_in_text:
                        result['urls'] = [u[0] for u in urls_in_text]
                        result['text_content'] = self.url_pattern.sub('', result['text_content']).strip()

                    # Check for information sharing even in messages with reactions
                    if result['text_content']:
                        info_result = self._detect_info_sharing(result['text_content'])
                        result['is_info_sharing'] = info_result['is_info_sharing']
                        result['info_sharing_confidence'] = info_result['confidence']
                        result['info_sharing_category'] = info_result['category']
                        result['info_sharing_indicators'] = info_result['indicators']

                    return result

            standard_reaction_type = self._find_reaction_type(text_to_parse)
            if standard_reaction_type:
                result['is_reaction'] = True
                result['reaction_type'] = standard_reaction_type
                result['text_content'] = ''
                return result

            urls = self.url_pattern.findall(text_to_parse)
            if urls:
                result['urls'] = [u[0] for u in urls]
                result['text_content'] = ''
            else:
                result['text_content'] = text_to_parse.strip()

            if result['text_content']:
                info_result = self._detect_info_sharing(result['text_content'])
                result['is_info_sharing'] = info_result['is_info_sharing']
                result['info_sharing_confidence'] = info_result['confidence']
                result['info_sharing_category'] = info_result['category']
                result['info_sharing_indicators'] = info_result['indicators']

            return result

        parsed_data = df.apply(parse_message_content, axis=1)
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
                self.progress_callback(
                    progress_percent=max(0, min(100, progress_percent)),
                    step_name=step_name
                )
            except Exception as e:
                print(f"Progress callback error: {e}")

    def convert_to_serializable(self, obj):
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

    def generate_comprehensive_report(self,
                                      modules_to_run: Optional[List[str]] = None,
                                      exclude_info_sharing: bool = True,
                                      confidence_threshold: float = 0.4) -> Dict:
        if self.df.empty:
            return {"error": "DataFrame is empty, cannot generate report."}

        # Get filtered dataframe for analysis
        analysis_df = self.filter_personal_messages(
            exclude_info_sharing=exclude_info_sharing,
            confidence_threshold=confidence_threshold
        )

        # Add info sharing statistics to report
        if exclude_info_sharing:
            total_messages = len(self.df)
            info_sharing_messages = len(self.df[self.df['is_info_sharing']])
            personal_messages = len(analysis_df)

            # Info sharing category breakdown
            info_sharing_categories = self.df[self.df['is_info_sharing']]['info_sharing_category'].value_counts().to_dict()

            self.report['info_sharing_stats'] = {
                'total_messages': total_messages,
                'info_sharing_messages': info_sharing_messages,
                'personal_messages': personal_messages,
                'info_sharing_percentage': round((info_sharing_messages / total_messages) * 100, 2) if total_messages > 0 else 0,
                'info_sharing_by_category': info_sharing_categories,
                'confidence_threshold_used': confidence_threshold
            }

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
            'reaction_analysis': {'func': af.analyze_reactions, 'deps': [], 'args': {}},
            'word_analysis': {'func': af.analyze_word_patterns, 'deps': [],
                              'args': {'word_pattern': self.word_pattern, 'generic_words': self.dynamic_generic_words}},
            'emoji_analysis': {'func': af.emoji_analysis, 'deps': [], 'args': {}},
            'question_analysis': {'func': af.analyze_questions, 'deps': [],
                                  'args': {'sentence_pattern': self.sentence_pattern}},
            'link_analysis': {'func': af.analyze_shared_links, 'deps': [], 'args': {}},
            'attachment_analysis': {'func': af.analyze_attachments, 'deps': [], 'args': {}},
            'sentiment_analysis': {'func': af.analyze_sentiment, 'deps': [],
                                   'args': {'word_pattern': self.word_pattern, 'positive_words': self.positive_words,
                                            'negative_words': self.negative_words}},
            'topic_modeling': {'func': af.analyze_topics, 'deps': [],
                               'args': {'generic_words': self.dynamic_generic_words}},
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
            # Add dependencies first
            for dep in ANALYSIS_REGISTRY[module_name]['deps']:
                if dep not in run_queue:
                    run_queue.append(dep)
            # Add module itself
            if module_name not in run_queue:
                run_queue.append(module_name)

        # Execute analysis modules
        total_modules = len(run_queue)
        start_progress, progress_range = 75, 25

        for i, module_name in enumerate(run_queue):
            current_progress = start_progress + (i / total_modules) * progress_range
            self._update_progress(current_progress, f"Running {module_name}")

            try:
                module_info = ANALYSIS_REGISTRY[module_name]
                kwargs = module_info['args'].copy()

                if module_name == 'relationship_metrics':
                    kwargs['conversation_patterns_data'] = self.report.get('conversation_patterns', {})
                    kwargs['response_metrics_data'] = self.report.get('response_metrics', {})

                result = module_info['func'](analysis_df, **kwargs)
                self.report[module_name] = result

            except Exception as e:
                error_msg = f"Error in module '{module_name}': {type(e).__name__} - {e}"
                print(error_msg)
                self.report[module_name] = {"error": error_msg}
        if self.metadata:
            self.report['metadata'] = self.metadata
        if self.filter_settings:
            self.report['filter_settings'] = self.filter_settings

        self._update_progress(100, "Analysis completed")
        return self.convert_to_serializable(self.report)