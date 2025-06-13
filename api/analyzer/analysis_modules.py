# analyzer/analysis_modules.py

import pandas as pd
import numpy as np
import emoji
from collections import Counter, defaultdict
from datetime import datetime, timedelta
from urllib.parse import urlparse
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.decomposition import NMF

# Note: The progress_callback is handled by the main ChatAnalyzer class,
# so the functions here just return the data.

def dataset_overview(df: pd.DataFrame):
    """Basic dataset overview, now including chat platform sources."""
    if df.empty: return {}

    overview = {
        'total_messages': len(df),
        'total_reactions': int(df['is_reaction'].sum()) if 'is_reaction' in df.columns else 0,
        'date_range': {
            'start_date': df['date'].min(),
            'end_date': df['date'].max(),
            'total_days': int((df['date'].max() - df['date'].min()).days + 1)
        },
        'participants': list(df['sender'].unique()),
        'chat_platforms': df['source'].value_counts().to_dict(),
        'analysis_timestamp': datetime.now().isoformat()
    }
    return overview

def analyze_reactions(df: pd.DataFrame):
    """Analyze message reactions (e.g., 'Liked', 'Loved')."""
    if 'is_reaction' not in df.columns or not df['is_reaction'].any():
        return {}

    reactions_df = df[df['is_reaction']].copy()
    if reactions_df.empty:
        return {}

    giver_counts = reactions_df['sender'].value_counts()
    reactions_df['recipient'] = df.shift(1)['sender']
    recipient_counts = reactions_df.dropna(subset=['recipient'])['recipient'].value_counts()
    reaction_type_counts = reactions_df['reaction_type'].value_counts()

    return {
        'total_reactions': len(reactions_df),
        'reaction_types_summary': reaction_type_counts.to_dict(),
        'top_reaction_givers': giver_counts.head(5).to_dict(),
        'top_reaction_recipients': recipient_counts.head(5).to_dict()
    }

def analyze_sentiment(df: pd.DataFrame, word_pattern, positive_words, negative_words):
    """Perform lexicon-based sentiment analysis."""
    if df.empty: return {}

    analysis_df = df[~df['is_reaction']] if 'is_reaction' in df.columns else df

    def calculate_score(message):
        words = set(word_pattern.findall(message.lower()))
        pos_score = len(words.intersection(positive_words))
        neg_score = len(words.intersection(negative_words))
        return pos_score - neg_score

    analysis_df['sentiment_score'] = analysis_df['message'].apply(calculate_score)
    user_sentiment = analysis_df.groupby('sender')['sentiment_score'].mean().to_dict()

    return {
        'overall_average_sentiment': analysis_df['sentiment_score'].mean(),
        'user_average_sentiment': user_sentiment,
        'positive_message_count': int((analysis_df['sentiment_score'] > 0).sum()),
        'negative_message_count': int((analysis_df['sentiment_score'] < 0).sum()),
        'neutral_message_count': int((analysis_df['sentiment_score'] == 0).sum())
    }

def analyze_shared_links(df: pd.DataFrame, url_pattern):
    """Extract and analyze shared URLs."""
    if df.empty: return {}

    all_urls = [url for sublist in df[df['has_url']]['message'].str.findall(url_pattern) for url in sublist]

    def get_domain(url):
        try:
            return urlparse(url).netloc
        except:
            return "unknown"

    domain_counts = Counter(get_domain(url) for url in all_urls if get_domain(url))

    return {
        'total_urls_shared': len(all_urls),
        'unique_domains_shared': len(domain_counts),
        'top_10_shared_domains': dict(domain_counts.most_common(10))
    }

def analyze_topics_with_nmf(df: pd.DataFrame, generic_words, n_topics=7, n_top_words=10):
    """Use NMF for true topic modeling, ignoring reactions."""
    if df.empty: return {}

    analysis_df = df[~df['is_reaction'] & (df['word_count'] > 3)] if 'is_reaction' in df.columns else df[df['word_count'] > 3]

    if len(analysis_df) < n_topics:
        return {"error": "Not enough documents for topic modeling."}

    vectorizer = TfidfVectorizer(max_df=0.95, min_df=2, stop_words=list(generic_words), lowercase=True)
    tfidf = vectorizer.fit_transform(analysis_df['message'])

    nmf = NMF(n_components=n_topics, random_state=42, alpha_W=0.00005, alpha_H=0.00005, l1_ratio=1)
    nmf.fit(tfidf)

    feature_names = vectorizer.get_feature_names_out()
    topics = []
    for topic_idx, topic in enumerate(nmf.components_):
        top_words = [feature_names[i] for i in topic.argsort()[:-n_top_words - 1:-1]]
        topics.append({"topic_id": topic_idx, "top_words": top_words})

    return {"discovered_topics": topics}

def analyze_user_behavior(df: pd.DataFrame):
    """Individual user behavior analysis, now with platform usage and reaction counts."""
    if df.empty: return {}
    user_analysis = {}
    for sender in df['sender'].unique():
        user_msgs = df[df['sender'] == sender].copy()
        if user_msgs.empty: continue

        platform_usage = user_msgs['source'].value_counts().to_dict()
        reactions_given = int(user_msgs['is_reaction'].sum())

        user_analysis[str(sender)] = {
            'total_messages': len(user_msgs[~user_msgs['is_reaction']]),
            'total_reactions_given': reactions_given,
            'platform_usage': platform_usage,
            'avg_message_length': user_msgs[~user_msgs['is_reaction']]['message_length'].mean(),
            'peak_hours_of_day': user_msgs['hour'].value_counts().head(3).to_dict(),
            'active_days_of_week': user_msgs['day_of_week'].value_counts().to_dict(),
            'question_asking_rate_percent': user_msgs['has_question'].mean() * 100,
            'emoji_usage_rate_percent': user_msgs['has_emoji'].mean() * 100,
        }
    return user_analysis

def first_last_messages(df: pd.DataFrame):
    """Get first and last messages."""
    if df.empty: return {}
    first_msg = df.iloc[0]
    last_msg = df.iloc[-1]
    return {
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

def icebreaker_analysis(df: pd.DataFrame):
    """Identify conversation starters."""
    if df.empty: return {}
    first_messages_in_convos = df.drop_duplicates(subset='conversation_id', keep='first')
    substantial_icebreakers = first_messages_in_convos[first_messages_in_convos['message_length'] > 10]
    if not substantial_icebreakers.empty:
        first_substantial_overall = substantial_icebreakers.iloc[0]
        return {
            "sender": str(first_substantial_overall['sender']),
            "datetime": first_substantial_overall['datetime'],
            "message": first_substantial_overall['message'][:200] + ('...' if len(first_substantial_overall['message']) > 200 else '')
        }
    return {}

def calculate_response_metrics(df: pd.DataFrame):
    """Calculate comprehensive response time metrics using vectorized operations."""
    if df.empty: return {}
    df_shifted = df.shift(-1)
    combined_df = pd.DataFrame({
        'current_sender': df['sender'],
        'current_datetime': df['datetime'],
        'next_sender': df_shifted['sender'],
        'next_datetime': df_shifted['datetime']
    })
    response_pairs_df = combined_df[(combined_df['current_sender'] != combined_df['next_sender']) & (combined_df['current_datetime'].notna()) & (combined_df['next_datetime'].notna())].copy()
    response_pairs_df['response_time_minutes'] = (response_pairs_df['next_datetime'] - response_pairs_df['current_datetime']).dt.total_seconds() / 60
    valid_responses = response_pairs_df[(response_pairs_df['response_time_minutes'] > 0) & (response_pairs_df['response_time_minutes'] <= 1440)]
    if valid_responses.empty: return {}

    aggregated_metrics = valid_responses.groupby(['current_sender', 'next_sender'])['response_time_minutes'].agg(
        avg_response_time_minutes='mean', median_response_time_minutes='median',
        fastest_response_minutes='min', slowest_response_minutes='max',
        response_count='count', response_std='std'
    ).fillna(0)

    response_data = {}
    for (sender, responder), row in aggregated_metrics.iterrows():
        key = f"{sender}_to_{responder}"
        response_data[key] = {
            'avg_response_time_minutes': float(row['avg_response_time_minutes']),
            'median_response_time_minutes': float(row['median_response_time_minutes']),
            'fastest_response_minutes': float(row['fastest_response_minutes']),
            'slowest_response_minutes': float(row['slowest_response_minutes']),
            'response_count': int(row['response_count']),
            'quick_responses_under_1min': int((valid_responses[(valid_responses['current_sender'] == sender) & (valid_responses['next_sender'] == responder)]['response_time_minutes'] < 1).sum()),
            'quick_responses_under_5min': int((valid_responses[(valid_responses['current_sender'] == sender) & (valid_responses['next_sender'] == responder)]['response_time_minutes'] < 5).sum()),
            'slow_responses_over_1hr': int((valid_responses[(valid_responses['current_sender'] == sender) & (valid_responses['next_sender'] == responder)]['response_time_minutes'] > 60).sum()),
            'response_consistency': float(row['response_std']) if row['response_count'] > 1 else 0.0
        }
    return response_data

def detect_ghost_periods(df: pd.DataFrame):
    """Detect periods of silence/ghosting with context."""
    if df.empty: return {}
    long_gaps_df = df[df['time_gap_minutes'] > 720].copy()
    ghost_periods = []
    for idx, row in long_gaps_df.iterrows():
        if idx > 0:
            prev_msg = df.loc[idx - 1]
            ghost_periods.append({
                'start_time': prev_msg['datetime'], 'end_time': row['datetime'],
                'duration_hours': float(row['time_gap_minutes'] / 60),
                'who_broke_silence': str(row['sender']),
                'last_sender_before_ghost': str(prev_msg['sender']),
                'last_message_before_ghost': prev_msg['message'][:200] + ('...' if len(prev_msg['message']) > 200 else ''),
                'first_message_after_ghost': row['message'][:200] + ('...' if len(row['message']) > 200 else '')
            })
    ghost_periods.sort(key=lambda x: x['duration_hours'], reverse=True)
    silence_breaker_counts = Counter([g['who_broke_silence'] for g in ghost_periods])
    return {
        'total_ghost_periods': len(ghost_periods),
        'longest_ghost_hours': float(ghost_periods[0]['duration_hours']) if ghost_periods else 0.0,
        'top_10_ghost_periods': ghost_periods[:10],
        'avg_ghost_duration_hours': float(np.mean([g['duration_hours'] for g in ghost_periods])) if ghost_periods else 0.0,
        'who_breaks_silence_most': dict(silence_breaker_counts.most_common()) if ghost_periods else {}
    }

def analyze_word_patterns(df: pd.DataFrame, word_pattern, english_pattern, khmer_pattern, generic_words, khmer_stopwords):
    """Comprehensive word and language analysis, including per-user top words by language."""
    if df.empty: return {}
    all_words_lists = df['message'].astype(str).str.lower().str.findall(word_pattern)
    words_overall = [word for sublist in all_words_lists for word in sublist]
    meaningful_words_overall = [w for w in words_overall if w not in generic_words and len(w) > 2]
    english_words_overall = english_pattern.findall(' '.join(words_overall))
    khmer_words_overall = khmer_pattern.findall(' '.join(df['message'].astype(str).tolist()))
    word_counter_overall = Counter(meaningful_words_overall)
    bigram_counts_overall = Counter(zip(meaningful_words_overall, meaningful_words_overall[1:])) if len(meaningful_words_overall) > 1 else Counter()
    trigram_counts_overall = Counter(zip(meaningful_words_overall, meaningful_words_overall[1:], meaningful_words_overall[2:])) if len(meaningful_words_overall) > 2 else Counter()

    user_word_analysis = {}
    for sender in df['sender'].unique():
        user_msgs_text = ' '.join(df[df['sender'] == sender]['message'].astype(str).tolist())
        user_word_list = word_pattern.findall(user_msgs_text.lower())
        user_meaningful_words = [w for w in user_word_list if w not in generic_words and len(w) > 2]
        user_english_words = [w for w in english_pattern.findall(user_msgs_text) if w.lower() not in generic_words and len(w) > 2]
        user_khmer_words = [w for w in khmer_pattern.findall(user_msgs_text) if w not in khmer_stopwords and len(w) > 1]
        user_word_analysis[str(sender)] = {
            'total_words': len(user_word_list), 'unique_words': len(set(user_word_list)),
            'meaningful_words_count': len(user_meaningful_words),
            'vocabulary_richness': float(len(set(user_word_list)) / len(user_word_list)) if user_word_list else 0.0,
            'top_meaningful_words': [(w, int(c)) for w, c in Counter(user_meaningful_words).most_common(20)],
            'avg_word_length': float(np.mean([len(w) for w in user_word_list])) if user_word_list else 0.0,
            'top_english_words': [(w, int(c)) for w, c in Counter(user_english_words).most_common(15)],
            'top_khmer_words': [(w, int(c)) for w, c in Counter(user_khmer_words).most_common(15)]
        }

    return {
        'total_words_overall': len(words_overall), 'meaningful_words_overall': len(meaningful_words_overall),
        'unique_words_overall': len(set(words_overall)), 'unique_meaningful_words_overall': len(set(meaningful_words_overall)),
        'top_50_meaningful_words_overall': [(w, int(c)) for w, c in word_counter_overall.most_common(50)],
        'top_20_bigrams_overall': [{"phrase": " ".join(b), "count": int(c)} for b, c in bigram_counts_overall.most_common(20)],
        'top_15_trigrams_overall': [{"phrase": " ".join(t), "count": int(c)} for t, c in trigram_counts_overall.most_common(15)],
        'english_word_count_overall': len(english_words_overall), 'khmer_word_count_overall': len(khmer_words_overall),
        'language_ratio_overall': {
            'english_percentage': float(len(english_words_overall) / len(words_overall) * 100) if words_overall else 0.0,
            'khmer_percentage': float(len(khmer_words_overall) / len(words_overall) * 100) if words_overall else 0.0
        },
        'user_word_analysis': user_word_analysis
    }

def emoji_analysis(df: pd.DataFrame):
    """Analyze emoji usage patterns per user."""
    if df.empty: return {}
    all_emojis = [e['emoji'] for msg_emojis in df['emoji_list'].tolist() for e in msg_emojis]
    emoji_counter_overall = Counter(all_emojis)
    user_emoji_analysis = {}
    for sender in df['sender'].unique():
        user_emoji_list = [e['emoji'] for msg_emojis in df[df['sender'] == sender]['emoji_list'].tolist() for e in msg_emojis]
        user_emoji_analysis[str(sender)] = {
            'total_emojis': len(user_emoji_list),
            'unique_emojis': len(set(user_emoji_list)),
            'top_emojis': [{"emoji": e, "count": int(c)} for e, c in Counter(user_emoji_list).most_common(10)],
            'emoji_usage_rate_percent': float(df[df['sender'] == sender]['has_emoji'].mean() * 100)
        }
    return {
        'total_emojis_used_overall': len(all_emojis),
        'unique_emojis_overall': len(set(all_emojis)),
        'top_20_emojis_overall': [{"emoji": e, "count": int(c)} for e, c in emoji_counter_overall.most_common(20)],
        'emoji_usage_rate_overall_percent': float(df['has_emoji'].mean() * 100),
        'user_emoji_analysis': user_emoji_analysis
    }

def analyze_conversation_patterns(df: pd.DataFrame):
    """Deep conversation pattern analysis, including most intense conversations."""
    if df.empty: return {'total_conversations': 0}

    conversations = []
    for conv_id in df['conversation_id'].unique():
        conv_msgs = df[df['conversation_id'] == conv_id].copy()
        if len(conv_msgs) < 2: continue
        start_time, end_time = conv_msgs['datetime'].min(), conv_msgs['datetime'].max()
        duration_minutes = (end_time - start_time).total_seconds() / 60
        effective_duration_hours = max(duration_minutes / 60, 0.05)

        conversations.append({
            'id': int(conv_id), 'total_messages': int(len(conv_msgs)),
            'duration_minutes': float(duration_minutes),
            'participants': [str(p) for p in list(conv_msgs['sender'].unique())],
            'start_time': start_time, 'end_time': end_time,
            'starter_message': conv_msgs.iloc[0]['message'][:150] + ('...' if len(conv_msgs.iloc[0]['message']) > 150 else ''),
            'starter_sender': str(conv_msgs.iloc[0]['sender']),
            'ender_message': conv_msgs.iloc[-1]['message'][:150] + ('...' if len(conv_msgs.iloc[-1]['message']) > 150 else ''),
            'ender_sender': str(conv_msgs.iloc[-1]['sender']),
            'avg_message_length': float(conv_msgs['message_length'].mean()),
            'total_words': int(conv_msgs['word_count'].sum()),
            'intensity_score': float(len(conv_msgs) / effective_duration_hours)
        })

    def _extract_conv_data(c_item):
        if not isinstance(c_item, dict): return None
        return {
            'starter_message': c_item.get('starter_message', ''), 'ender_message': c_item.get('ender_message', ''),
            'duration_minutes': c_item.get('duration_minutes', 0.0), 'total_messages': c_item.get('total_messages', 0),
            'participants': c_item.get('participants', [])
        }

    longest_raw = sorted(conversations, key=lambda x: x.get('total_messages', 0), reverse=True)[:10]
    intense_raw = sorted(conversations, key=lambda x: x.get('intensity_score', 0.0), reverse=True)[:10]

    return {
        'total_conversations': len(conversations),
        'avg_conversation_length_messages': float(np.mean([c['total_messages'] for c in conversations])) if conversations else 0.0,
        'avg_conversation_duration_minutes': float(np.mean([c['duration_minutes'] for c in conversations])) if conversations else 0.0,
        'longest_conversations': [d for c in longest_raw if (d := _extract_conv_data(c))],
        'most_intense_conversations': [d for c in intense_raw if (d := _extract_conv_data(c))],
        'conversation_starters_counts': dict(Counter(c['starter_sender'] for c in conversations).most_common()),
        'conversation_enders_counts': dict(Counter(c['ender_sender'] for c in conversations).most_common())
    }

def temporal_patterns(df: pd.DataFrame):
    """Analyze temporal messaging patterns."""
    if df.empty: return {}
    hourly_activity = df['hour'].value_counts().sort_index()
    daily_activity = df['day_of_week'].value_counts()
    monthly_activity = df['datetime'].dt.to_period('M').value_counts().sort_index()
    total_messages = len(df)

    return {
        'hourly_distribution': {i: int(hourly_activity.get(i, 0)) for i in range(24)},
        'daily_distribution': {day: int(daily_activity.get(day, 0)) for day in ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']},
        'monthly_trend': {str(k): int(v) for k, v in monthly_activity.items()},
        'peak_hour': int(hourly_activity.idxmax()) if not hourly_activity.empty else None,
        'quietest_hour': int(hourly_activity.idxmin()) if not hourly_activity.empty else None,
        'most_active_day': daily_activity.idxmax() if not daily_activity.empty else None,
        'least_active_day': daily_activity.idxmin() if not daily_activity.empty else None,
        'night_owl_percentage': float(len(df[df['hour'].isin([22, 23, 0, 1, 2])]) / total_messages * 100) if total_messages > 0 else 0.0,
        'early_bird_percentage': float(len(df[df['hour'].isin([5, 6, 7, 8])]) / total_messages * 100) if total_messages > 0 else 0.0,
        'weekend_activity_percentage': float(len(df[df['is_weekend']]) / total_messages * 100) if total_messages > 0 else 0.0
    }

def calculate_relationship_metrics(df: pd.DataFrame, conversation_patterns_data, response_metrics_data):
    """Calculate relationship strength indicators."""
    if df.empty: return {}

    total_days = (df['date'].max() - df['date'].min()).days + 1 if len(df) > 0 else 0
    daily_message_counts = df.groupby('date').size()
    consistency_score = 1 - (daily_message_counts.std() / daily_message_counts.mean()) if daily_message_counts.mean() > 0 else 1.0
    all_avg_times = [m['avg_response_time_minutes'] for m in response_metrics_data.values()]

    user_balance = {str(s): len(df[df['sender'] == s]) / len(df) * 100 for s in df['sender'].unique()}
    ideal_pct = 100 / len(user_balance) if user_balance else 100
    balance_score = 100 - sum(abs(pct - ideal_pct) for pct in user_balance.values()) / len(user_balance) if len(user_balance) > 1 else 100.0

    daily_avg = len(df) / total_days if total_days > 0 else 0.0
    intensity = 'LOW'
    if daily_avg > 100 and balance_score > 80: intensity = 'EXTREMELY_HIGH'
    elif daily_avg > 50 and balance_score > 70: intensity = 'HIGH'
    elif daily_avg > 10: intensity = 'MEDIUM'

    return {
        'total_days_in_chat': int(total_days),
        'daily_average_messages': float(daily_avg),
        'consistency_score': float(consistency_score),
        'overall_avg_response_time_minutes': float(np.mean(all_avg_times)) if all_avg_times else 0.0,
        'long_conversations_count': len([c for c in conversation_patterns_data.get('longest_conversations', []) if c.get('total_messages', 0) > 50]),
        'communication_balance_percentages': user_balance,
        'balance_score': float(balance_score),
        'peak_single_day_messages': int(daily_message_counts.max()) if not daily_message_counts.empty else 0,
        'most_active_date': daily_message_counts.idxmax().isoformat() if not daily_message_counts.empty else None,
        'relationship_intensity': intensity
    }

def analyze_unbroken_streaks(df: pd.DataFrame):
    """Find the longest consecutive streak of days with at least one message."""
    if df.empty: return {}
    unique_dates = sorted([pd.to_datetime(d).date() for d in df['date'].unique()])
    if not unique_dates: return {'longest_consecutive_days': 0}

    longest_streak, current_streak = 0, 0
    start_date, end_date, current_start = None, None, None

    for i in range(len(unique_dates)):
        if i == 0:
            current_streak = 1
            current_start = unique_dates[i]
        elif unique_dates[i] == unique_dates[i-1] + timedelta(days=1):
            current_streak += 1
        else:
            if current_streak > longest_streak:
                longest_streak = current_streak
                start_date = current_start
                end_date = unique_dates[i-1]
            current_streak = 1
            current_start = unique_dates[i]
    if current_streak > longest_streak:
        longest_streak = current_streak
        start_date = current_start
        end_date = unique_dates[-1]

    return {
        'longest_consecutive_days': int(longest_streak),
        'streak_start_date': start_date,
        'streak_end_date': end_date,
        'total_active_days': int(len(unique_dates))
    }

def analyze_questions(df: pd.DataFrame, sentence_pattern):
    """Extract and categorize questions asked by each user."""
    if df.empty: return {}
    question_data = defaultdict(lambda: {'total_questions': 0, 'questions_asked_details': []})
    questions_df = df[df['has_question']].copy()

    for idx, row in questions_df.iterrows():
        sender = row['sender']
        sentences = [s.strip() for s in sentence_pattern.split(row['message']) if '?' in s]
        for sentence in sentences:
            question_data[sender]['total_questions'] += 1
            question_data[sender]['questions_asked_details'].append({
                'message_id': int(row.name),
                'question_text': sentence[:200] + ('...' if len(sentence) > 200 else ''),
                'datetime': row['datetime']
            })

    final_results = {}
    for sender, data in question_data.items():
        data['questions_asked_details'].sort(key=lambda x: x['datetime'], reverse=True)
        final_results[str(sender)] = {
            'total_questions': data['total_questions'],
            'top_5_latest_questions': data['questions_asked_details'][:5]
        }
    return final_results