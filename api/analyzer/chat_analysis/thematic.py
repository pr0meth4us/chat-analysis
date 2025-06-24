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
