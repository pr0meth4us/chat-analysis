import json
import re
import time
import warnings
from collections import Counter, defaultdict
from datetime import datetime, timedelta

import numpy as np
import pandas as pd
# NMF and TfidfVectorizer are imported but not used in the provided class methods.
# If they were intended for topic modeling, that logic would need to be added.
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.decomposition import NMF
import emoji # For better emoji parsing

warnings.filterwarnings('ignore')


class ChatAnalyzer:
    """
    A comprehensive chat analyzer that combines features for chat data analysis.
    Optimized for performance with step-by-step time logging and progress reporting.
    """

    def __init__(self, file_path_or_messages, input_type='file', progress_callback=None):
        """
        Initialize the analyzer with either a file path or message list.

        Args:
            file_path_or_messages: Either a file path (string) or list of message dictionaries
            input_type: 'file' for file path, 'messages' for message list
            progress_callback (callable, optional): A function to call for progress updates.
                                                     It should accept 'step_name', 'progress_percent',
                                                     'time_taken_step', 'time_elapsed_total', 'message_count'.
        """
        self.input_type = input_type
        self.file_path = file_path_or_messages if input_type == 'file' else None
        self.data = [] if input_type == 'file' else file_path_or_messages

        self.df = None
        self.report = {}
        self.start_time = time.time()  # Overall analysis start time
        self.last_step_time = self.start_time # To calculate time taken per step
        self.progress_callback = progress_callback
        self.total_steps = 26 # Approximate number of major steps for percentage calculation (0-25)
        self.current_step_index = 0

        # Pre-compile regex patterns for performance
        self.emoji_pattern = re.compile(r'[\U0001F600-\U0001F64F\U0001F300-\U0001F5FF\U0001F680-\U0001F6FF\U0001F1E0-\U0001F1FF]+')
        self.url_pattern = re.compile(
            r'https?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(),]|%[0-9a-fA-F][0-9a-fA-F])+|www\.')
        self.word_pattern = re.compile(r'\b\w+\b')
        self.english_pattern = re.compile(r'\b[a-zA-Z]+\b')
        self.khmer_pattern = re.compile(r'[\u1780-\u17FF]+')
        self.caps_pattern = re.compile(r'[A-Z]{3,}')
        self.sentence_pattern = re.compile(r'(?<!\w\.\w.)(?<![A-Z][a-z]\.)(?<=\.|\?|\!)\s')

        # Comprehensive list of generic words to exclude from analysis (expanded for better topic extraction)
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
            'clean', 'dirty', 'safe', 'dangerous', 'strong', 'weak', 'healthy', 'sick', 'dead', 'alive',
            # Additional common filler/generic words
            'haha', 'hehe', 'lol', 'lmao', 'rofl', 'okay', 'great', 'good', 'bad', 'well', 'um', 'uh', 'hmm',
            'really', 'like', 'you know', 'sort of', 'kind of', 'literally', 'basically', 'actually', 'though',
            'anything', 'something', 'everything', 'nothing', 'someone', 'everyone', 'anyone', 'no one',
            'where', 'when', 'why', 'what', 'how', 'who', 'whom', 'whose', 'which', 'if', 'then', 'else',
            'because', 'since', 'while', 'until', 'although', 'even', 'though', 'whereas', 'whether',
            'such as', 'for example', 'e.g.', 'i.e.', 'etc', 'etcetera', 'et cetera', 'about', 'around',
            'through', 'throughout', 'without', 'within', 'between', 'among', 'across', 'against', 'behind',
            'below', 'beneath', 'beside', 'besides', 'between', 'beyond', 'but', 'by', 'down', 'during',
            'except', 'for', 'from', 'in', 'inside', 'into', 'near', 'of', 'off', 'on', 'onto', 'out', 'outside',
            'over', 'past', 'round', 'since', 'than', 'through', 'to', 'toward', 'towards', 'under', 'until',
            'up', 'upon', 'versus', 'via', 'with', 'within', 'without', 'worth'
        }
        self.khmer_stopwords = set() # Placeholder, could be expanded

    def _update_progress(self, step_name, status='in_progress', **kwargs):
        """Internal helper to calculate and send progress."""
        self.current_step_index += 1
        current_time = time.time()
        elapsed_overall = current_time - self.start_time
        time_taken_step = current_time - self.last_step_time
        self.last_step_time = current_time

        progress_percent = (self.current_step_index / self.total_steps) * 100
        message_count = len(self.data) if self.data else 0

        # Log to console
        print(f"[{elapsed_overall:.2f}s, Step took {time_taken_step:.2f}s] {step_name} ({progress_percent:.1f}% done)")

        # Call the external progress callback if provided
        if self.progress_callback:
            try:
                self.progress_callback(
                    step_name=step_name,
                    progress_percent=progress_percent,
                    time_taken_step_seconds=time_taken_step,
                    time_elapsed_total_seconds=elapsed_overall,
                    message_count=message_count,
                    status=status,
                    **kwargs
                )
            except Exception as e:
                print(f"Error in progress callback: {e}")

    def convert_to_serializable(self, obj):
        """Convert numpy/pandas types to JSON serializable types recursively."""
        if isinstance(obj, (np.integer, np.int64, np.int32)):
            return int(obj)
        elif isinstance(obj, (np.floating, np.float64, np.float32)):
            return float(obj)
        elif isinstance(obj, np.ndarray):
            return obj.tolist()
        elif isinstance(obj, pd.Series):
            return obj.to_dict()
        elif isinstance(obj, (datetime, pd.Timestamp)): # Handle both datetime and pandas Timestamp
            return obj.isoformat()
        elif isinstance(obj, (dict, defaultdict)):
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
        """Load data from file or use provided messages."""
        self._update_progress("Loading data from source")
        if self.input_type == 'file' and self.file_path:
            with open(self.file_path, 'r', encoding='utf-8') as f:
                content = f.read().strip()
                if content.startswith('['):
                    self.data = json.loads(content)
                else: # Assume line-delimited JSON
                    self.data = [json.loads(line) for line in content.split('\n') if line.strip()]
            self._update_progress(f"Data loaded: {len(self.data)} messages.")
        else:
            self._update_progress(f"Using provided message data: {len(self.data)} messages.")

    def load_and_preprocess(self):
        """Load and preprocess data with comprehensive feature engineering."""
        self.load_data() # This method now includes its own progress updates.

        if not self.data:
            self.df = pd.DataFrame()
            self._update_progress("No data to preprocess. DataFrame is empty.", status='failed', error="No initial data.")
            return

        self._update_progress(f"Converting messages to DataFrame and ensuring required columns.")
        self.df = pd.DataFrame(self.data)

        # Ensure required columns exist and handle missing ones gracefully
        required_cols = ['message', 'sender', 'timestamp']
        for col in required_cols:
            if col not in self.df.columns:
                self._update_progress(f"Error: Missing required column '{col}'. Aborting preprocessing.", status='failed', error=f"Missing column: {col}")
                self.df = pd.DataFrame()
                return

        self.df['message'] = self.df['message'].astype('string').fillna('')
        self.df['sender'] = self.df['sender'].astype('category')

        self._update_progress("Converting timestamps and sorting DataFrame.")
        self.df['datetime'] = pd.to_datetime(self.df['timestamp'], errors='coerce')
        self.df.dropna(subset=['datetime'], inplace=True) # Drop rows with invalid timestamps

        if self.df.empty:
            self._update_progress("Error: No valid timestamps found after conversion. DataFrame is empty.", status='failed', error="No valid timestamps.")
            return

        self.df.sort_values('datetime', inplace=True, ignore_index=True)

        self._update_progress("Computing time features.")
        dt = self.df['datetime'].dt
        self.df['date'] = dt.date # Keep as date object for date calculations
        self.df['hour'] = dt.hour
        self.df['minute'] = dt.minute
        self.df['day_of_week'] = dt.day_name()
        self.df['month'] = dt.month
        self.df['year'] = dt.year
        self.df['quarter'] = dt.quarter
        self.df['week_of_year'] = dt.isocalendar().week.astype(int) # Convert to int
        self.df['is_weekend'] = dt.weekday >= 5
        self.df['is_workday'] = dt.weekday < 5
        self.df['season'] = self.df['month'].map(
            {12: 'Winter', 1: 'Winter', 2: 'Winter',
             3: 'Spring', 4: 'Spring', 5: 'Spring',
             6: 'Summer', 7: 'Summer', 8: 'Summer',
             9: 'Fall', 10: 'Fall', 11: 'Fall'})

        self._update_progress("Computing message content features.")
        messages_series = self.df['message'].astype(str) # Use a local variable for efficiency
        self.df['message_length'] = messages_series.str.len()
        self.df['word_count'] = messages_series.str.split().str.len()
        self.df['char_per_word'] = self.df['message_length'] / self.df['word_count'].replace(0, 1)

        # Emoji detection using `emoji` library for accuracy
        self.df['emoji_list'] = messages_series.apply(emoji.emoji_list)
        self.df['has_emoji'] = self.df['emoji_list'].apply(lambda x: len(x) > 0)
        self.df['emoji_count'] = self.df['emoji_list'].apply(len)

        self.df['has_question'] = messages_series.str.contains(r'\?', na=False)
        self.df['question_count'] = messages_series.str.count(r'\?')
        self.df['has_exclamation'] = messages_series.str.contains(r'!', na=False)
        self.df['exclamation_count'] = messages_series.str.count(r'!')
        self.df['has_caps'] = messages_series.str.contains(self.caps_pattern, na=False)
        self.df['caps_ratio'] = messages_series.str.count(r'[A-Z]') / self.df['message_length'].replace(0, 1)
        self.df['has_numbers'] = messages_series.str.contains(r'\d', na=False)
        self.df['number_count'] = messages_series.str.count(r'\d')
        self.df['has_url'] = messages_series.str.contains(self.url_pattern, na=False)
        self.df['has_mention'] = messages_series.str.contains(r'@', na=False)
        self.df['punctuation_density'] = messages_series.str.count(r'[!@#$%^&*(),.?":{}|<>]') / self.df['message_length'].replace(0, 1)

        self._update_progress("Performing language detection (English/Khmer).")
        self.df['has_khmer'] = messages_series.str.contains(self.khmer_pattern, na=False)
        self.df['has_english'] = messages_series.str.contains(self.english_pattern, na=False)

        self._update_progress("Computing conversation flow features.")
        self.df['prev_sender'] = self.df['sender'].shift(1)
        self.df['next_sender'] = self.df['sender'].shift(-1)
        self.df['is_continuation'] = (self.df['sender'] == self.df['prev_sender'])

        self._update_progress("Calculating time gaps and conversation IDs.")
        self.df['time_gap_minutes'] = self.df['datetime'].diff().dt.total_seconds().fillna(0) / 60
        self.df['time_to_next'] = self.df['datetime'].shift(-1).sub(self.df['datetime']).dt.total_seconds().fillna(0) / 60

        new_conversation_mask = (self.df['time_gap_minutes'] > 60) | (self.df['sender'] != self.df['prev_sender'])
        self.df['conversation_id'] = new_conversation_mask.cumsum()
        self.df['conversation_id'] = self.df['conversation_id'].astype(int)

        self.df['msg_sequence_id'] = (self.df['sender'] != self.df['prev_sender']).cumsum()
        self.df['msg_sequence_id'] = self.df['msg_sequence_id'].astype(int)
        sequence_lengths = self.df.groupby('msg_sequence_id').size()
        self.df['sequence_length'] = self.df['msg_sequence_id'].map(sequence_lengths).fillna(0).astype(int)
        self.df['position_in_sequence'] = self.df.groupby('msg_sequence_id').cumcount() + 1

        self._update_progress("Preprocessing complete!")


    def dataset_overview(self):
        """Basic dataset overview."""
        self._update_progress("Calculating dataset overview")
        if self.df.empty:
            return {}

        overview = {
            'total_messages': len(self.df),
            'date_range': {
                'start_date': self.df['date'].min(),
                'end_date': self.df['date'].max(),
                'total_days': int((self.df['date'].max() - self.df['date'].min()).days + 1)
            },
            'participants': list(self.df['sender'].unique()),
            'analysis_timestamp': datetime.now().isoformat()
        }
        return overview

    def first_last_messages(self):
        """Get first and last messages."""
        self._update_progress("Extracting first and last messages")
        if self.df.empty:
            return {}

        first_msg = self.df.iloc[0]
        last_msg = self.df.iloc[-1]

        messages_info = {
            'first_message': {
                'datetime': first_msg['datetime'],
                'sender': str(first_msg['sender']),
                'message': first_msg['message'][:200] + ('...' if len(first_msg['message']) > 200 else '')
            },
            'last_message': {
                'datetime': last_msg['datetime'],
                'sender': str(last_msg['sender']),
                'message': last_msg['message'][:200] + ('...' if len(last_msg['message']) > 200 else '')
            }
        }
        return messages_info

    def icebreaker_analysis(self):
        """Identify conversation starters."""
        self._update_progress("Analyzing icebreakers")
        if self.df.empty:
            return {}

        first_messages_in_convos = self.df.drop_duplicates(subset='conversation_id', keep='first')

        substantial_icebreakers = first_messages_in_convos[first_messages_in_convos['message_length'] > 10]

        if not substantial_icebreakers.empty:
            first_substantial_overall = substantial_icebreakers.iloc[0]
            icebreaker_info = {
                "sender": str(first_substantial_overall['sender']),
                "datetime": first_substantial_overall['datetime'],
                "message": first_substantial_overall['message'][:200] + (
                    '...' if len(first_substantial_overall['message']) > 200 else '')
            }
        else:
            icebreaker_info = {}
        return icebreaker_info

    def calculate_response_metrics(self):
        """Calculate comprehensive response time metrics using vectorized operations."""
        self._update_progress("Calculating response metrics")
        if self.df.empty:
            return {}

        df_shifted = self.df.shift(-1)

        # Create a combined DataFrame for easier filtering and grouping
        # Include original sender and datetime, and next sender and datetime
        combined_df = pd.DataFrame({
            'current_sender': self.df['sender'],
            'current_datetime': self.df['datetime'],
            'next_sender': df_shifted['sender'],
            'next_datetime': df_shifted['datetime']
        })

        # Identify messages that are a response (sender is different from next sender)
        # and where next message is from a different user, and within a reasonable time
        response_pairs_df = combined_df[
            (combined_df['current_sender'] != combined_df['next_sender']) & # Current sender is not the next sender
            (combined_df['current_datetime'].notna()) &                    # Ensure current datetime exists
            (combined_df['next_datetime'].notna())                         # Ensure next datetime exists
            ].copy() # Use .copy() to avoid SettingWithCopyWarning

        # Calculate time_to_next for these specific pairs directly
        response_pairs_df['response_time_minutes'] = (response_pairs_df['next_datetime'] - response_pairs_df['current_datetime']).dt.total_seconds() / 60

        # Filter for valid response times (positive and within 24 hours)
        valid_responses = response_pairs_df[
            (response_pairs_df['response_time_minutes'] > 0) &
            (response_pairs_df['response_time_minutes'] <= 1440) # 24 hours
            ]

        if valid_responses.empty:
            return {}

        # Group by the original sender (current_sender) and the responder (next_sender)
        # and perform all aggregations directly using .agg()
        aggregated_metrics = valid_responses.groupby(['current_sender', 'next_sender'])['response_time_minutes'].agg(
            avg_response_time_minutes='mean',
            median_response_time_minutes='median',
            fastest_response_minutes='min',
            slowest_response_minutes='max',
            response_count='count',
            response_std='std' # Calculate std deviation
        ).fillna(0) # Fill NaN for std if only one response

        # Convert to dictionary with correct key format
        response_data = {}
        for (sender, responder), row in aggregated_metrics.iterrows():
            key = f"{sender}_to_{responder}"
            response_data[key] = {
                'avg_response_time_minutes': float(row['avg_response_time_minutes']),
                'median_response_time_minutes': float(row['median_response_time_minutes']),
                'fastest_response_minutes': float(row['fastest_response_minutes']),
                'slowest_response_minutes': float(row['slowest_response_minutes']),
                'response_count': int(row['response_count']),
                'quick_responses_under_1min': int((valid_responses[(valid_responses['current_sender'] == sender) &
                                                                   (valid_responses['next_sender'] == responder)]['response_time_minutes'] < 1).sum()),
                'quick_responses_under_5min': int((valid_responses[(valid_responses['current_sender'] == sender) &
                                                                   (valid_responses['next_sender'] == responder)]['response_time_minutes'] < 5).sum()),
                'slow_responses_over_1hr': int((valid_responses[(valid_responses['current_sender'] == sender) &
                                                                (valid_responses['next_sender'] == responder)]['response_time_minutes'] > 60).sum()),
                'response_consistency': float(row['response_std']) if row['response_count'] > 1 else 0.0 # Use calculated std
            }
        return response_data

    def detect_ghost_periods(self):
        """Detect periods of silence/ghosting with context."""
        self._update_progress("Detecting ghost periods")
        if self.df.empty:
            return {}

        long_gaps_df = self.df[self.df['time_gap_minutes'] > 720].copy() # 12+ hours

        ghost_periods = []
        for idx, row in long_gaps_df.iterrows():
            if idx > 0:
                prev_msg = self.df.loc[idx - 1]

                ghost_periods.append({
                    'start_time': prev_msg['datetime'],
                    'end_time': row['datetime'],
                    'duration_hours': float(row['time_gap_minutes'] / 60),
                    'who_broke_silence': str(row['sender']),
                    'last_sender_before_ghost': str(prev_msg['sender']),
                    'last_message_before_ghost': prev_msg['message'][:200] + (
                        '...' if len(prev_msg['message']) > 200 else ''),
                    'first_message_after_ghost': row['message'][:200] + ('...' if len(row['message']) > 200 else '')
                })

        ghost_periods.sort(key=lambda x: x['duration_hours'], reverse=True)
        silence_breaker_counts = Counter([g['who_broke_silence'] for g in ghost_periods])

        ghost_analysis_results = {
            'total_ghost_periods': len(ghost_periods),
            'longest_ghost_hours': float(ghost_periods[0]['duration_hours']) if ghost_periods else 0.0,
            'top_10_ghost_periods': ghost_periods[:10],
            'avg_ghost_duration_hours': float(
                np.mean([g['duration_hours'] for g in ghost_periods])) if ghost_periods else 0.0,
            'who_breaks_silence_most': dict(silence_breaker_counts.most_common()) if ghost_periods else {}
        }
        return ghost_analysis_results

    def analyze_word_patterns(self):
        """Comprehensive word and language analysis, including per-user top words by language."""
        self._update_progress("Analyzing word patterns")
        if self.df.empty:
            return {}

        # Optimized word extraction (flattens list of lists from .str.findall)
        all_words_lists = self.df['message'].astype(str).str.lower().str.findall(self.word_pattern)
        words_overall = [word for sublist in all_words_lists for word in sublist]

        meaningful_words_overall = [w for w in words_overall if w not in self.generic_words and len(w) > 2]

        english_words_overall = self.english_pattern.findall(' '.join(words_overall)) # Re-extract from original casing if needed, or from words_overall
        khmer_words_overall = self.khmer_pattern.findall(' '.join(self.df['message'].astype(str).tolist())) # Re-extract from original for Khmer

        word_counter_overall = Counter(meaningful_words_overall)

        bigram_counts_overall = Counter(zip(meaningful_words_overall, meaningful_words_overall[1:])) if len(meaningful_words_overall) > 1 else Counter()
        trigram_counts_overall = Counter(zip(meaningful_words_overall, meaningful_words_overall[1:], meaningful_words_overall[2:])) if len(meaningful_words_overall) > 2 else Counter()

        user_word_analysis = {}
        for sender in self.df['sender'].unique():
            user_msgs_text = ' '.join(self.df[self.df['sender'] == sender]['message'].astype(str).tolist())
            user_word_list = self.word_pattern.findall(user_msgs_text.lower())
            user_meaningful_words = [w for w in user_word_list if w not in self.generic_words and len(w) > 2]

            user_english_words = [w for w in self.english_pattern.findall(user_msgs_text) if w.lower() not in self.generic_words and len(w) > 2]
            user_khmer_words = [w for w in self.khmer_pattern.findall(user_msgs_text) if w not in self.khmer_stopwords and len(w) > 1]

            user_word_analysis[str(sender)] = {
                'total_words': len(user_word_list),
                'unique_words': len(set(user_word_list)),
                'meaningful_words_count': len(user_meaningful_words),
                'vocabulary_richness': float(len(set(user_word_list)) / len(user_word_list)) if user_word_list else 0.0,
                'top_meaningful_words': [(w, int(c)) for w, c in Counter(user_meaningful_words).most_common(20)],
                'avg_word_length': float(np.mean([len(w) for w in user_word_list])) if user_word_list else 0.0,
                'top_english_words': [(w, int(c)) for w, c in Counter(user_english_words).most_common(15)],
                'top_khmer_words': [(w, int(c)) for w, c in Counter(user_khmer_words).most_common(15)]
            }

        word_analysis_results = {
            'total_words_overall': len(words_overall),
            'meaningful_words_overall': len(meaningful_words_overall),
            'unique_words_overall': len(set(words_overall)),
            'unique_meaningful_words_overall': len(set(meaningful_words_overall)),
            'top_50_meaningful_words_overall': [(w, int(c)) for w, c in word_counter_overall.most_common(50)],
            'top_20_bigrams_overall': [{"phrase": " ".join(b), "count": int(c)} for b, c in bigram_counts_overall.most_common(20)],
            'top_15_trigrams_overall': [{"phrase": " ".join(t), "count": int(c)} for t, c in trigram_counts_overall.most_common(15)],
            'english_word_count_overall': len(english_words_overall),
            'khmer_word_count_overall': len(khmer_words_overall),
            'language_ratio_overall': {
                'english_percentage': float(len(english_words_overall) / len(words_overall) * 100) if words_overall else 0.0,
                'khmer_percentage': float(len(khmer_words_overall) / len(words_overall) * 100) if words_overall else 0.0
            },
            'user_word_analysis': user_word_analysis
        }
        return word_analysis_results

    def emoji_analysis(self):
        """Analyze emoji usage patterns per user."""
        self._update_progress("Analyzing emoji usage")
        if self.df.empty:
            return {}

        all_emojis = []
        for msg_emojis in self.df['emoji_list'].tolist():
            all_emojis.extend([e['emoji'] for e in msg_emojis])
        emoji_counter_overall = Counter(all_emojis)

        user_emoji_analysis = {}
        for sender in self.df['sender'].unique():
            user_emoji_list = []
            for msg_emojis in self.df[self.df['sender'] == sender]['emoji_list'].tolist():
                user_emoji_list.extend([e['emoji'] for e in msg_emojis])

            user_emoji_analysis[str(sender)] = {
                'total_emojis': len(user_emoji_list),
                'unique_emojis': len(set(user_emoji_list)),
                'top_emojis': [{"emoji": e, "count": int(c)} for e, c in Counter(user_emoji_list).most_common(10)],
                'emoji_usage_rate_percent': float(self.df[self.df['sender'] == sender]['has_emoji'].mean() * 100)
            }

        emoji_analysis_results = {
            'total_emojis_used_overall': len(all_emojis),
            'unique_emojis_overall': len(set(all_emojis)),
            'top_20_emojis_overall': [{"emoji": e, "count": int(c)} for e, c in emoji_counter_overall.most_common(20)],
            'emoji_usage_rate_overall_percent': float(self.df['has_emoji'].mean() * 100),
            'user_emoji_analysis': user_emoji_analysis
        }
        return emoji_analysis_results

    def analyze_conversation_patterns(self):
        """Deep conversation pattern analysis, including most intense conversations."""
        self._update_progress("Analyzing conversation patterns")
        if self.df.empty:
            return {
                'total_conversations': 0,
                'avg_conversation_length_messages': 0.0,
                'avg_conversation_duration_minutes': 0.0,
                'longest_conversations': [],
                'most_intense_conversations': [],
                'conversation_starters_counts': {},
                'conversation_enders_counts': {}
            }

        conversations = []
        for conv_id in self.df['conversation_id'].unique():
            conv_msgs = self.df[self.df['conversation_id'] == conv_id].copy()
            if len(conv_msgs) < 2:
                continue

            start_time = conv_msgs['datetime'].min()
            end_time = conv_msgs['datetime'].max()
            duration_minutes = (end_time - start_time).total_seconds() / 60
            participants = list(conv_msgs['sender'].unique())
            effective_duration_hours = max(duration_minutes / 60, 0.05)

            conv_data = {
                'id': int(conv_id),
                'total_messages': int(len(conv_msgs)),
                'duration_minutes': float(duration_minutes),
                'participants': [str(p) for p in participants],
                'start_time': start_time,
                'end_time': end_time,
                'starter_message': conv_msgs.iloc[0]['message'][:150] +
                                   ('...' if len(conv_msgs.iloc[0]['message']) > 150 else ''),
                'starter_sender': str(conv_msgs.iloc[0]['sender']),
                'ender_message': conv_msgs.iloc[-1]['message'][:150] +
                                 ('...' if len(conv_msgs.iloc[-1]['message']) > 150 else ''),
                'ender_sender': str(conv_msgs.iloc[-1]['sender']),
                'avg_message_length': float(conv_msgs['message_length'].mean()),
                'total_words': int(conv_msgs['word_count'].sum()),
                'intensity_score': float(len(conv_msgs) / effective_duration_hours)
            }
            conversations.append(conv_data)

        # Sort by total_messages and intensity_score
        longest_conversations_raw = sorted(
            conversations,
            key=lambda x: x.get('total_messages', 0),
            reverse=True
        )[:10]
        most_intense_conversations_raw = sorted(
            conversations,
            key=lambda x: x.get('intensity_score', 0.0),
            reverse=True
        )[:10]

        # Helper to extract only the needed fields
        def _extract_conv_data(c_item):
            if not isinstance(c_item, dict):
                return None
            return {
                'starter_message': c_item.get('starter_message', ''),
                'ender_message': c_item.get('ender_message', ''),
                'duration_minutes': c_item.get('duration_minutes', 0.0),
                'total_messages': c_item.get('total_messages', 0),
                'participants': c_item.get('participants', [])
            }

        final_longest = [d for c in longest_conversations_raw
                         if (d := _extract_conv_data(c))]
        final_intense = [d for c in most_intense_conversations_raw
                         if (d := _extract_conv_data(c))]

        # Count who starts and ends
        starter_counts = Counter(c['starter_sender'] for c in conversations)
        ender_counts = Counter(c['ender_sender'] for c in conversations)

        result = {
            'total_conversations': len(conversations),
            'avg_conversation_length_messages': float(
                np.mean([c['total_messages'] for c in conversations])
            ) if conversations else 0.0,
            'avg_conversation_duration_minutes': float(
                np.mean([c['duration_minutes'] for c in conversations])
            ) if conversations else 0.0,
            'longest_conversations': final_longest,
            'most_intense_conversations': final_intense,
            'conversation_starters_counts': dict(starter_counts.most_common()),
            'conversation_enders_counts': dict(ender_counts.most_common())
        }
        return result

    def temporal_patterns(self):
        """Analyze temporal messaging patterns."""
        self._update_progress("Analyzing temporal patterns")
        if self.df.empty:
            return {}

        hourly_activity = self.df['hour'].value_counts().sort_index()
        full_hourly_activity = {i: int(hourly_activity.get(i, 0)) for i in range(24)}

        ordered_days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        daily_activity = self.df['day_of_week'].value_counts()
        full_daily_activity = {day: int(daily_activity.get(day, 0)) for day in ordered_days}


        monthly_activity_period = self.df['datetime'].dt.to_period('M').value_counts().sort_index()
        monthly_trend = {str(k): int(v) for k, v in monthly_activity_period.items()}

        night_messages = self.df[self.df['hour'].isin([22, 23, 0, 1, 2])]
        early_bird_messages = self.df[self.df['hour'].isin([5, 6, 7, 8])]

        total_messages = len(self.df)
        temporal_results = {
            'hourly_distribution': full_hourly_activity,
            'daily_distribution': full_daily_activity,
            'monthly_trend': monthly_trend,
            'peak_hour': int(hourly_activity.idxmax()) if not hourly_activity.empty else None,
            'quietest_hour': int(hourly_activity.idxmin()) if not hourly_activity.empty else None,
            'most_active_day': daily_activity.idxmax() if not daily_activity.empty else None,
            'least_active_day': daily_activity.idxmin() if not daily_activity.empty else None,
            'night_owl_percentage': float(len(night_messages) / total_messages * 100) if total_messages > 0 else 0.0,
            'early_bird_percentage': float(len(early_bird_messages) / total_messages * 100) if total_messages > 0 else 0.0,
            'weekend_activity_percentage': float(len(self.df[self.df['is_weekend']]) / total_messages * 100) if total_messages > 0 else 0.0
        }
        return temporal_results

    def analyze_user_behavior(self):
        """Individual user behavior analysis."""
        self._update_progress("Analyzing individual user behavior")
        if self.df.empty:
            return {}

        user_analysis = {}
        for sender in self.df['sender'].unique():
            user_msgs = self.df[self.df['sender'] == sender].copy()

            if user_msgs.empty:
                continue

            total_messages = len(user_msgs)
            total_chars = user_msgs['message_length'].sum()
            avg_msg_length = user_msgs['message_length'].mean()

            peak_hours_series = user_msgs['hour'].value_counts().head(3)
            peak_hours = {int(k): int(v) for k, v in peak_hours_series.items()}

            active_days_series = user_msgs['day_of_week'].value_counts()
            active_days = {k: int(v) for k, v in active_days_series.items()}

            emoji_rate = user_msgs['has_emoji'].mean() * 100
            question_rate = user_msgs['has_question'].mean() * 100
            exclamation_rate = user_msgs['has_exclamation'].mean() * 100
            caps_rate = user_msgs['has_caps'].mean() * 100

            khmer_rate = user_msgs['has_khmer'].mean() * 100
            english_rate = user_msgs['has_english'].mean() * 100

            initiating_messages_count = user_msgs[user_msgs['conversation_id'] != user_msgs['conversation_id'].shift(1)].shape[0]

            continuation_rate = user_msgs['is_continuation'].mean() * 100

            user_analysis[str(sender)] = {
                'total_messages': total_messages,
                'total_characters': int(total_chars),
                'avg_message_length': float(avg_msg_length),
                'longest_message_length': int(user_msgs['message_length'].max()),
                'shortest_message_length': int(user_msgs['message_length'].min()),
                'peak_hours_of_day': peak_hours,
                'active_days_of_week': active_days,
                'emoji_usage_rate_percent': float(emoji_rate),
                'question_asking_rate_percent': float(question_rate),
                'exclamation_usage_rate_percent': float(exclamation_rate),
                'caps_usage_rate_percent': float(caps_rate),
                'khmer_message_rate_percent': float(khmer_rate),
                'english_message_rate_percent': float(english_rate),
                'conversation_initiations_count': int(initiating_messages_count),
                'continuation_rate_within_convos_percent': float(continuation_rate),
                'avg_words_per_message': float(user_msgs['word_count'].mean()),
                'vocabulary_size': len(set(self.word_pattern.findall(' '.join(user_msgs['message']).lower())))
            }
        return user_analysis

    def calculate_relationship_metrics(self, conversation_patterns_data=None): # Accept patterns data
        """Calculate relationship strength indicators."""
        self._update_progress("Calculating relationship metrics")
        if self.df.empty:
            return {}

        total_days = (self.df['date'].max() - self.df['date'].min()).days + 1 if len(self.df) > 0 else 0
        daily_avg_messages = len(self.df) / total_days if total_days > 0 else 0.0

        daily_message_counts = self.df.groupby('date').size()
        consistency_score = 1 - (daily_message_counts.std() / daily_message_counts.mean()) if daily_message_counts.mean() > 0 else 1.0

        response_metrics_raw = self.calculate_response_metrics() # This now has its own progress update
        all_avg_response_times = [metrics['avg_response_time_minutes'] for metrics in response_metrics_raw.values()]
        overall_avg_response_time = float(np.mean(all_avg_response_times)) if all_avg_response_times else 0.0

        if conversation_patterns_data is None:
            conversation_patterns_data = self.analyze_conversation_patterns() # This also has its own progress update

        longest_convs_list = conversation_patterns_data.get('longest_conversations', [])
        long_conversations_count = len([c for c in longest_convs_list if c.get('total_messages', 0) > 50])


        user_balance = {}
        for sender in self.df['sender'].unique():
            user_pct = len(self.df[self.df['sender'] == sender]) / len(self.df) * 100
            user_balance[str(sender)] = float(user_pct)

        sender_percentages = list(user_balance.values())
        if len(sender_percentages) > 1:
            ideal_pct = 100 / len(sender_percentages)
            balance_score = 100 - sum(abs(pct - ideal_pct) for pct in sender_percentages) / len(sender_percentages)
        else:
            balance_score = 100.0

        relationship_intensity = 'LOW'
        if daily_avg_messages > 50 and balance_score > 70:
            relationship_intensity = 'HIGH'
        elif daily_avg_messages > 100 and balance_score > 80:
            relationship_intensity = 'EXTREMELY_HIGH'
        elif daily_avg_messages > 10:
            relationship_intensity = 'MEDIUM'

        relationship_results = {
            'total_days_in_chat': int(total_days),
            'daily_average_messages': float(daily_avg_messages),
            'consistency_score': float(consistency_score),
            'overall_avg_response_time_minutes': float(overall_avg_response_time),
            'long_conversations_count': int(long_conversations_count),
            'communication_balance_percentages': user_balance,
            'balance_score': float(balance_score),
            'peak_single_day_messages': int(daily_message_counts.max()) if not daily_message_counts.empty else 0,
            'most_active_date': daily_message_counts.idxmax().isoformat() if not daily_message_counts.empty else None,
            'relationship_intensity': relationship_intensity
        }
        return relationship_results

    def analyze_unbroken_streaks(self):
        """Find the longest consecutive streak of days with at least one message."""
        self._update_progress("Analyzing unbroken streaks (consecutive days of messaging)")
        if self.df.empty:
            return {}

        unique_dates = self.df['date'].unique()
        unique_dates = sorted([pd.to_datetime(d).date() for d in unique_dates])

        longest_streak_days = 0
        current_streak_days = 0
        current_streak_start_date = None
        longest_streak_start_date = None
        longest_streak_end_date = None

        if len(unique_dates) > 0:
            current_streak_days = 1
            current_streak_start_date = unique_dates[0]

            longest_streak_days = 1
            longest_streak_start_date = unique_dates[0]
            longest_streak_end_date = unique_dates[0]

            for i in range(1, len(unique_dates)):
                if unique_dates[i] == unique_dates[i-1] + timedelta(days=1):
                    current_streak_days += 1
                else:
                    if current_streak_days > longest_streak_days:
                        longest_streak_days = current_streak_days
                        longest_streak_start_date = current_streak_start_date
                        longest_streak_end_date = unique_dates[i-1]

                    current_streak_days = 1
                    current_streak_start_date = unique_dates[i]

            if current_streak_days > longest_streak_days:
                longest_streak_days = current_streak_days
                longest_streak_start_date = current_streak_start_date
                longest_streak_end_date = unique_dates[-1]

        unbroken_streaks_results = {
            'longest_consecutive_days': int(longest_streak_days),
            'streak_start_date': longest_streak_start_date,
            'streak_end_date': longest_streak_end_date,
            'total_active_days': int(len(unique_dates))
        }
        return unbroken_streaks_results

    def analyze_questions(self):
        """Extract and categorize questions asked by each user."""
        self._update_progress("Analyzing questions asked")
        if self.df.empty:
            return {}

        question_data = defaultdict(lambda: {'total_questions': 0, 'questions_asked_details': []})

        questions_df = self.df[self.df['has_question']].copy()

        for idx, row in questions_df.iterrows():
            sender = row['sender']
            message_text = row['message']

            sentences = [s.strip() for s in self.sentence_pattern.split(message_text) if s.strip()]
            for sentence in sentences:
                if '?' in sentence:
                    question_data[sender]['total_questions'] += 1
                    question_data[sender]['questions_asked_details'].append({
                        'message_id': int(row.name),
                        'question_text': sentence[:200] + ('...' if len(sentence) > 200 else ''),
                        'datetime': row['datetime']
                    })

        final_question_results = {}
        for sender, data in question_data.items():
            data['questions_asked_details'].sort(key=lambda x: x['datetime'], reverse=True)
            final_question_results[str(sender)] = {
                'total_questions': data['total_questions'],
                'top_5_latest_questions': data['questions_asked_details'][:5]
            }
        return final_question_results

    def analyze_emojis_by_user(self):
        """Analyze most used emojis by each user"""
        self._update_progress("Analyzing emojis by user")
        if self.df.empty:
            return {}

        user_emoji_analysis = {}
        for sender in self.df['sender'].unique():
            user_msgs = self.df[self.df['sender'] == sender]
            user_emoji_msgs = user_msgs[user_msgs['has_emoji']]

            if len(user_emoji_msgs) > 0:
                all_user_emojis_text = ' '.join(user_emoji_msgs['message'].astype(str))
                user_emojis = self.emoji_pattern.findall(all_user_emojis_text)
                emoji_counter = Counter(user_emojis)

                user_emoji_analysis[sender] = {
                    'total_emojis': len(user_emojis),
                    'unique_emojis': len(set(user_emojis)),
                    'top_10_emojis': [{"emoji": e, "count": c} for e, c in emoji_counter.most_common(10)],
                    'emoji_messages_count': int(len(user_emoji_msgs)),
                    'emoji_usage_percentage': float(len(user_emoji_msgs) / len(user_msgs) * 100)
                }
            else:
                user_emoji_analysis[sender] = {
                    'total_emojis': 0,
                    'unique_emojis': 0,
                    'top_10_emojis': [],
                    'emoji_messages_count': 0,
                    'emoji_usage_percentage': 0.0
                }

        return user_emoji_analysis

    def analyze_topics_and_questions(self):
        """Analyze topics discussed and extract sample questions"""
        self._update_progress("Analyzing topics and questions")
        if self.df.empty:
            return {}

        # Extract questions
        question_msgs = self.df[self.df['has_question']].copy()

        questions_by_user = {}
        for sender in self.df['sender'].unique():
            user_questions = question_msgs[question_msgs['sender'] == sender]
            if len(user_questions) > 0:
                # Get sample questions (avoid very short ones)
                substantial_questions = user_questions[user_questions['message_length'] > 10]
                sample_questions = substantial_questions.sample(min(5, len(substantial_questions)))['message'].tolist()

                questions_by_user[sender] = {
                    'total_questions': int(len(user_questions)),
                    'sample_questions': sample_questions
                }
            else:
                questions_by_user[sender] = {
                    'total_questions': 0,
                    'sample_questions': []
                }

        # Topic analysis using word patterns (simple keyword-based approach)
        all_text = ' '.join(self.df['message'].astype(str).str.lower())

        # Define topic keywords (you can expand this)
        topic_keywords = {
            'work_career': ['work', 'job', 'career', 'office', 'boss', 'salary', 'meeting', 'project', 'business'],
            'food_dining': ['food', 'eat', 'restaurant', 'cook', 'dinner', 'lunch', 'breakfast', 'hungry', 'delicious'],
            'travel_places': ['travel', 'trip', 'vacation', 'hotel', 'flight', 'visit', 'country', 'city', 'airport'],
            'entertainment': ['movie', 'music', 'game', 'show', 'watch', 'play', 'fun', 'party', 'concert'],
            'family_friends': ['family', 'friend', 'parent', 'mother', 'father', 'brother', 'sister', 'relationship'],
            'health_fitness': ['health', 'doctor', 'sick', 'exercise', 'gym', 'tired', 'sleep', 'medicine'],
            'technology': ['phone', 'computer', 'internet', 'app', 'software', 'website', 'tech', 'digital'],
            'education': ['school', 'study', 'learn', 'class', 'teacher', 'student', 'exam', 'university']
        }

        topic_scores = {}
        for topic, keywords in topic_keywords.items():
            score = sum(all_text.count(keyword) for keyword in keywords)
            if score > 0:
                topic_scores[topic] = score

        # Sort topics by frequency
        sorted_topics = sorted(topic_scores.items(), key=lambda x: x[1], reverse=True)

        return {
            'questions_analysis': questions_by_user,
            'topic_analysis': {
                'detected_topics': dict(sorted_topics[:10]),
                'most_discussed_topic': sorted_topics[0][0] if sorted_topics else None,
                'topic_diversity_score': len([s for s in topic_scores.values() if s > 5])
            }
        }
    def generate_comprehensive_report(self):
        """Generate complete JSON report."""
        self._update_progress("Generating comprehensive report")
        if self.df.empty:
            self.report = {"error": "No data available for analysis. Please check file loading or message input."}
            self._update_progress("Report generation failed due to no data.", status='failed', error="No data for report.")
            return self.report

        # Calculate dependent metrics first
        dataset_overview = self.dataset_overview()
        first_last_messages = self.first_last_messages()
        icebreaker_analysis = self.icebreaker_analysis()
        conversation_patterns_data = self.analyze_conversation_patterns() # Calculate once
        response_metrics = self.calculate_response_metrics() # This now triggers its own update
        ghost_periods = self.detect_ghost_periods()
        user_behavior = self.analyze_user_behavior()
        temporal_patterns = self.temporal_patterns()
        word_analysis = self.analyze_word_patterns()
        emoji_analysis = self.emoji_analysis()
        consecutive_day_streak = self.analyze_unbroken_streaks()
        questions_analysis = self.analyze_questions()
        emojis_by_user = self.analyze_emojis_by_user() # Though `emoji_analysis` covers much of this
        inferred_topics = self.analyze_topics_and_questions()
        relationship_metrics = self.calculate_relationship_metrics(conversation_patterns_data=conversation_patterns_data)


        self.report = {
            'dataset_overview': dataset_overview,
            'first_last_messages': first_last_messages,
            'icebreaker_analysis': icebreaker_analysis,
            'relationship_metrics': relationship_metrics,
            'user_behavior': user_behavior,
            'conversation_patterns': conversation_patterns_data, # Use the already calculated one
            'temporal_patterns': temporal_patterns,
            'word_analysis': word_analysis,
            'emoji_analysis': emoji_analysis,
            'consecutive_day_streak': consecutive_day_streak,
            'questions_analysis': questions_analysis,
            'inferred_topics': inferred_topics,
            'response_metrics': response_metrics,
            'ghost_periods': ghost_periods,
            'emojis_by_user': emojis_by_user # Can be added if different from emoji_analysis
        }

        self.report = self.convert_to_serializable(self.report)

        self._update_progress("Comprehensive report generation complete!", status='in_progress')
        return self.report

    def run_analysis(self):
        """Run complete analysis and return JSON report."""
        self.start_time = time.time()
        self.last_step_time = self.start_time
        self.current_step_index = 0 # Reset step index for a new run
        self._update_progress("Starting full chat analysis process.", status='in_progress') # Initial call

        self.load_and_preprocess()

        if self.df.empty:
            self._update_progress("Analysis aborted: No valid data after preprocessing.", status='failed', error="No valid data to analyze after preprocessing.")
            return {"error": "No valid data to analyze after preprocessing."}

        report = self.generate_comprehensive_report()

        output_filename = 'chat_analysis_report.json'
        try:
            with open(output_filename, 'w', encoding='utf-8') as f:
                json.dump(report, f, indent=2, ensure_ascii=False)
            self._update_progress(f"Report saved to {output_filename}.", status='completed', report_path=output_filename)
        except Exception as e:
            self._update_progress(f"Failed to save report: {e}", status='failed', error=f"Report save error: {e}")
            print(f"Error saving report: {e}")
            return {"error": f"Failed to save report: {e}"}


        final_elapsed_time = time.time() - self.start_time
        self._update_progress(f"Full analysis completed in {final_elapsed_time:.2f} seconds.", status='completed',
                              final_elapsed_time=final_elapsed_time)

        return report
