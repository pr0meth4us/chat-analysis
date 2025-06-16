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
        self.sad_words = sentiment_lexicons.sad_words
        self.romance_words = sentiment_lexicons.romance_words
        self.sexual_words = sentiment_lexicons.sexual_words
        self.argument_words = sentiment_lexicons.argument_words

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

    def generate_comprehensive_report(self, modules_to_run=None):
        """
        Generate a report by running specific or all analysis modules.

        Args:
            modules_to_run (list, optional): A list of module names to run.
                                            If None, all modules will be run.
                                            Example: ['dataset_overview', 'sentiment_analysis']
        """
        if self.df.empty:
            self.report = {"error": "No data available for analysis."}
            return self.report

        # Register of all available analysis modules and their functions
        ANALYSIS_REGISTRY = {
            'dataset_overview': af.dataset_overview,
            'first_last_messages': af.first_last_messages,
            'icebreaker_analysis': af.icebreaker_analysis,
            'conversation_patterns': af.analyze_conversation_patterns,
            'response_metrics': af.calculate_response_metrics,
            'relationship_metrics': af.calculate_relationship_metrics,  # Depends on the two above
            'ghost_periods': af.detect_ghost_periods,
            'user_behavior': af.analyze_user_behavior,
            'temporal_patterns': af.temporal_patterns,
            'word_analysis': lambda df: af.analyze_word_patterns(df, self.word_pattern, self.english_pattern,
                                                                 self.khmer_pattern, self.generic_words,
                                                                 self.khmer_stopwords),
            'emoji_analysis': af.emoji_analysis,
            'consecutive_day_streak': af.analyze_unbroken_streaks,
            'questions_analysis': lambda df: af.analyze_questions(df, self.sentence_pattern),
            'reaction_analysis': af.analyze_reactions,
            'sentiment_analysis': lambda df: af.analyze_sentiment(df, self.word_pattern, self.positive_words,
                                                                  self.negative_words),
            'shared_links_analysis': lambda df: af.analyze_shared_links(df, self.url_pattern),
            'topic_modeling': lambda df: af.analyze_topics_with_nmf(df, self.generic_words),
            'sad_tone_analysis': lambda df: af.analyze_sad_tone(df, self.sad_words),
            'romance_tone_analysis': lambda df: af.analyze_romance_tone(df, self.romance_words),
            'sexual_tone_analysis': lambda df: af.analyze_sexual_tone(df, self.sexual_words),
            'rapid_fire_analysis': af.analyze_rapid_fire_conversations,
            'argument_analysis': af.analyze_argument_language,
        }

        # Determine which modules to run
        if modules_to_run is None:
            # If no specific modules are requested, run all of them
            active_modules = list(ANALYSIS_REGISTRY.keys())
        else:
            # Run only the requested modules that exist in the registry
            active_modules = [m for m in modules_to_run if m in ANALYSIS_REGISTRY]

            # --- Handle Dependencies ---
            # If relationship_metrics is requested, ensure its dependencies are also run
            if 'relationship_metrics' in active_modules:
                if 'conversation_patterns' not in active_modules:
                    active_modules.insert(0, 'conversation_patterns')
                if 'response_metrics' not in active_modules:
                    active_modules.insert(0, 'response_metrics')

        # Adjust total steps for progress tracking
        self.total_steps = len(active_modules)
        self.current_step_index = 0
        self._update_progress(f"Starting analysis of {self.total_steps} selected modules.")

        # --- Run the selected modules ---
        # Special handling for dependent modules
        conversation_patterns_result = None
        response_metrics_result = None

        for module_name in active_modules:
            try:
                if module_name == 'relationship_metrics':
                    # Ensure dependencies are calculated if not already present
                    if 'conversation_patterns' not in self.report:
                        self.report['conversation_patterns'] = ANALYSIS_REGISTRY['conversation_patterns'](self.df)
                    if 'response_metrics' not in self.report:
                        self.report['response_metrics'] = ANALYSIS_REGISTRY['response_metrics'](self.df)

                    # Call with dependency results
                    result = af.calculate_relationship_metrics(self.df, self.report['conversation_patterns'],
                                                               self.report['response_metrics'])
                else:
                    # Call the function from the registry
                    module_function = ANALYSIS_REGISTRY[module_name]
                    result = module_function(self.df)

                self.report[module_name] = result
                self._update_progress(f"Completed: {module_name}")

            except Exception as e:
                error_message = f"Error in module '{module_name}': {e}"
                print(error_message)
                self.report[module_name] = {"error": error_message}
                self._update_progress(f"Failed: {module_name}", status='failed', error=error_message)

        # Final serialization step
        self.report = self.convert_to_serializable(self.report)
        self._update_progress("Report generation complete!")

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