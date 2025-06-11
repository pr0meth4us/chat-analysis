import json
import re
import time
import warnings
from collections import Counter
from datetime import datetime

import numpy as np
import pandas as pd

warnings.filterwarnings('ignore')


class ChatAnalyzer:
    """
    A comprehensive chat analyzer that combines features from both UltimateTelegramAnalyzer
    and OptimizedChatAnalyzer for maximum functionality and performance.
    """

    def __init__(self, file_path_or_messages, input_type='file'):
        """
        Initialize the analyzer with either a file path or message list.

        Args:
            file_path_or_messages: Either a file path (string) or list of message dictionaries
            input_type: 'file' for file path, 'messages' for message list
        """
        self.input_type = input_type
        if input_type == 'file':
            self.file_path = file_path_or_messages
            self.data = []
        else:
            self.data = file_path_or_messages
            self.file_path = None

        self.df = None
        self.report = {}
        self.start_time = time.time()

        # Pre-compile regex patterns for performance
        self.emoji_pattern = re.compile(r'[\U00010000-\U0010ffff]')
        self.url_pattern = re.compile(
            r'https?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(),]|%[0-9a-fA-F][0-9a-fA-F])+|www\.')
        self.word_pattern = re.compile(r'\b\w+\b')
        self.english_pattern = re.compile(r'\b[a-zA-Z]+\b')
        self.khmer_pattern = re.compile(r'[\u1780-\u17FF]+')
        self.caps_pattern = re.compile(r'[A-Z]{3,}')

        # Comprehensive list of generic words to exclude from analysis
        self.generic_words = {
            'i', 'you', 'me', 'my', 'your', 'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
            'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after', 'above',
            'below', 'between', 'among', 'since', 'without', 'under', 'within', 'along', 'following', 'across',
            'behind', 'beyond', 'plus', 'except', 'but', 'up', 'out', 'off', 'over', 'under', 'again', 'further',
            'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'any', 'both', 'each', 'few',
            'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than',
            'too', 'very', 's', 't', 'can', 'will', 'just', 'don', 'should', 'now', 'like', 'is', 'was', 'are',
            'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'get', 'got', 'go', 'went',
            'come', 'came', 'say', 'said', 'see', 'saw', 'know', 'knew', 'think', 'thought', 'want', 'wanted',
            'would', 'could', 'should', 'might', 'must', 'shall', 'may', 'need', 'let', 'make', 'made', 'take',
            'took', 'give', 'gave', 'put', 'find', 'found', 'tell', 'told', 'ask', 'asked', 'try', 'tried',
            'work', 'worked', 'call', 'called', 'leave', 'left', 'move', 'moved', 'live', 'lived', 'show', 'showed',
            'feel', 'felt', 'seem', 'seemed', 'look', 'looked', 'use', 'used', 'become', 'became', 'turn', 'turned',
            'start', 'started', 'end', 'ended', 'keep', 'kept', 'stay', 'stayed', 'begin', 'began', 'help', 'helped',
            'play', 'played', 'run', 'ran', 'walk', 'walked', 'talk', 'talked', 'sit', 'sat', 'stand', 'stood',
            'hold', 'held', 'bring', 'brought', 'happen', 'happened', 'write', 'wrote', 'read', 'really', 'actually',
            'probably', 'definitely', 'maybe', 'perhaps', 'quite', 'rather', 'pretty', 'enough', 'almost', 'always',
            'never', 'sometimes', 'usually', 'often', 'still', 'already', 'yet', 'soon', 'today', 'tomorrow',
            'yesterday', 'morning', 'afternoon', 'evening', 'night', 'time', 'year', 'month', 'week', 'day',
            'hour', 'minute', 'moment', 'second', 'first', 'last', 'next', 'new', 'old', 'good', 'bad', 'great',
            'small', 'big', 'large', 'little', 'long', 'short', 'high', 'low', 'right', 'left', 'early', 'late',
            'important', 'different', 'same', 'another', 'other', 'every', 'each', 'much', 'many', 'lot', 'lots',
            'thing', 'things', 'stuff', 'way', 'ways', 'people', 'person', 'man', 'woman', 'boy', 'girl', 'friend',
            'friends', 'family', 'home', 'house', 'place', 'world', 'country', 'city', 'school', 'work', 'job',
            'money', 'business', 'company', 'problem', 'problems', 'question', 'questions', 'answer', 'answers',
            'idea', 'ideas', 'part', 'parts', 'number', 'numbers', 'line', 'lines', 'word', 'words', 'name',
            'names', 'story', 'stories', 'fact', 'facts', 'hand', 'hands', 'eye', 'eyes', 'face', 'head',
            'body', 'life', 'lives', 'water', 'food', 'air', 'fire', 'earth', 'sun', 'moon', 'star', 'stars',
            'light', 'dark', 'color', 'colors', 'sound', 'sounds', 'music', 'book', 'books', 'movie', 'movies',
            'game', 'games', 'car', 'cars', 'phone', 'computer', 'internet', 'website', 'email', 'message',
            'messages', 'text', 'photo', 'photos', 'picture', 'pictures', 'video', 'videos', 'yeah', 'yes',
            'no', 'ok', 'okay', 'thanks', 'thank', 'please', 'sorry', 'excuse', 'hello', 'hi', 'hey', 'bye',
            'goodbye', 'sure', 'fine', 'well', 'oh', 'ah', 'um', 'uh', 'hmm', 'wow', 'cool', 'nice', 'awesome',
            'amazing', 'interesting', 'funny', 'weird', 'strange', 'crazy', 'stupid', 'smart', 'beautiful',
            'ugly', 'cute', 'hot', 'cold', 'warm', 'cool', 'fast', 'slow', 'easy', 'hard', 'difficult',
            'simple', 'complex', 'free', 'cheap', 'expensive', 'rich', 'poor', 'happy', 'sad', 'angry',
            'excited', 'tired', 'bored', 'busy', 'ready', 'done', 'finished', 'started', 'over', 'under',
            'inside', 'outside', 'around', 'near', 'far', 'close', 'open', 'closed', 'full', 'empty',
            'clean', 'dirty', 'safe', 'dangerous', 'strong', 'weak', 'healthy', 'sick', 'dead', 'alive'
        }

    def log_progress(self, message):
        """Log progress with timestamp"""
        print(f"[{time.time() - self.start_time:.1f}s] {message}")

    def convert_to_serializable(self, obj):
        """Convert numpy/pandas types to JSON serializable types"""
        if isinstance(obj, (np.integer, np.int64, np.int32)):
            return int(obj)
        elif isinstance(obj, (np.floating, np.float64, np.float32)):
            return float(obj)
        elif isinstance(obj, np.ndarray):
            return obj.tolist()
        elif isinstance(obj, pd.Series):
            return obj.to_dict()
        elif isinstance(obj, dict):
            return {key: self.convert_to_serializable(value) for key, value in obj.items()}
        elif isinstance(obj, list):
            return [self.convert_to_serializable(item) for item in obj]
        elif isinstance(obj, tuple):
            return tuple(self.convert_to_serializable(item) for item in obj)
        elif pd.isna(obj):
            return None
        else:
            return obj

    def load_data(self):
        """Load data from file or use provided messages"""
        if self.input_type == 'file' and self.file_path:
            self.log_progress(f"Loading data from file: {self.file_path}")
            with open(self.file_path, 'r', encoding='utf-8') as f:
                content = f.read().strip()
                if content.startswith('['):
                    self.data = json.loads(content)
                else:
                    self.data = []
                    for line in content.split('\n'):
                        if line.strip():
                            try:
                                self.data.append(json.loads(line))
                            except:
                                continue
        else:
            self.log_progress(f"Using provided message data: {len(self.data)} messages")

    def load_and_preprocess(self):
        """Load and preprocess data with comprehensive feature engineering"""
        self.load_data()

        if not self.data:
            self.df = pd.DataFrame()
            return

        self.log_progress(f"Loading {len(self.data)} messages into DataFrame...")
        self.df = pd.DataFrame(self.data)

        # Ensure required columns exist
        if 'message' not in self.df.columns or 'sender' not in self.df.columns:
            self.log_progress("Error: Required columns 'message' and 'sender' not found")
            self.df = pd.DataFrame()
            return

        self.df['message'] = self.df['message'].astype('string')
        self.df['sender'] = self.df['sender'].astype('category')

        # Handle timestamp conversion
        self.log_progress("Converting timestamps and sorting...")
        self.df['datetime'] = pd.to_datetime(self.df['timestamp'], errors='coerce')
        self.df.dropna(subset=['datetime'], inplace=True)

        if self.df.empty:
            self.log_progress("Error: No valid timestamps found")
            return

        self.df = self.df.sort_values('datetime').reset_index(drop=True)

        # Time features
        self.log_progress("Computing comprehensive time features...")
        dt = self.df['datetime'].dt
        self.df['date'] = dt.date
        self.df['hour'] = dt.hour
        self.df['minute'] = dt.minute
        self.df['day_of_week'] = dt.day_name()
        self.df['month'] = dt.month
        self.df['year'] = dt.year
        self.df['quarter'] = dt.quarter
        self.df['week_of_year'] = dt.isocalendar().week
        self.df['is_weekend'] = dt.weekday >= 5
        self.df['is_workday'] = dt.weekday < 5
        self.df['season'] = self.df['month'].map(
            {12: 'Winter', 1: 'Winter', 2: 'Winter',
             3: 'Spring', 4: 'Spring', 5: 'Spring',
             6: 'Summer', 7: 'Summer', 8: 'Summer',
             9: 'Fall', 10: 'Fall', 11: 'Fall'})

        # Message content features
        self.log_progress("Computing message content features...")
        messages = self.df['message'].astype(str)
        self.df['message_length'] = messages.str.len()
        self.df['word_count'] = messages.str.split().str.len()
        self.df['char_per_word'] = self.df['message_length'] / self.df['word_count'].replace(0, 1)
        self.df['has_emoji'] = messages.str.contains(self.emoji_pattern, regex=True, na=False)
        self.df['emoji_count'] = messages.str.count(self.emoji_pattern)
        self.df['has_question'] = messages.str.contains(r'\?', na=False)
        self.df['question_count'] = messages.str.count(r'\?')
        self.df['has_exclamation'] = messages.str.contains(r'!', na=False)
        self.df['exclamation_count'] = messages.str.count(r'!')
        self.df['has_caps'] = messages.str.contains(self.caps_pattern, na=False)
        self.df['caps_ratio'] = messages.str.count(r'[A-Z]') / self.df['message_length'].replace(0, 1)
        self.df['has_numbers'] = messages.str.contains(r'\d', na=False)
        self.df['number_count'] = messages.str.count(r'\d')
        self.df['has_url'] = messages.str.contains(self.url_pattern, na=False)
        self.df['has_mention'] = messages.str.contains(r'@', na=False)
        self.df['punctuation_density'] = messages.str.count(r'[!@#$%^&*(),.?":{}|<>]') / self.df[
            'message_length'].replace(0, 1)

        # Language detection
        self.df['has_khmer'] = messages.str.contains(self.khmer_pattern, na=False)
        self.df['has_english'] = messages.str.contains(self.english_pattern, na=False)

        # Conversation flow features
        self.log_progress("Computing conversation flow features...")
        self.df['prev_sender'] = self.df['sender'].shift(1)
        self.df['next_sender'] = self.df['sender'].shift(-1)
        self.df['is_continuation'] = self.df['sender'] == self.df['prev_sender']

        # Time gaps
        time_diffs = self.df['datetime'].diff()
        self.df['time_gap_minutes'] = time_diffs.dt.total_seconds() / 60
        self.df['time_to_next'] = self.df['datetime'].shift(-1).sub(self.df['datetime']).dt.total_seconds() / 60

        # Conversation sessions
        new_conversation_mask = (self.df['time_gap_minutes'] > 60) | (self.df['time_gap_minutes'].isna())
        self.df['conversation_id'] = new_conversation_mask.cumsum()

        # Message sequences
        self.df['msg_sequence_id'] = (self.df['sender'] != self.df['prev_sender']).cumsum()
        sequence_lengths = self.df.groupby('msg_sequence_id').size()
        self.df['sequence_length'] = self.df['msg_sequence_id'].map(sequence_lengths)
        self.df['position_in_sequence'] = self.df.groupby('msg_sequence_id').cumcount() + 1

        self.log_progress("Preprocessing complete!")

    def dataset_overview(self):
        """Basic dataset overview"""
        if self.df.empty:
            return {}

        return {
            'total_messages': int(len(self.df)),
            'date_range': {
                'start_date': str(self.df['date'].min()),
                'end_date': str(self.df['date'].max()),
                'total_days': int((self.df['date'].max() - self.df['date'].min()).days + 1)
            },
            'participants': list(self.df['sender'].unique()),
            'analysis_timestamp': datetime.now().isoformat()
        }

    def first_last_messages(self):
        """Get first and last messages"""
        if self.df.empty:
            return {}

        first_msg = self.df.iloc[0]
        last_msg = self.df.iloc[-1]

        return {
            'first_message': {
                'datetime': str(first_msg['datetime']),
                'sender': first_msg['sender'],
                'message': first_msg['message'][:200] + ('...' if len(first_msg['message']) > 200 else '')
            },
            'last_message': {
                'datetime': str(last_msg['datetime']),
                'sender': last_msg['sender'],
                'message': last_msg['message'][:200] + ('...' if len(last_msg['message']) > 200 else '')
            }
        }

    def icebreaker_analysis(self):
        """Identify conversation starters"""
        if self.df.empty:
            return {}

        substantial_mask = self.df['message'].str.len() > 10
        if substantial_mask.any():
            first_substantial = self.df[substantial_mask].iloc[0]
            return {
                "sender": first_substantial['sender'],
                "datetime": str(first_substantial['datetime']),
                "message": first_substantial['message'][:200] + (
                    '...' if len(first_substantial['message']) > 200 else '')
            }
        return {}

    def calculate_response_metrics(self):
        """Calculate comprehensive response time metrics"""
        if self.df.empty:
            return {}

        users = list(self.df['sender'].unique())
        response_data = {}

        for sender in users:
            for responder in users:
                if sender != responder:
                    responses = []
                    sender_indices = self.df[self.df['sender'] == sender].index

                    for idx in sender_indices:
                        if idx + 10 < len(self.df):
                            next_msgs = self.df.iloc[idx + 1:idx + 10]
                        else:
                            next_msgs = self.df.iloc[idx + 1:]

                        responder_msgs = next_msgs[next_msgs['sender'] == responder]

                        if len(responder_msgs) > 0:
                            first_response = responder_msgs.iloc[0]
                            response_time = (first_response['datetime'] - self.df.iloc[idx][
                                'datetime']).total_seconds() / 60

                            if 0 < response_time < 1440:  # Within 24 hours
                                responses.append(response_time)

                    if responses:
                        response_data[f"{sender}_to_{responder}"] = {
                            'avg_response_time_minutes': float(np.mean(responses)),
                            'median_response_time_minutes': float(np.median(responses)),
                            'fastest_response_minutes': float(min(responses)),
                            'slowest_response_minutes': float(max(responses)),
                            'response_count': int(len(responses)),
                            'quick_responses_under_1min': int(sum(1 for r in responses if r < 1)),
                            'quick_responses_under_5min': int(sum(1 for r in responses if r < 5)),
                            'slow_responses_over_1hr': int(sum(1 for r in responses if r > 60)),
                            'response_consistency': float(np.std(responses))
                        }

        return response_data

    def detect_ghost_periods(self):
        """Detect periods of silence/ghosting with context"""
        if self.df.empty:
            return {}

        ghost_periods = []
        long_gaps = self.df[self.df['time_gap_minutes'] > 360].copy()  # 6+ hours

        for idx, row in long_gaps.iterrows():
            if idx > 0:
                prev_msg = self.df.iloc[idx - 1]

                ghost_periods.append({
                    'start_time': prev_msg['datetime'].isoformat(),
                    'end_time': row['datetime'].isoformat(),
                    'duration_hours': float(row['time_gap_minutes'] / 60),
                    'who_broke_silence': row['sender'],
                    'last_sender_before_ghost': prev_msg['sender'],
                    'last_message_before_ghost': prev_msg['message'][:200] + (
                        '...' if len(prev_msg['message']) > 200 else ''),
                    'first_message_after_ghost': row['message'][:200] + ('...' if len(row['message']) > 200 else '')
                })

        ghost_periods.sort(key=lambda x: x['duration_hours'], reverse=True)
        silence_breaker_counts = Counter([g['who_broke_silence'] for g in ghost_periods])

        return {
            'total_ghost_periods': len(ghost_periods),
            'longest_ghost_hours': float(ghost_periods[0]['duration_hours']) if ghost_periods else 0,
            'top_10_ghost_periods': ghost_periods[:10],
            'avg_ghost_duration_hours': float(
                np.mean([g['duration_hours'] for g in ghost_periods])) if ghost_periods else 0,
            'who_breaks_silence_most': dict(silence_breaker_counts.most_common()) if ghost_periods else {}
        }

    def analyze_word_patterns(self):
        """Comprehensive word and language analysis"""
        if self.df.empty:
            return {}

        all_text = ' '.join(self.df['message'].astype(str))
        words = self.word_pattern.findall(all_text.lower())
        meaningful_words = [w for w in words if w not in self.generic_words and len(w) > 2]

        # Language-specific analysis
        english_words = self.english_pattern.findall(all_text)
        khmer_words = self.khmer_pattern.findall(all_text)

        # Word frequency
        word_counter = Counter(meaningful_words)

        # Bigrams and trigrams
        bigram_counts = Counter(zip(meaningful_words, meaningful_words[1:])) if len(meaningful_words) > 1 else Counter()
        trigram_counts = Counter(zip(meaningful_words, meaningful_words[1:], meaningful_words[2:])) if len(
            meaningful_words) > 2 else Counter()

        # Per-user analysis
        user_words = {}
        for sender in self.df['sender'].unique():
            user_msgs = self.df[self.df['sender'] == sender]['message'].astype(str)
            if len(user_msgs) > 0:
                user_text = ' '.join(user_msgs)
                user_word_list = self.word_pattern.findall(user_text.lower())
                user_meaningful_words = [w for w in user_word_list if w not in self.generic_words and len(w) > 2]

                user_words[sender] = {
                    'total_words': len(user_word_list),
                    'unique_words': len(set(user_word_list)),
                    'meaningful_words': len(user_meaningful_words),
                    'vocabulary_richness': float(
                        len(set(user_word_list)) / len(user_word_list)) if user_word_list else 0.0,
                    'top_words': [(w, int(c)) for w, c in Counter(user_meaningful_words).most_common(20)],
                    'avg_word_length': float(np.mean([len(w) for w in user_word_list])) if user_word_list else 0.0
                }

        return {
            'total_words': len(words),
            'meaningful_words': len(meaningful_words),
            'unique_words': len(set(words)),
            'unique_meaningful_words': len(set(meaningful_words)),
            'top_50_meaningful_words': [(w, int(c)) for w, c in word_counter.most_common(50)],
            'top_20_bigrams': [{"phrase": f"{b[0]} {b[1]}", "count": c} for b, c in bigram_counts.most_common(20)],
            'top_15_trigrams': [{"phrase": f"{t[0]} {t[1]} {t[2]}", "count": c} for t, c in
                                trigram_counts.most_common(15)],
            'english_word_count': len(english_words),
            'khmer_word_count': len(khmer_words),
            'language_ratio': {
                'english_percentage': float(len(english_words) / len(words) * 100) if words else 0.0,
                'khmer_percentage': float(len(khmer_words) / len(words) * 100) if words else 0.0
            },
            'user_word_analysis': user_words
        }

    def emoji_analysis(self):
        """Analyze emoji usage patterns"""
        if self.df.empty:
            return {}

        all_emojis_text = ' '.join(self.df[self.df['has_emoji']]['message'].astype(str))
        all_emojis = self.emoji_pattern.findall(all_emojis_text)
        emoji_counter = Counter(all_emojis)

        return {
            'total_emojis_used': len(all_emojis),
            'unique_emojis': len(set(all_emojis)),
            'top_20_emojis': [{"emoji": e, "count": c} for e, c in emoji_counter.most_common(20)],
            'emoji_usage_rate': float(self.df['has_emoji'].mean() * 100)
        }

    def analyze_conversation_patterns(self):
        """Deep conversation pattern analysis"""
        if self.df.empty:
            return {}

        conversations = []
        for conv_id in self.df['conversation_id'].unique():
            conv_msgs = self.df[self.df['conversation_id'] == conv_id]

            if len(conv_msgs) >= 3:
                duration = (conv_msgs['datetime'].max() - conv_msgs['datetime'].min()).total_seconds() / 60
                participants = conv_msgs['sender'].nunique()

                conversations.append({
                    'id': int(conv_id),
                    'message_count': int(len(conv_msgs)),
                    'duration_minutes': float(duration),
                    'participants': int(participants),
                    'start_time': conv_msgs['datetime'].min().isoformat(),
                    'end_time': conv_msgs['datetime'].max().isoformat(),
                    'starter': conv_msgs.iloc[0]['sender'],
                    'ender': conv_msgs.iloc[-1]['sender'],
                    'avg_message_length': float(conv_msgs['message_length'].mean()),
                    'total_words': int(conv_msgs['word_count'].sum())
                })

        longest_conversations = sorted(conversations, key=lambda x: x['message_count'], reverse=True)[:10]
        most_intense = sorted(conversations, key=lambda x: x['message_count'] / max(x['duration_minutes'], 1),
                              reverse=True)[:10]

        starter_counts = Counter([c['starter'] for c in conversations])
        ender_counts = Counter([c['ender'] for c in conversations])

        return {
            'total_conversations': len(conversations),
            'avg_conversation_length': float(
                np.mean([c['message_count'] for c in conversations])) if conversations else 0,
            'avg_conversation_duration_minutes': float(
                np.mean([c['duration_minutes'] for c in conversations])) if conversations else 0,
            'longest_conversations': longest_conversations,
            'most_intense_conversations': most_intense,
            'conversation_starters': dict(starter_counts.most_common()),
            'conversation_enders': dict(ender_counts.most_common())
        }

    def temporal_patterns(self):
        """Analyze temporal messaging patterns"""
        if self.df.empty:
            return {}

        hourly_activity = self.df['hour'].value_counts().sort_index()
        daily_activity = self.df['day_of_week'].value_counts()
        monthly_activity = self.df.groupby(self.df['datetime'].dt.to_period('M')).size()

        # Night owl and early bird analysis
        night_messages = self.df[self.df['hour'].isin([22, 23, 0, 1, 2])]
        early_bird_messages = self.df[self.df['hour'].isin([5, 6, 7, 8])]

        return {
            'hourly_distribution': hourly_activity.to_dict(),
            'daily_distribution': daily_activity.to_dict(),
            'monthly_trend': {str(k): int(v) for k, v in monthly_activity.items()},
            'peak_hour': int(hourly_activity.idxmax()),
            'quietest_hour': int(hourly_activity.idxmin()),
            'most_active_day': daily_activity.idxmax(),
            'least_active_day': daily_activity.idxmin(),
            'night_owl_percentage': float(len(night_messages) / len(self.df) * 100),
            'early_bird_percentage': float(len(early_bird_messages) / len(self.df) * 100),
            'weekend_activity_percentage': float(len(self.df[self.df['is_weekend']]) / len(self.df) * 100)
        }

    def analyze_user_behavior(self):
        """Individual user behavior analysis"""
        user_analysis = {}

        for sender in self.df['sender'].unique():  # Changed from hardcoded ['me', 'smt']
            user_msgs = self.df[self.df['sender'] == sender]

            if len(user_msgs) == 0:
                continue

            # Basic stats
            total_messages = len(user_msgs)
            total_chars = user_msgs['message_length'].sum()
            avg_msg_length = user_msgs['message_length'].mean()

            # Time patterns
            peak_hours_series = user_msgs['hour'].value_counts().head(3)
            peak_hours = {int(k): int(v) for k, v in peak_hours_series.items()}

            active_days_series = user_msgs['day_of_week'].value_counts()
            active_days = {k: int(v) for k, v in active_days_series.items()}

            # Communication style
            emoji_rate = user_msgs['has_emoji'].mean() * 100
            question_rate = user_msgs['has_question'].mean() * 100
            exclamation_rate = user_msgs['has_exclamation'].mean() * 100
            caps_rate = user_msgs['has_caps'].mean() * 100

            # Language usage
            khmer_rate = user_msgs['has_khmer'].mean() * 100
            english_rate = user_msgs['has_english'].mean() * 100

            # Conversation behavior - FIXED: use time_gap_minutes
            initiation_count = len(user_msgs[user_msgs['time_gap_minutes'] > 60])
            continuation_rate = user_msgs['is_continuation'].mean() * 100

            # Response patterns - FIXED: use time_gap_minutes
            quick_responses = len(user_msgs[user_msgs['time_gap_minutes'] < 5])

            user_analysis[sender] = {
                'total_messages': int(total_messages),
                'total_characters': int(total_chars),
                'avg_message_length': float(avg_msg_length),
                'longest_message': int(user_msgs['message_length'].max()),
                'shortest_message': int(user_msgs['message_length'].min()),
                'peak_hours': peak_hours,
                'active_days': active_days,
                'emoji_usage_rate': float(emoji_rate),
                'question_rate': float(question_rate),
                'exclamation_rate': float(exclamation_rate),
                'caps_usage_rate': float(caps_rate),
                'khmer_usage_rate': float(khmer_rate),
                'english_usage_rate': float(english_rate),
                'conversation_initiations': int(initiation_count),
                'continuation_rate': float(continuation_rate),
                'quick_responses_under_5min': int(quick_responses),
                'avg_words_per_message': float(user_msgs['word_count'].mean()),
                'vocabulary_size': len(set(' '.join(user_msgs['message']).lower().split()))
            }

        return user_analysis

    # And the fixed calculate_relationship_metrics method:
    def calculate_relationship_metrics(self):
        """Calculate relationship strength indicators"""
        total_days = (self.df['date'].max() - self.df['date'].min()).days + 1
        daily_avg = len(self.df) / total_days

        # Consistency metrics
        daily_message_counts = self.df.groupby('date').size()
        consistency_score = 1 - (daily_message_counts.std() / daily_message_counts.mean())

        # Engagement metrics - FIXED: use time_gap_minutes
        avg_response_time = self.df['time_gap_minutes'].median()
        long_conversations = len(
            [c for c in self.analyze_conversation_patterns()['longest_conversations'] if c['message_count'] > 50])

        # Balance metrics - FIXED: use dynamic sender names
        user_balance = {}
        for sender in self.df['sender'].unique():
            user_pct = len(self.df[self.df['sender'] == sender]) / len(self.df) * 100
            user_balance[sender] = user_pct

        # Calculate balance score (how evenly distributed the messages are)
        sender_percentages = list(user_balance.values())
        if len(sender_percentages) == 2:
            balance_score = 100 - abs(sender_percentages[0] - sender_percentages[1])
        else:
            # For more than 2 senders, calculate how far from equal distribution
            ideal_pct = 100 / len(sender_percentages)
            balance_score = 100 - sum(abs(pct - ideal_pct) for pct in sender_percentages) / len(sender_percentages)

        return {
            'total_days': int(total_days),
            'daily_average_messages': float(daily_avg),
            'consistency_score': float(consistency_score),
            'avg_response_time_minutes': float(avg_response_time),
            'long_conversations_count': int(long_conversations),
            'communication_balance': user_balance,
            'balance_score': float(balance_score),
            'peak_single_day_messages': int(daily_message_counts.max()),
            'most_active_date': str(daily_message_counts.idxmax()),
            'relationship_intensity': 'EXTREMELY_HIGH' if daily_avg > 100 else 'HIGH' if daily_avg > 50 else 'MODERATE'
        }

    def generate_comprehensive_report(self):
        """Generate complete JSON report"""
        # Basic dataset info
        total_messages = len(self.df)
        date_range = {
            'start_date': str(self.df['date'].min()),
            'end_date': str(self.df['date'].max()),
            'total_days': (self.df['date'].max() - self.df['date'].min()).days + 1
        }

        participants = list(self.df['sender'].unique())

        self.report = {
            'dataset_overview': {
                'total_messages': total_messages,
                'date_range': date_range,
                'participants': participants,
                'analysis_timestamp': datetime.now().isoformat()
            },
            'response_metrics': self.calculate_response_metrics(),
            'ghost_analysis': self.detect_ghost_periods(),
            'word_analysis': self.analyze_word_patterns(),
            'conversation_patterns': self.analyze_conversation_patterns(),
            'user_behavior': self.analyze_user_behavior(),
            'relationship_metrics': self.calculate_relationship_metrics()
        }

        return self.report

    def run_analysis(self):
        """Run complete analysis and return JSON report"""
        self.load_and_preprocess()
        report = self.generate_comprehensive_report()

        # Save to file
        with open('telegram_analysis_report.json', 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)

        return report
