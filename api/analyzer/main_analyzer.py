# analyzer/main_analyzer.py

import json
import re
import time
import warnings
from datetime import datetime, date
from flask import Response
import numpy as np
import pandas as pd
import emoji

# Import modularized components
from . import sentiment_lexicons
from . import analysis_modules as af

warnings.filterwarnings('ignore')

class ChatAnalyzer:
    """
    A comprehensive chat analyzer that combines features for chat data analysis.
    This modularized version orchestrates analysis by calling specialized functions.
    """

    def __init__(self, file_path_or_messages, input_type='file', progress_callback=None):
        self.input_type = input_type
        self.file_path = file_path_or_messages if input_type == 'file' else None
        self.data = [] if input_type == 'file' else file_path_or_messages
        self.df = pd.DataFrame()
        self.report = {}

        # Timing and progress tracking
        self.start_time = time.time()
        self.last_step_time = self.start_time
        self.progress_callback = progress_callback
        self.total_steps = 18  # Adjusted for modular calls
        self.current_step_index = 0

        # Pre-compile regex patterns for performance
        self.url_pattern = re.compile(r'https?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(),]|%[0-9a-fA-F][0-9a-fA-F])+|www\.')
        self.word_pattern = re.compile(r'\b\w+\b')
        self.english_pattern = re.compile(r'\b[a-zA-Z]+\b')
        self.khmer_pattern = re.compile(r'[\u1780-\u17FF]+')
        self.sentence_pattern = re.compile(r'(?<!\w\.\w.)(?<![A-Z][a-z]\.)(?<=\.|\?|\!)\s')
        self.reaction_pattern = re.compile(r'^(Liked|Loved|Laughed at|Emphasized|Questioned|Disliked) “.*”$')

        # Load lexicons from the dedicated module
        self.generic_words = sentiment_lexicons.generic_words
        self.khmer_stopwords = sentiment_lexicons.khmer_stopwords
        self.positive_words = sentiment_lexicons.positive_words
        self.negative_words = sentiment_lexicons.negative_words

    def _update_progress(self, step_name, status='in_progress', **kwargs):
        """Internal helper to calculate and send progress."""
        self.current_step_index += 1
        current_time = time.time()
        elapsed_overall = current_time - self.start_time
        time_taken_step = current_time - self.last_step_time
        self.last_step_time = current_time
        progress_percent = (self.current_step_index / self.total_steps) * 100

        print(f"[{elapsed_overall:.2f}s] {step_name} ({progress_percent:.1f}%)")
        if self.progress_callback:
            try:
                self.progress_callback(
                    step_name=step_name, progress_percent=progress_percent,
                    time_taken_step_seconds=time_taken_step, time_elapsed_total_seconds=elapsed_overall,
                    message_count=len(self.data), status=status, **kwargs
                )
            except Exception as e:
                print(f"Error in progress callback: {e}")

    def convert_to_serializable(self, obj):
        """Convert numpy/pandas types to JSON serializable types recursively."""
        if isinstance(obj, (np.integer, np.int64, np.int32)): return int(obj)
        if isinstance(obj, (np.floating, np.float64, np.float32)): return float(obj)
        if isinstance(obj, np.ndarray): return obj.tolist()
        if isinstance(obj, pd.Series): return obj.to_dict()
        if isinstance(obj, (datetime, pd.Timestamp, date)): return obj.isoformat()
        if isinstance(obj, dict): return {k: self.convert_to_serializable(v) for k, v in obj.items()}
        if isinstance(obj, (list, tuple)): return [self.convert_to_serializable(i) for i in obj]
        if pd.isna(obj): return None
        return obj

    def load_and_preprocess(self):
        """Load and preprocess data with comprehensive feature engineering."""
        self._update_progress("Loading data from source")
        if self.input_type == 'file' and self.file_path:
            with open(self.file_path, 'r', encoding='utf-8') as f:
                content = f.read().strip()
                self.data = json.loads(content) if content.startswith('[') else [json.loads(line) for line in content.split('\n') if line.strip()]

        if not self.data:
            self._update_progress("No data to preprocess.", status='failed', error="No initial data.")
            return

        self._update_progress(f"Data loaded: {len(self.data)} messages. Preprocessing...")
        df = pd.DataFrame(self.data)

        required_cols = ['message', 'sender', 'timestamp', 'source']
        if not all(col in df.columns for col in required_cols):
            self._update_progress("Error: Missing required columns.", status='failed')
            return

        df['source'] = df['source'].astype('category')
        df['message'] = df['message'].astype('string').fillna('')
        df['sender'] = df['sender'].astype('category')
        df['datetime'] = pd.to_datetime(df['timestamp'], errors='coerce')
        df.dropna(subset=['datetime'], inplace=True)
        df.sort_values('datetime', inplace=True, ignore_index=True)

        if df.empty:
            self._update_progress("Error: No valid timestamps.", status='failed')
            return

        dt = df['datetime'].dt
        df['date'] = dt.date
        df['hour'] = dt.hour
        df['day_of_week'] = dt.day_name()
        df['week_of_year'] = dt.isocalendar().week.astype(int)
        df['is_weekend'] = dt.weekday >= 5

        messages_series = df['message'].astype(str)
        df['message_length'] = messages_series.str.len()
        df['word_count'] = messages_series.str.split().str.len()
        df['emoji_list'] = messages_series.apply(emoji.emoji_list)
        df['has_emoji'] = df['emoji_list'].apply(lambda x: len(x) > 0)
        df['emoji_count'] = df['emoji_list'].apply(len)
        df['has_question'] = messages_series.str.contains(r'\?', na=False)
        df['has_url'] = messages_series.str.contains(self.url_pattern, na=False)

        def get_reaction_type(msg):
            match = self.reaction_pattern.match(msg)
            return match.group(1) if match else None

        df['reaction_type'] = messages_series.apply(get_reaction_type)
        df['is_reaction'] = df['reaction_type'].notna()
        df.loc[df['is_reaction'], ['message_length', 'word_count']] = 0

        df['time_gap_minutes'] = df['datetime'].diff().dt.total_seconds().fillna(0) / 60
        new_conv_mask = (df['time_gap_minutes'] > 60) | (df['sender'] != df['sender'].shift(1))
        df['conversation_id'] = new_conv_mask.cumsum().astype(int)

        self.df = df
        self._update_progress("Preprocessing complete!")

    def generate_comprehensive_report(self):
        """Generate complete JSON report by calling modularized analysis functions."""
        if self.df.empty:
            self.report = {"error": "No data available for analysis."}
            self._update_progress("Report generation failed.", status='failed')
            return self.report

        self._update_progress("Generating comprehensive report")

        # --- Call analysis functions one by one ---
        self.report['dataset_overview'] = af.dataset_overview(self.df)
        self._update_progress("Calculated dataset overview")

        self.report['first_last_messages'] = af.first_last_messages(self.df)
        self._update_progress("Extracted first and last messages")

        self.report['icebreaker_analysis'] = af.icebreaker_analysis(self.df)
        self._update_progress("Analyzed icebreakers")

        # Dependent analyses
        conversation_patterns = af.analyze_conversation_patterns(self.df)
        self.report['conversation_patterns'] = conversation_patterns
        self._update_progress("Analyzed conversation patterns")

        response_metrics = af.calculate_response_metrics(self.df)
        self.report['response_metrics'] = response_metrics
        self._update_progress("Calculated response metrics")

        self.report['relationship_metrics'] = af.calculate_relationship_metrics(self.df, conversation_patterns, response_metrics)
        self._update_progress("Calculated relationship metrics")

        self.report['ghost_periods'] = af.detect_ghost_periods(self.df)
        self._update_progress("Detected ghost periods")

        self.report['user_behavior'] = af.analyze_user_behavior(self.df)
        self._update_progress("Analyzed user behavior")

        self.report['temporal_patterns'] = af.temporal_patterns(self.df)
        self._update_progress("Analyzed temporal patterns")

        self.report['word_analysis'] = af.analyze_word_patterns(self.df, self.word_pattern, self.english_pattern, self.khmer_pattern, self.generic_words, self.khmer_stopwords)
        self._update_progress("Analyzed word patterns")

        self.report['emoji_analysis'] = af.emoji_analysis(self.df)
        self._update_progress("Analyzed emoji usage")

        self.report['consecutive_day_streak'] = af.analyze_unbroken_streaks(self.df)
        self._update_progress("Analyzed unbroken message streaks")

        self.report['questions_analysis'] = af.analyze_questions(self.df, self.sentence_pattern)
        self._update_progress("Analyzed questions")

        self.report['reaction_analysis'] = af.analyze_reactions(self.df)
        self._update_progress("Analyzed message reactions")

        self.report['sentiment_analysis'] = af.analyze_sentiment(self.df, self.word_pattern, self.positive_words, self.negative_words)
        self._update_progress("Performed sentiment analysis")

        self.report['shared_links_analysis'] = af.analyze_shared_links(self.df, self.url_pattern)
        self._update_progress("Analyzed shared links")

        self.report['topic_modeling'] = af.analyze_topics_with_nmf(self.df, self.generic_words)
        self._update_progress("Performed NMF topic modeling")

        # Final serialization step
        self.report = self.convert_to_serializable(self.report)
        self._update_progress("Comprehensive report generation complete!")
        return self.report

    def run_analysis(self):
        """Run complete analysis and return minified JSON response."""
        self.start_time = time.time()
        self.current_step_index = 0
        self._update_progress("Starting full chat analysis process.", status='in_progress')

        self.load_and_preprocess()
        if self.df.empty:
            err = {"error": "No valid data to analyze after preprocessing."}
            self._update_progress("Analysis aborted.", status='failed', error=err['error'])
            return Response(json.dumps(err, separators=(',', ':')), mimetype='application/json')

        report_dict = self.generate_comprehensive_report()
        minified = json.dumps(report_dict, separators=(',', ':'), ensure_ascii=False)

        output_filename = 'chat_analysis_report.json'
        try:
            with open(output_filename, 'w', encoding='utf-8') as f:
                f.write(minified)
            self._update_progress(f"Report saved to {output_filename}.", status='completed', report_path=output_filename)
        except Exception as e:
            err = {"error": f"Failed to save report: {e}"}
            self._update_progress(f"Failed to save report: {e}", status='failed', error=str(e))
            return Response(json.dumps(err, separators=(',', ':')), mimetype='application/json')

        final_elapsed_time = time.time() - self.start_time
        print(f"Full analysis completed in {final_elapsed_time:.2f} seconds.")

        return Response(minified, mimetype='application/json')