import pandas as pd
import re
from collections import Counter
import numpy as np
from urllib.parse import urlparse
import emoji

def analyze_word_patterns(df: pd.DataFrame, word_pattern: re.Pattern, generic_words: set, **kwargs) -> dict:
    if df.empty or 'text_content' not in df.columns: return {}
    analysis_df = df.copy()

    text_corpus = ' '.join(analysis_df['text_content'].astype(str).tolist())
    all_words = word_pattern.findall(text_corpus.lower())
    meaningful_words = [w for w in all_words if w not in generic_words and len(w) > 2]

    word_counter = Counter(meaningful_words)
    bigram_counts = Counter(zip(meaningful_words, meaningful_words[1:]))
    trigram_counts = Counter(zip(meaningful_words, meaningful_words[1:], meaningful_words[2:]))

    user_analysis = {}
    for sender in analysis_df['sender'].unique():
        user_text = ' '.join(analysis_df[analysis_df['sender'] == sender]['text_content'].astype(str).tolist())
        user_words = word_pattern.findall(user_text.lower())
        if not user_words: continue

        user_meaningful_words = [w for w in user_words if w not in generic_words and len(w) > 2]
        user_analysis[str(sender)] = {
            'total_words': len(user_words),
            'unique_words': len(set(user_words)),
            'vocabulary_richness': len(set(user_words)) / len(user_words) if user_words else 0,
            'top_20_words': [{"word": w, "count": c} for w, c in Counter(user_meaningful_words).most_common(20)],
            'avg_word_length': np.mean([len(w) for w in user_words]) if user_words else 0
        }

    return {
        'overall_word_counts': {
            'total_words': len(all_words),
            'unique_words': len(set(all_words)),
            'total_meaningful_words': len(meaningful_words),
            'unique_meaningful_words': len(set(meaningful_words)),
        },
        'top_50_meaningful_words': [{"word": w, "count": c} for w, c in word_counter.most_common(50)],
        'top_20_bigrams': [{"phrase": " ".join(p), "count": c} for p, c in bigram_counts.most_common(20)],
        'top_20_trigrams': [{"phrase": " ".join(p), "count": c} for p, c in trigram_counts.most_common(20)],
        'user_word_analysis': user_analysis
    }

def emoji_analysis(df: pd.DataFrame) -> dict:
    if df.empty or 'has_emoji' not in df.columns: return {}
    if not df['has_emoji'].any(): return {'total_emojis_used': 0}

    emoji_df = df[df['has_emoji']].copy()
    if emoji_df.empty: return {'total_emojis_used': 0}

    emoji_df['emoji_list'] = emoji_df['message'].apply(emoji.emoji_list)
    all_emojis = [e['emoji'] for msg_emojis in emoji_df['emoji_list'] for e in msg_emojis]
    emoji_counter = Counter(all_emojis)

    user_emoji_analysis = {}
    for sender in emoji_df['sender'].unique():
        user_emojis = [e['emoji'] for msg_emojis in emoji_df[emoji_df['sender'] == sender]['emoji_list'] for e in msg_emojis]
        if not user_emojis: continue

        user_emoji_analysis[str(sender)] = {
            'total_emojis_sent': len(user_emojis),
            'unique_emojis_used': len(set(user_emojis)),
            'top_10_emojis': [{"emoji": e, "count": c} for e, c in Counter(user_emojis).most_common(10)]
        }

    return {
        'total_emojis_used': len(all_emojis),
        'unique_emojis_overall': len(set(all_emojis)),
        'messages_with_emojis_percent': df['has_emoji'].mean() * 100,
        'top_20_emojis_overall': [{"emoji": e, "count": c} for e, c in emoji_counter.most_common(20)],
        'user_emoji_analysis': user_emoji_analysis
    }

def analyze_questions(df: pd.DataFrame, sentence_pattern: re.Pattern) -> dict:
    if df.empty or 'has_question' not in df.columns: return {}
    questions_df = df[df['has_question']].copy()
    if questions_df.empty: return {'total_questions_asked': 0}

    question_data = {}
    for _, row in questions_df.iterrows():
        sentences = [s.strip() for s in sentence_pattern.split(row['text_content']) if '?' in s]
        for sentence in sentences:
            question_data.setdefault(str(row['sender']), []).append({
                'question_text': sentence,
                'datetime': row['datetime'].isoformat()
            })

    user_question_analysis = {
        sender: {
            'total_questions': len(q_list),
            'latest_5_questions': sorted(q_list, key=lambda x: x['datetime'], reverse=True)[:5]
        } for sender, q_list in question_data.items()
    }

    return {
        'total_questions_asked': sum(len(q_list) for q_list in question_data.values()),
        'user_question_analysis': user_question_analysis
    }

def analyze_shared_links(df: pd.DataFrame, url_pattern: re.Pattern) -> dict:
    if df.empty or 'has_url' not in df.columns: return {}
    link_msgs = df[df['has_url']].copy()
    if link_msgs.empty: return {'total_urls_shared': 0}

    all_urls = [url for sublist in link_msgs['text_content'].str.findall(url_pattern) for url in sublist]
    if not all_urls: return {'total_urls_shared': 0}

    def get_domain(url: str) -> str:
        try:
            if not url.startswith(('http://', 'https://')): url = 'http://' + url
            return urlparse(url).netloc.replace('www.', '')
        except: return "unknown_domain"

    domain_counts = Counter(get_domain(url) for url in all_urls if get_domain(url))
    user_link_counts = link_msgs['sender'].value_counts()

    return {
        'total_urls_shared': len(all_urls),
        'unique_domains_shared': len(domain_counts),
        'top_10_shared_domains': [{"domain": d, "count": int(c)} for d, c in domain_counts.most_common(10)],
        'links_per_user': [{"user": u, "count": int(c)} for u,c in user_link_counts.items()]
    }