"""
Core Analysis Modules for the Chat Analyzer.

This file contains a comprehensive suite of functions to analyze chat data,
combining detailed statistical analysis with contextual and behavioral insights.
Each function is designed to be modular and is orchestrated by the main
ChatAnalyzer class.
"""

import re
from collections import Counter, defaultdict
from datetime import datetime, timedelta
from urllib.parse import urlparse

import numpy as np
import pandas as pd
from sklearn.decomposition import NMF
from sklearn.feature_extraction.text import TfidfVectorizer

# Note: The progress_callback is handled by the main ChatAnalyzer class,
# so the functions here just return the data.

# ==============================================================================
# 1. OVERVIEW & BASIC STATS
# ==============================================================================

def dataset_overview(df: pd.DataFrame) -> dict:
    """
    Provides a basic, high-level overview of the dataset.
    """
    if df.empty:
        return {}

    start_date = df['date'].min()
    end_date = df['date'].max()

    return {
        'total_messages': int(df[~df['is_reaction']].shape[0]),
        'total_reactions': int(df['is_reaction'].sum()),
        'date_range': {
            'start_date': start_date,
            'end_date': end_date,
            'total_days': (end_date - start_date).days + 1 if pd.notna(start_date) else 0
        },
        'participants': {
            'count': int(df['sender'].nunique()),
            'names': list(df['sender'].unique())
        },
        'chat_platforms_distribution': df['source'].value_counts().to_dict(),
        'analysis_timestamp': datetime.now().isoformat()
    }

def first_last_messages(df: pd.DataFrame) -> dict:
    """Gets the very first and very last message of the chat history."""
    if df.empty: return {}

    analysis_df = df[~df['is_reaction']].copy()
    if analysis_df.empty: return {}

    first_msg = analysis_df.iloc[0]
    last_msg = analysis_df.iloc[-1]

    return {
        'first_message': {
            'datetime': first_msg['datetime'],
            'sender': str(first_msg['sender']),
            'message': first_msg['message'][:250]
        },
        'last_message': {
            'datetime': last_msg['datetime'],
            'sender': str(last_msg['sender']),
            'message': last_msg['message'][:250]
        }
    }

# ==============================================================================
# 2. TEMPORAL & ACTIVITY PATTERN ANALYSIS
# ==============================================================================

def temporal_patterns(df: pd.DataFrame) -> dict:
    """
    Analyzes temporal messaging patterns across hours, days, and months.
    """
    if df.empty: return {}

    analysis_df = df[~df['is_reaction']]
    if analysis_df.empty: return {}

    hourly_activity = analysis_df['hour'].value_counts().sort_index()
    daily_activity = analysis_df['day_of_week'].value_counts()
    monthly_activity = analysis_df['datetime'].dt.to_period('M').value_counts().sort_index()
    total_messages = len(analysis_df)

    # Ensure all days of the week are present in the output
    days_of_week = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    daily_dist = {day: int(daily_activity.get(day, 0)) for day in days_of_week}

    return {
        'hourly_distribution': {i: int(hourly_activity.get(i, 0)) for i in range(24)},
        'daily_distribution': daily_dist,
        'monthly_trend': {str(k): int(v) for k, v in monthly_activity.items()},
        'peak_hour': int(hourly_activity.idxmax()) if not hourly_activity.empty else None,
        'quietest_hour': int(hourly_activity.idxmin()) if not hourly_activity.empty else None,
        'most_active_day': daily_activity.idxmax() if not daily_activity.empty else None,
        'least_active_day': daily_activity.idxmin() if not daily_activity.empty else None,
        'night_owl_percentage': float(
            len(analysis_df[analysis_df['hour'].isin([22, 23, 0, 1, 2, 3])]) / total_messages * 100) if total_messages > 0 else 0.0,
        'early_bird_percentage': float(
            len(analysis_df[analysis_df['hour'].isin([4, 5, 6, 7, 8])]) / total_messages * 100) if total_messages > 0 else 0.0,
        'weekend_activity_percentage': float(
            len(analysis_df[analysis_df['is_weekend']]) / total_messages * 100) if total_messages > 0 else 0.0
    }

def analyze_unbroken_streaks(df: pd.DataFrame) -> dict:
    """
    Finds the longest consecutive streak of days with at least one message.
    """
    if df.empty: return {}
    unique_dates = sorted(df['date'].unique())
    if not unique_dates: return {'longest_consecutive_days': 0}

    longest_streak, current_streak = 0, 0
    streak_start, streak_end, current_start = None, None, None

    for i in range(len(unique_dates)):
        if i == 0:
            current_streak = 1
            current_start = unique_dates[i]
        elif unique_dates[i] == unique_dates[i - 1] + timedelta(days=1):
            current_streak += 1
        else:
            if current_streak > longest_streak:
                longest_streak = current_streak
                streak_start = current_start
                streak_end = unique_dates[i - 1]
            current_streak = 1
            current_start = unique_dates[i]

    if current_streak > longest_streak:
        longest_streak = current_streak
        streak_start = current_start
        streak_end = unique_dates[-1]

    return {
        'longest_consecutive_days': int(longest_streak),
        'streak_start_date': streak_start,
        'streak_end_date': streak_end,
        'total_active_days': int(len(unique_dates))
    }

# ==============================================================================
# 3. INTERACTION & ENGAGEMENT ANALYSIS
# ==============================================================================

def analyze_reactions(df: pd.DataFrame) -> dict:
    """Analyzes message reactions, detailing givers, recipients, and types."""
    if 'is_reaction' not in df.columns or not df['is_reaction'].any():
        return {"message": "No reactions found in the dataset."}

    reactions_df = df[df['is_reaction']].copy()
    if reactions_df.empty: return {}

    # Assign recipient by looking at the previous non-reaction message
    df['recipient'] = df['sender'].where(~df['is_reaction']).ffill()
    reactions_df['recipient'] = df.loc[reactions_df.index, 'recipient']

    giver_counts = reactions_df['sender'].value_counts()
    recipient_counts = reactions_df.dropna(subset=['recipient'])['recipient'].value_counts()
    reaction_type_counts = reactions_df['reaction_type'].value_counts()

    return {
        'total_reactions': len(reactions_df),
        'reaction_types_summary': reaction_type_counts.to_dict(),
        'top_reaction_givers': [{"user": u, "count": int(c)} for u, c in giver_counts.head(10).items()],
        'top_reaction_recipients': [{"user": u, "count": int(c)} for u, c in recipient_counts.head(10).items()]
    }

def icebreaker_analysis(df: pd.DataFrame) -> dict:
    """Identifies who starts conversations and what the first message is."""
    if df.empty: return {}

    first_messages = df.drop_duplicates(subset='conversation_id', keep='first')

    # Find the very first substantial message that kicked off the entire chat history
    substantial_icebreakers = first_messages[first_messages['message_length'] > 10]
    first_overall = substantial_icebreakers.iloc[0] if not substantial_icebreakers.empty else first_messages.iloc[0]

    starter_counts = first_messages['sender'].value_counts()

    return {
        'conversation_starter_counts': [{"user": u, "count": int(c)} for u, c in starter_counts.items()],
        'first_ever_icebreaker': {
            "sender": str(first_overall['sender']),
            "datetime": first_overall['datetime'],
            "message": first_overall['message'][:250]
        } if not first_messages.empty else {}
    }

def calculate_response_metrics(df: pd.DataFrame) -> dict:
    """Calculates detailed response time metrics between users with improved output structure."""
    if df.empty or len(df) < 2: return {}

    analysis_df = df[~df['is_reaction']].copy()
    if len(analysis_df) < 2: return {}

    analysis_df['next_sender'] = analysis_df['sender'].shift(-1)
    analysis_df['next_datetime'] = analysis_df['datetime'].shift(-1)

    response_pairs = analysis_df[
        (analysis_df['sender'] != analysis_df['next_sender']) &
        (analysis_df['datetime'].notna()) &
        (analysis_df['next_datetime'].notna())
        ].copy()

    response_pairs['response_time_minutes'] = (response_pairs['next_datetime'] - response_pairs['datetime']).dt.total_seconds() / 60
    valid_responses = response_pairs[(response_pairs['response_time_minutes'] > 0) & (response_pairs['response_time_minutes'] <= 2880)].copy()

    if valid_responses.empty:
        return {'message': 'No direct user-to-user responses found within the 48-hour threshold.'}

    # Group by the responder (next_sender) and the original sender
    agg_metrics = valid_responses.groupby(['next_sender', 'sender'])['response_time_minutes'].agg([
        'mean', 'median', 'min', 'max', 'std', 'count', lambda x: x.quantile(0.90)
    ]).rename(columns={'<lambda_0>': 'p90'}).fillna(0)

    response_data = defaultdict(dict)
    for (responder, original_sender), row in agg_metrics.iterrows():
        response_data[str(responder)][str(original_sender)] = {
            'avg_response_minutes': round(row['mean'], 2),
            'median_response_minutes': round(row['median'], 2),
            'p90_response_minutes': round(row['p90'], 2),
            'fastest_response_minutes': round(row['min'], 2),
            'slowest_response_minutes': round(row['max'], 2),
            'response_count': int(row['count']),
            'response_time_std_dev': round(row['std'], 2),
        }

    return response_data

def detect_ghost_periods(df: pd.DataFrame) -> dict:
    """Detects and analyzes significant periods of silence (ghosting) in the conversation."""
    if df.empty: return {}

    long_gaps_df = df[df['time_gap_minutes'] > 720].copy() # 12 hours
    if long_gaps_df.empty: return {'total_ghost_periods': 0}

    ghost_periods = []
    for idx, row in long_gaps_df.iterrows():
        if idx > 0:
            prev_msg = df.loc[idx - 1]
            ghost_periods.append({
                'start_time': prev_msg['datetime'],
                'end_time': row['datetime'],
                'duration_hours': round(row['time_gap_minutes'] / 60, 2),
                'last_sender_before_ghost': str(prev_msg['sender']),
                'last_message_before_ghost': prev_msg['message'][:200],
                'who_broke_silence': str(row['sender']),
                'first_message_after_ghost': row['message'][:200]
            })

    ghost_periods.sort(key=lambda x: x['duration_hours'], reverse=True)
    silence_breaker_counts = Counter(g['who_broke_silence'] for g in ghost_periods)

    return {
        'total_ghost_periods': len(ghost_periods),
        'longest_ghost_period_hours': ghost_periods[0]['duration_hours'] if ghost_periods else 0,
        'average_ghost_duration_hours': np.mean([g['duration_hours'] for g in ghost_periods]) if ghost_periods else 0,
        'who_breaks_silence_most': [{"user": u, "count": c} for u, c in silence_breaker_counts.most_common()],
        'top_ghost_periods': ghost_periods[:10],
    }

# ==============================================================================
# 4. CONTENT & LANGUAGE ANALYSIS
# ==============================================================================

def analyze_word_patterns(df: pd.DataFrame, word_pattern: re.Pattern, english_pattern: re.Pattern, khmer_pattern: re.Pattern, generic_words: set, khmer_stopwords: set) -> dict:
    """Performs a comprehensive analysis of word usage, n-grams, and language distribution."""
    if df.empty: return {}

    analysis_df = df[~df['is_reaction']]
    if analysis_df.empty: return {}

    text_corpus = ' '.join(analysis_df['message'].astype(str).tolist())
    all_words = word_pattern.findall(text_corpus.lower())
    meaningful_words = [w for w in all_words if w not in generic_words and len(w) > 2]

    word_counter = Counter(meaningful_words)
    bigram_counts = Counter(zip(meaningful_words, meaningful_words[1:]))
    trigram_counts = Counter(zip(meaningful_words, meaningful_words[1:], meaningful_words[2:]))

    user_analysis = {}
    for sender in analysis_df['sender'].unique():
        user_text = ' '.join(analysis_df[analysis_df['sender'] == sender]['message'].astype(str).tolist())
        user_words = word_pattern.findall(user_text.lower())
        if not user_words: continue

        user_meaningful_words = [w for w in user_words if w not in generic_words and len(w) > 2]
        user_analysis[str(sender)] = {
            'total_words': len(user_words),
            'unique_words': len(set(user_words)),
            'vocabulary_richness': len(set(user_words)) / len(user_words),
            'top_20_words': [{"word": w, "count": c} for w, c in Counter(user_meaningful_words).most_common(20)],
            'avg_word_length': np.mean([len(w) for w in user_words])
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
    """Analyzes emoji usage patterns for the overall chat and per user."""
    if df.empty or 'has_emoji' not in df.columns: return {}

    emoji_df = df[df['has_emoji']].copy()
    if emoji_df.empty: return {'total_emojis_used': 0}

    # This requires the 'emoji' library
    import emoji
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
    """Extracts and analyzes questions asked by each user."""
    if df.empty or 'has_question' not in df.columns: return {}

    questions_df = df[df['has_question']].copy()
    if questions_df.empty: return {'total_questions_asked': 0}

    question_data = defaultdict(list)
    for _, row in questions_df.iterrows():
        sentences = [s.strip() for s in sentence_pattern.split(row['message']) if '?' in s]
        for sentence in sentences:
            question_data[str(row['sender'])].append({
                'question_text': sentence,
                'datetime': row['datetime']
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
    """Extracts, counts, and analyzes shared URLs, focusing on domain frequency."""
    if df.empty or 'has_url' not in df.columns: return {}

    link_msgs = df[df['has_url']].copy()
    if link_msgs.empty: return {'total_urls_shared': 0}

    all_urls = [url for sublist in link_msgs['message'].str.findall(url_pattern) for url in sublist]

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

def analyze_sentiment(df: pd.DataFrame, word_pattern: re.Pattern, positive_words: set, negative_words: set) -> dict:
    """Performs lexicon-based sentiment analysis with normalized scores."""
    if df.empty: return {}
    analysis_df = df[~df['is_reaction']].copy()
    if analysis_df.empty: return {}

    def calculate_sentiment(message: str) -> dict:
        words = set(word_pattern.findall(message.lower()))
        word_count = len(words)
        if word_count == 0: return {'raw': 0, 'norm': 0}

        pos = len(words.intersection(positive_words))
        neg = len(words.intersection(negative_words))
        return {'raw': pos - neg, 'norm': (pos - neg) / word_count}

    sent_scores = analysis_df['message'].apply(calculate_sentiment)
    analysis_df['sentiment_raw'] = [s['raw'] for s in sent_scores]
    analysis_df['sentiment_norm'] = [s['norm'] for s in sent_scores]

    user_sentiment = analysis_df.groupby('sender')['sentiment_norm'].agg(['mean', 'std']).fillna(0)

    return {
        'overall_average_sentiment': analysis_df['sentiment_norm'].mean(),
        'sentiment_timeline': analysis_df.resample('D', on='datetime')['sentiment_norm'].mean().dropna().to_dict(),
        'user_average_sentiment': { u: {'mean': d['mean'], 'std_dev': d['std']} for u, d in user_sentiment.iterrows() },
        'positive_message_count': int((analysis_df['sentiment_raw'] > 0).sum()),
        'negative_message_count': int((analysis_df['sentiment_raw'] < 0).sum()),
        'neutral_message_count': int((analysis_df['sentiment_raw'] == 0).sum())
    }

def analyze_topics_with_nmf(df: pd.DataFrame, generic_words: set, n_topics: int = 7, n_top_words: int = 10) -> dict:
    """Uses Non-Negative Matrix Factorization (NMF) for topic modeling."""
    if df.empty: return {}
    analysis_df = df[~df['is_reaction'] & (df['word_count'] > 3)].copy()
    if len(analysis_df) < n_topics: return {"error": f"Not enough messages for {n_topics}-topic modeling."}

    vectorizer = TfidfVectorizer(max_df=0.90, min_df=3, stop_words=list(generic_words), lowercase=True, ngram_range=(1, 2))
    try:
        tfidf = vectorizer.fit_transform(analysis_df['message'])
    except ValueError:
        return {"error": "Not enough vocabulary to build topics."}

    nmf = NMF(n_components=n_topics, random_state=42, l1_ratio=0.5)
    W = nmf.fit_transform(tfidf)
    feature_names = vectorizer.get_feature_names_out()

    topics = []
    for topic_idx, topic_vec in enumerate(nmf.components_):
        top_words = [feature_names[i] for i in topic_vec.argsort()[:-n_top_words - 1:-1]]
        topics.append({"topic_id": topic_idx, "top_words": top_words})

    analysis_df['dominant_topic'] = W.argmax(axis=1)
    topic_dist = analysis_df['dominant_topic'].value_counts(normalize=True).sort_index()

    for topic in topics:
        topic['message_percentage'] = topic_dist.get(topic['topic_id'], 0) * 100

    return {"discovered_topics": topics}

# ==============================================================================
# 5. BEHAVIORAL & THEMATIC ANALYSIS
# ==============================================================================

def analyze_user_behavior(df: pd.DataFrame) -> dict:
    """Provides a detailed breakdown of individual user behavior and communication style."""
    if df.empty: return {}

    user_analysis = {}
    analysis_df = df[~df['is_reaction']].copy()

    for sender in df['sender'].unique():
        user_total_df = df[df['sender'] == sender]
        user_msgs_df = analysis_df[analysis_df['sender'] == sender]
        if user_total_df.empty: continue

        conv_starters = df.drop_duplicates(subset='conversation_id', keep='first')
        initiation_count = (conv_starters['sender'] == sender).sum()

        user_analysis[str(sender)] = {
            'message_counts': {
                'total_messages': len(user_msgs_df),
                'total_posts_inc_reactions': len(user_total_df),
                'reactions_given': int(user_total_df['is_reaction'].sum()),
            },
            'message_stats': {
                'avg_message_length_chars': user_msgs_df['message_length'].mean(),
                'std_message_length_chars': user_msgs_df['message_length'].std(),
                'avg_message_length_words': user_msgs_df['word_count'].mean(),
            },
            'activity_patterns': {
                'peak_hours_of_day': user_total_df['hour'].value_counts().head(3).to_dict(),
                'active_days_of_week': user_total_df['day_of_week'].value_counts().to_dict(),
            },
            'content_style': {
                'question_asking_rate_percent': user_msgs_df['has_question'].mean() * 100,
                'emoji_usage_rate_percent': user_msgs_df['has_emoji'].mean() * 100,
                'link_sharing_rate_percent': user_msgs_df['has_url'].mean() * 100,
            },
            'engagement': {
                'conversation_initiation_count': int(initiation_count),
                'platform_usage': user_total_df['source'].value_counts().to_dict(),
            }
        }
    return user_analysis

# In analysis_modules.py

def analyze_conversation_patterns(df: pd.DataFrame) -> dict:
    """
    Analyzes conversations to find the longest and most intense sessions.

    Intensity is now a sophisticated composite score based on:
    - Message density (volume).
    - Turn-taking ratio (engagement).
    - Relative Pace (how much faster the conversation is than the chat's overall average).
    """
    if df.empty or 'conversation_id' not in df.columns:
        return {'total_conversations': 0}

    analysis_df = df[~df['is_reaction']].copy()
    if analysis_df.empty:
        return {'total_conversations': 0}

    # --- NEW: Pre-calculate the "population" average response time for the entire chat ---
    all_responses = analysis_df[analysis_df['sender'] != analysis_df['sender'].shift(1)]
    if len(all_responses) > 1:
        # Calculate the mean, filling any missing values with a default (e.g., 5 minutes)
        population_avg_seconds = all_responses['datetime'].diff().dt.total_seconds().mean()
        if pd.isna(population_avg_seconds):
            population_avg_seconds = 300
    else:
        population_avg_seconds = 300 # Default to 5 minutes if no back-and-forth found

    conversations = []
    for conv_id in analysis_df['conversation_id'].unique():
        conv_df = analysis_df[analysis_df['conversation_id'] == conv_id].copy()

        if len(conv_df['sender'].unique()) < 2 or len(conv_df) < 5:
            continue

        start_time = conv_df['datetime'].min()
        end_time = conv_df['datetime'].max()
        duration_minutes = (end_time - start_time).total_seconds() / 60
        effective_duration_hours = max(duration_minutes / 60, 0.001)

        # 1. Volume
        messages_per_hour = len(conv_df) / effective_duration_hours

        # 2. Engagement
        turn_taking_ratio = (conv_df['sender'] != conv_df['sender'].shift(1)).sum() / len(conv_df)

        # 3. Pace (both absolute and relative)
        conv_responses = conv_df[conv_df['sender'] != conv_df['sender'].shift(1)]
        conv_avg_seconds = conv_responses['datetime'].diff().dt.total_seconds().mean() if len(conv_responses) > 1 else population_avg_seconds
        if pd.isna(conv_avg_seconds): conv_avg_seconds = population_avg_seconds

        # --- NEW: Calculate the Relative Pace Factor ---
        # How much faster is this conversation than the norm? We use log1p to dampen extreme values.
        relative_pace_factor = np.log1p(population_avg_seconds / (conv_avg_seconds + 1)) # +1 to avoid division by zero

        # --- UPDATED: The new, smarter intensity score ---
        intensity_score = (
                np.log1p(messages_per_hour) * # Volume component
                turn_taking_ratio * # Engagement component
                relative_pace_factor            # Relative Pace component
        )

        sample_messages = conv_df.head(5)[['sender', 'message', 'datetime']].to_dict('records')

        conversations.append({
            'id': int(conv_id),
            'start_time': start_time,
            'participants': list(conv_df['sender'].unique()),
            'message_count': len(conv_df),
            'duration_minutes': round(duration_minutes, 2),
            'intensity_score': round(intensity_score, 2),
            'avg_response_time_seconds': round(conv_avg_seconds, 2),
            'relative_pace_factor': round(relative_pace_factor, 2), # Expose the new metric
            'turn_taking_ratio': round(turn_taking_ratio, 2),
            'messages_per_hour': round(messages_per_hour, 2),
            'sample_messages': sample_messages,
        })

    if not conversations:
        return {'total_conversations': 0, 'message': 'No valid multi-participant conversations found.'}

    most_intense = sorted(conversations, key=lambda x: x['intensity_score'], reverse=True)[:10]
    longest_by_duration = sorted(conversations, key=lambda x: x['duration_minutes'], reverse=True)[:10]
    longest_by_messages = sorted(conversations, key=lambda x: x['message_count'], reverse=True)[:10]

    starters = analysis_df.drop_duplicates(subset='conversation_id', keep='first')
    multi_person_conv_ids = [c['id'] for c in conversations]
    valid_starters = starters[starters['conversation_id'].isin(multi_person_conv_ids)]['sender'].value_counts()

    return {
        'total_conversations': len(conversations),
        'population_average_response_seconds': round(population_avg_seconds, 2), # Expose the baseline
        'conversation_starter_counts': [{"user": u, "count": int(c)} for u, c in valid_starters.items()],
        'longest_conversations_by_duration': longest_by_duration,
        'longest_conversations_by_messages': longest_by_messages,
        'most_intense_conversations': most_intense,
    }
def analyze_rapid_fire_conversations(df: pd.DataFrame, min_messages=10, max_gap_minutes=2):
    """Identifies intense, sustained back-and-forth exchanges."""
    if df.empty or 'conversation_id' not in df.columns: return {}
    analysis_df = df[~df['is_reaction']].copy()
    if len(analysis_df) < min_messages: return {}

    rapid_fire_sessions = []
    analysis_df['time_gap_minutes'] = analysis_df.groupby('conversation_id')['datetime'].diff().dt.total_seconds().fillna(0) / 60
    analysis_df['is_rapid'] = analysis_df['time_gap_minutes'] <= max_gap_minutes
    analysis_df['rapid_block'] = (analysis_df['is_rapid'] == False).cumsum()

    for _, group in analysis_df.groupby(['conversation_id', 'rapid_block']):
        rapid_group = group[group['is_rapid']]
        if len(rapid_group) < min_messages or len(rapid_group['sender'].unique()) < 2: continue

        start_time, end_time = rapid_group['datetime'].min(), rapid_group['datetime'].max()
        duration = max((end_time - start_time).total_seconds() / 60, 0.1)
        exchange_rate = (rapid_group['sender'] != rapid_group['sender'].shift(1)).sum() / len(rapid_group)

        if exchange_rate > 0.3: # Ensure it's not one person spamming
            rapid_fire_sessions.append({
                'start_time': start_time, 'end_time': end_time, 'duration_minutes': round(duration, 2),
                'total_messages': len(rapid_group), 'participants': list(rapid_group['sender'].unique()),
                'messages_per_minute': round(len(rapid_group) / duration, 2), 'exchange_rate': round(exchange_rate, 2),
            })

    rapid_fire_sessions.sort(key=lambda x: x['messages_per_minute'], reverse=True)
    return {'total_rapid_fire_sessions': len(rapid_fire_sessions), 'top_10_sessions': rapid_fire_sessions[:10]}

def analyze_argument_language(df: pd.DataFrame, argument_words: set) -> dict:
    """Analyzes usage of aggressive language and identifies potential argument sessions."""
    if df.empty: return {}
    analysis_df = df[~df['is_reaction']].copy()
    if analysis_df.empty: return {}

    # FIX: Use a non-capturing group (?:...) to silence the UserWarning
    pattern = r'\b(?:' + '|'.join(re.escape(word) for word in argument_words) + r')\b'
    argument_msgs = analysis_df[analysis_df['message'].str.contains(pattern, case=False, na=False)].copy()

    if argument_msgs.empty: return {'total_argument_messages': 0}

    argument_msgs['replied_to'] = analysis_df['sender'].shift(1)
    argument_msgs = argument_msgs[argument_msgs['sender'] != argument_msgs['replied_to']]

    all_found_words = re.findall(pattern, ' '.join(argument_msgs['message'].tolist()).lower())

    user_stats = {}
    # FIX: Add observed=False to silence the FutureWarning
    for sender, group in argument_msgs.groupby('sender', observed=False):
        user_stats[str(sender)] = {'count': len(group), 'words_used': Counter(re.findall(pattern, ' '.join(group['message']).lower())).most_common(5)}

    return {
        'total_argument_messages': len(argument_msgs),
        'argument_intensity_percent': len(argument_msgs) / len(analysis_df) * 100,
        'most_used_argument_words': [{"word": w, "count": c} for w, c in Counter(all_found_words).most_common(15)],
        'top_instigators': [{"user": u, "count": c} for u, c in argument_msgs['sender'].value_counts().head(5).items()],
        'top_recipients': [{"user": u, "count": c} for u, c in argument_msgs['replied_to'].value_counts().head(5).items()],
        'user_argument_stats': user_stats,
    }

def _create_thematic_report(df: pd.DataFrame, keywords: set, theme_name: str) -> dict:
    """Helper to generate a standardized report for a given thematic lexicon."""
    if df.empty: return {}
    analysis_df = df[~df['is_reaction']]

    # FIX: Use a non-capturing group (?:...) to silence the UserWarning
    pattern = r'\b(?:' + '|'.join(re.escape(k) for k in keywords) + r')\b'
    thematic_df = analysis_df[analysis_df['message'].str.contains(pattern, case=False, na=False)].copy()

    if thematic_df.empty: return {'total_matching_messages': 0}

    return {
        'total_matching_messages': len(thematic_df),
        f'{theme_name}_intensity_percent': (len(thematic_df) / len(analysis_df)) * 100,
        'top_senders': [{"user": u, "count": c} for u, c in thematic_df['sender'].value_counts().head(5).items()],
        'top_messages': thematic_df.sort_values('message_length', ascending=False).head(5)[['sender', 'message', 'datetime']].to_dict('records')
    }


def analyze_sad_tone(df: pd.DataFrame, sad_words: set) -> dict:
    """Analyzes the chat for expressions of sadness."""
    return _create_thematic_report(df, sad_words, 'sadness')

def analyze_romance_tone(df: pd.DataFrame, romance_words: set) -> dict:
    """Analyzes the chat for romantic expressions."""
    return _create_thematic_report(df, romance_words, 'romance')

def analyze_sexual_tone(df: pd.DataFrame, sexual_words: set) -> dict:
    """Analyzes the chat for sexually suggestive language."""
    report = _create_thematic_report(df, sexual_words, 'sexual_content')
    report['disclaimer'] = "This analysis is based on a predefined list of keywords and may not capture all nuances."
    return report


# ==============================================================================
# 6. HIGH-LEVEL COMPOSITE METRICS
# ==============================================================================

def calculate_relationship_metrics(df: pd.DataFrame, conversation_patterns_data: dict, response_metrics_data: dict) -> dict:
    """Calculates a high-level relationship score based on balance, consistency, responsiveness, and engagement."""
    if df.empty: return {}
    analysis_df = df[~df['is_reaction']]
    total_messages = len(analysis_df)
    if total_messages == 0: return {}

    # 1. Balance Score
    user_counts = analysis_df['sender'].value_counts()
    ideal_pct = 100 / len(user_counts) if len(user_counts) > 0 else 100
    balance_dev = sum(abs(pct - ideal_pct) for pct in (user_counts / total_messages * 100))
    balance_score = max(0, 100 - balance_dev)

    # 2. Consistency Score
    daily_counts = df.resample('D', on='datetime').size()
    consistency_score = (1 - (daily_counts.std() / daily_counts.mean())) * 100 if daily_counts.mean() > 0 else 0
    consistency_score = max(0, min(consistency_score, 100))

    # 3. Responsiveness Score
    all_medians = [m['median_response_minutes'] for u in response_metrics_data.values() for m in u.values()]
    avg_median_resp = np.mean(all_medians) if all_medians else 60
    responsiveness_score = max(0, 100 - 20 * np.log1p(avg_median_resp))

    # 4. Engagement Score
    total_days = (df['date'].max() - df['date'].min()).days + 1
    daily_avg = total_messages / total_days if total_days > 0 else 0
    engagement_score = min(100, daily_avg * 2)

    # --- Final Score ---
    weights = {'balance': 0.30, 'consistency': 0.25, 'responsiveness': 0.25, 'engagement': 0.20}
    final_score = sum([
        balance_score * weights['balance'],
        consistency_score * weights['consistency'],
        responsiveness_score * weights['responsiveness'],
        engagement_score * weights['engagement']
    ])

    if final_score > 85: intensity = "VERY_HIGH"
    elif final_score > 70: intensity = "HIGH"
    elif final_score > 40: intensity = "MEDIUM"
    else: intensity = "LOW"

    return {
        'relationship_score': round(final_score, 2),
        'relationship_intensity': intensity,
        'score_components': {
            'balance_score': round(balance_score, 2),
            'consistency_score': round(consistency_score, 2),
            'responsiveness_score': round(responsiveness_score, 2),
            'engagement_score': round(engagement_score, 2),
        },
        'underlying_metrics': {
            'communication_balance_percent': (user_counts / total_messages * 100).to_dict(),
            'daily_average_messages': round(daily_avg, 2),
            'overall_median_response_time_minutes': round(avg_median_resp, 2),
        }
    }