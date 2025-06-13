# chat_analyzer_project/data_loader.py
import json
import pandas as pd
import emoji
from utils.constants import REACTION_PATTERN, URL_PATTERN

class DataLoader:
    """Handles loading and preprocessing of chat data."""
    def __init__(self, file_path):
        self.file_path = file_path
        self.raw_data = []
        self.df = pd.DataFrame()

    def load_and_preprocess(self):
        """Main method to load data and run all preprocessing steps."""
        print("Step 1: Loading data from source...")
        self._load_data_from_file()
        if not self.raw_data:
            print("Error: No data loaded.")
            return None

        print("Step 2: Preprocessing and feature engineering...")
        self._create_dataframe()
        self._preprocess_columns()
        self._compute_time_features()
        self._compute_content_features()
        self._compute_conversation_flow_features()

        print("Preprocessing complete!")
        return self.df

    def _load_data_from_file(self):
        """Loads JSON data from the specified file path."""
        try:
            with open(self.file_path, 'r', encoding='utf-8') as f:
                content = f.read().strip()
                if content.startswith('['):
                    self.raw_data = json.loads(content)
                else: # Assume line-delimited JSON
                    self.raw_data = [json.loads(line) for line in content.split('\n') if line.strip()]
        except Exception as e:
            print(f"Failed to load or parse JSON file: {e}")

    def _create_dataframe(self):
        self.df = pd.DataFrame(self.raw_data)

    def _preprocess_columns(self):
        """Handles column types, sorting, and missing values."""
        self.df['message'] = self.df['message'].astype('string').fillna('')
        self.df['sender'] = self.df['sender'].astype('category')
        self.df['source'] = self.df['source'].astype('category')
        self.df['datetime'] = pd.to_datetime(self.df['timestamp'], errors='coerce')
        self.df.dropna(subset=['datetime'], inplace=True)
        self.df.sort_values('datetime', inplace=True, ignore_index=True)

    def _compute_time_features(self):
        """Adds date and time-based features to the DataFrame."""
        dt = self.df['datetime'].dt
        self.df['date'] = dt.date
        self.df['hour'] = dt.hour
        self.df['day_of_week'] = dt.day_name()
        self.df['is_weekend'] = dt.weekday >= 5

    def _compute_content_features(self):
        """Adds features based on the message content."""
        messages_series = self.df['message']
        self.df['message_length'] = messages_series.str.len()
        self.df['word_count'] = messages_series.str.split().str.len()
        self.df['emoji_list'] = messages_series.apply(emoji.emoji_list)
        self.df['has_emoji'] = self.df['emoji_list'].apply(lambda x: len(x) > 0)
        self.df['has_question'] = messages_series.str.contains(r'\?', na=False)
        self.df['has_url'] = messages_series.str.contains(URL_PATTERN, na=False)

        # Handle message reactions
        self.df['reaction_type'] = messages_series.apply(lambda msg: REACTION_PATTERN.match(msg).group(1) if REACTION_PATTERN.match(msg) else None)
        self.df['is_reaction'] = self.df['reaction_type'].notna()
        self.df.loc[self.df['is_reaction'], ['message_length', 'word_count']] = 0

    def _compute_conversation_flow_features(self):
        """Adds features related to conversation turns and time gaps."""
        self.df['prev_sender'] = self.df['sender'].shift(1)
        self.df['time_gap_minutes'] = self.df['datetime'].diff().dt.total_seconds().fillna(0) / 60
        new_conversation_mask = (self.df['time_gap_minutes'] > 60) | (self.df['sender'] != self.df['prev_sender'])
        self.df['conversation_id'] = new_conversation_mask.cumsum().astype(int)