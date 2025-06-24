import pandas as pd
import re
from collections import Counter

def _create_thematic_report(df: pd.DataFrame, keywords: set, theme_name: str) -> dict:
    if df.empty or 'text_content' not in df.columns:
        return {}
    analysis_df = df[~df['is_reaction']].copy()
    total_messages = len(analysis_df)
    if total_messages == 0:
        return {'total_matching_messages': 0}

    pattern = r'\b(?:' + '|'.join(re.escape(k) for k in keywords) + r')\b'
    thematic_df = analysis_df[analysis_df['text_content'].str.contains(pattern, case=False, na=False)].copy()

    if thematic_df.empty:
        return {'total_matching_messages': 0}

    all_found_words = re.findall(pattern, ' '.join(thematic_df['text_content'].tolist()).lower())
    most_used_words = [{"word": w, "count": c} for w, c in Counter(all_found_words).most_common(15)]

    user_stats = {}
    for sender, group in thematic_df.groupby('sender', observed=False):
        user_words_found = re.findall(pattern, ' '.join(group['text_content']).lower())
        user_stats[str(sender)] = {
            'count': len(group),
            'top_words_used': Counter(user_words_found).most_common(5)
        }

    top_messages_df = thematic_df.sort_values('message_length', ascending=False).head(5)
    top_messages = [{
        'sender': row['sender'],
        'message': row['message'],
        'datetime': row['datetime'].isoformat()
    } for _, row in top_messages_df.iterrows()]

    return {
        'total_matching_messages': len(thematic_df),
        f'{theme_name}_intensity_percent': (len(thematic_df) / total_messages) * 100,
        'top_senders': [{"user": u, "count": int(c)} for u, c in thematic_df['sender'].value_counts().head(5).items()],
        'top_messages': top_messages,
        'most_used_words': most_used_words,
        'user_stats': user_stats
    }

def analyze_argument_language(df: pd.DataFrame, argument_words: set) -> dict:
    return _create_thematic_report(df, argument_words, 'argument')

def analyze_sad_tone(df: pd.DataFrame, sad_words: set) -> dict:
    return _create_thematic_report(df, sad_words, 'sadness')

def analyze_romance_tone(df: pd.DataFrame, romance_words: set) -> dict:
    return _create_thematic_report(df, romance_words, 'romance')

def analyze_sexual_tone(df: pd.DataFrame, sexual_words: set) -> dict:
    return _create_thematic_report(df, sexual_words, 'sexual_content')

def analyze_happy_tone(df: pd.DataFrame, positive_words: set) -> dict:
    return _create_thematic_report(df, positive_words, 'happy_content')


import pandas as pd
import re
from collections import Counter
from transformers import pipeline
from ..sentiment_lexicons import COMPREHENSIVE_STOPWORDS # Assuming your stopwords are in this file

# A global variable to hold the pipeline, so it's only loaded once.
CLASSIFIER_PIPELINE = None

def _get_word_stats(texts: list[str], stopwords: set) -> list[dict]:
    """Helper function to calculate most used words from a list of texts."""
    all_text = ' '.join(texts).lower()
    # Use a simple regex to find words, excluding pure numbers
    words = re.findall(r'\b[a-z]+\b', all_text)
    meaningful_words = [word for word in words if word not in stopwords]
    return [{"word": w, "count": c} for w, c in Counter(meaningful_words).most_common(15)]

def analyze_emotions_with_hf(df: pd.DataFrame, confidence_threshold: float = 0.65) -> dict:
    """
    Analyzes chat messages for multiple emotional themes using a Hugging Face
    Zero-Shot Classification model. This replaces the keyword-based approach.

    Args:
        df (pd.DataFrame): The chat dataframe.
        confidence_threshold (float): The minimum score for a classification to be accepted.

    Returns:
        dict: A dictionary containing reports for each emotional theme.
    """
    global CLASSIFIER_PIPELINE
    # Initialize the model pipeline only once to save time and memory
    if CLASSIFIER_PIPELINE is None:
        print("Initializing Hugging Face Zero-Shot pipeline...")
        # We use a multilingual model capable of handling various languages including English and Khmer
        CLASSIFIER_PIPELINE = pipeline(
            "zero-shot-classification",
            model="MoritzLaurer/mDeBERTa-v3-base-mnli-xnli"
        )
        print("Pipeline initialized.")

    # 1. Define the themes we want to classify. Using descriptive phrases helps the model.
    candidate_labels = [
        "happy, joyful, celebratory",
        "sad, depressing, grieving",
        "romantic, loving, affectionate",
        "angry, argumentative, conflict",
    ]
    # Map these descriptive labels to the simple theme names used in your reports
    label_to_theme_map = {
        "happy, joyful, celebratory": "happy_content",
        "sad, depressing, grieving": "sadness",
        "romantic, loving, affectionate": "romance",
        "angry, argumentative, conflict": "argument",
    }

    # 2. Prepare the data for classification
    analysis_df = df[~df['is_reaction'] & df['text_content'].str.strip().ne('')].copy()
    if analysis_df.empty:
        return {theme: {'total_matching_messages': 0} for theme in label_to_theme_map.values()}

    messages_to_classify = analysis_df['text_content'].tolist()

    # 3. Run classification. The model will assign the most likely label to each message.
    # We set multi_label to False because we want the single best category for each message.
    print(f"Classifying {len(messages_to_classify)} messages...")
    results = CLASSIFIER_PIPELINE(messages_to_classify, candidate_labels, multi_label=False)
    print("Classification complete.")

    # 4. Process results and build reports for each theme
    final_reports = {}
    total_messages_analyzed = len(analysis_df)

    for descriptive_label, theme_name in label_to_theme_map.items():
        # Find all messages classified with the current label above the confidence threshold
        matching_indices = [
            i for i, result in enumerate(results)
            if result['labels'][0] == descriptive_label and result['scores'][0] >= confidence_threshold
        ]

        thematic_df = analysis_df.iloc[matching_indices].copy()

        if thematic_df.empty:
            final_reports[theme_name] = {'total_matching_messages': 0}
            continue

        # --- Recreate the exact output structure ---

        # Get top messages (longest ones)
        top_messages_df = thematic_df.sort_values('message_length', ascending=False).head(5)
        top_messages = [{
            'sender': row['sender'],
            'message': row['message'],
            'datetime': row['datetime'].isoformat()
        } for _, row in top_messages_df.iterrows()]

        # Get user-specific stats
        user_stats = {}
        for sender, group in thematic_df.groupby('sender', observed=False):
            user_stats[str(sender)] = {
                'count': len(group),
                'top_words_used': _get_word_stats(group['text_content'].tolist(), COMPREHENSIVE_STOPWORDS)
            }

        # Assemble the final report for this theme
        return {
            'total_matching_messages': len(thematic_df),
            f'{theme_name}_intensity_percent': (len(thematic_df) / total_messages_analyzed) * 100,
            'top_senders': [{"user": str(u), "count": int(c)} for u, c in thematic_df['sender'].value_counts().head(5).items()],
            'top_messages': top_messages,
            'most_used_words': _get_word_stats(thematic_df['text_content'].tolist(), COMPREHENSIVE_STOPWORDS),
            'user_stats': user_stats,
            'note': 'MoritzLaurer/mDeBERTa-v3-base-mnli-xnli'
        }
