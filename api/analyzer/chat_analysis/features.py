import pandas as pd
from collections import Counter
import re

def analyze_reactions(df: pd.DataFrame) -> dict:
    reaction_df = df[df['is_reaction']].copy()
    if reaction_df.empty:
        return {'total_reactions': 0, 'note': 'No reactions found.'}

    total_reactions = len(reaction_df)
    reactions_by_type = reaction_df['reaction_type'].value_counts()
    reactions_given_by_user = reaction_df['sender'].value_counts()

    return {
        'total_reactions': int(total_reactions),
        'reaction_counts_by_type': [{"type": str(k), "count": int(v)} for k, v in reactions_by_type.items()],
        'reactions_given_by_user': [{"user": str(k), "count": int(v)} for k, v in reactions_given_by_user.items()],
        'note': "This analysis counts who GAVE reactions."
    }

def analyze_attachments(df: pd.DataFrame) -> dict:
    if 'is_attachment' not in df.columns:
        return {'error': 'is_attachment column not found.'}

    attachment_df = df[df['is_attachment']].copy()
    if attachment_df.empty:
        return {'total_attachments': 0}

    accompanying_text = ' '.join(attachment_df['text_content'].dropna())
    word_counts = Counter(re.findall(r'\b\w+\b', accompanying_text.lower()))
    top_words_with_attachments = [{"word": w, "count": c} for w, c in word_counts.most_common(20)]

    return {
        'total_attachments': int(attachment_df.shape[0]),
        'attachments_per_user': attachment_df['sender'].value_counts().to_dict(),
        'top_words_with_attachments': top_words_with_attachments,
        'note': 'This analyzes the count of attachment messages and the text sent with them.'
    }