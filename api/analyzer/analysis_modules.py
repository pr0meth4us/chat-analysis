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
from transformers import pipeline
import numpy as np
import pandas as pd
from sklearn.decomposition import NMF
from sklearn.feature_extraction.text import TfidfVectorizer

# Note: The ChatAnalyzer class prepares the DataFrame, including the
# 'is_reaction' and 'text_content' columns, before passing it to these functions.

# ==============================================================================
# 1. OVERVIEW & BASIC STATS
# ==============================================================================

def dataset_overview(df: pd.DataFrame) -> dict:
    """
    Provides a basic, high-level overview of the dataset.
    """
    if df.empty:
        return {}

    start_date = df['datetime'].min().date()
    end_date = df['datetime'].max().date()

    return {
        'total_messages': int(df[~df['is_reaction']].shape[0]),
        'total_reactions': int(df['is_reaction'].sum()),
        'date_range': {
            'start_date': start_date.isoformat(),
            'end_date': end_date.isoformat(),
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

    # Filter for non-reactions to find the first and last actual messages
    analysis_df = df[~df['is_reaction']].copy()
    if analysis_df.empty: return {}

    first_msg = analysis_df.iloc[0]
    last_msg = analysis_df.iloc[-1]

    return {
        'first_message': {
            'datetime': first_msg['datetime'].isoformat(),
            'sender': str(first_msg['sender']),
            'message': first_msg['message'][:250]
        },
        'last_message': {
            'datetime': last_msg['datetime'].isoformat(),
            'sender': str(last_msg['sender']),
            'message': last_msg['message'][:250]
        }
    }

# ==============================================================================
# 2. TEMPORAL & ACTIVITY PATTERN ANALYSIS
# ==============================================================================

def temporal_patterns(df: pd.DataFrame) -> dict:
    """
    Analyzes temporal messaging patterns across hours, days (by name and date), and months.
    """
    if df.empty: return {}

    # Use all activities (messages + reactions) for temporal patterns
    analysis_df = df

    total_activities = len(analysis_df)
    if total_activities == 0: return {}

    # --- Calculations ---
    hourly_activity = analysis_df['hour'].value_counts().sort_index()
    daily_activity_by_name = analysis_df['day_of_week'].value_counts()
    daily_activity_by_date = analysis_df['date'].value_counts().sort_index()
    monthly_activity = analysis_df['datetime'].dt.to_period('M').value_counts().sort_index()

    # --- Formatting Output ---
    days_of_week = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    daily_dist_by_name = {day: int(daily_activity_by_name.get(day, 0)) for day in days_of_week}
    daily_dist_by_date = {d.strftime('%Y-%m-%d'): int(count) for d, count in daily_activity_by_date.items()}

    return {
        'hourly_distribution': {i: int(hourly_activity.get(i, 0)) for i in range(24)},
        'daily_distribution': daily_dist_by_name,
        'daily_distribution_by_date': daily_dist_by_date,
        'monthly_trend': {str(k): int(v) for k, v in monthly_activity.items()},
        'peak_hour': int(hourly_activity.idxmax()) if not hourly_activity.empty else None,
        'quietest_hour': int(hourly_activity.idxmin()) if not hourly_activity.empty else None,
        'most_active_day': daily_activity_by_name.idxmax() if not daily_activity_by_name.empty else None,
        'least_active_day': daily_activity_by_name.idxmin() if not daily_activity_by_name.empty else None,
        'night_owl_percentage': float(
            len(analysis_df[analysis_df['hour'].isin([22, 23, 0, 1, 2, 3])]) / total_activities * 100),
        'early_bird_percentage': float(
            len(analysis_df[analysis_df['hour'].isin([4, 5, 6, 7, 8])]) / total_activities * 100),
        'weekend_activity_percentage': float(
            analysis_df['is_weekend'].sum() / total_activities * 100)
    }

def analyze_unbroken_streaks(df: pd.DataFrame) -> dict:
    """
    Finds the longest consecutive streak of days with at least one message.
    """
    if df.empty: return {'longest_consecutive_days': 0}

    # Use dates from non-reaction messages for meaningful streaks
    unique_dates = sorted(df[~df['is_reaction']]['date'].unique())
    if not unique_dates: return {'longest_consecutive_days': 0}

    longest_streak, current_streak = 0, 0
    streak_start, streak_end, current_start = None, None, None

    # Convert Timestamps to date objects for comparison
    unique_dates = [pd.to_datetime(d).date() for d in unique_dates]

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
        'streak_start_date': streak_start.isoformat() if streak_start else None,
        'streak_end_date': streak_end.isoformat() if streak_end else None,
        'total_active_days': int(len(unique_dates))
    }

# ==============================================================================
# 3. INTERACTION & ENGAGEMENT ANALYSIS
# ==============================================================================

def analyze_reactions(df: pd.DataFrame) -> dict:
    """
    Analyzes message reactions identified from message text.
    Focuses on givers and reaction types, as recipients cannot be reliably determined.
    """
    if 'is_reaction' not in df.columns or not df['is_reaction'].any():
        return {"message": "No reactions found in the dataset based on common text patterns."}

    reactions_df = df[df['is_reaction']].copy()

    if reactions_df.empty:
        return {"message": "No valid reactions could be processed."}

    # We can reliably get the person who GAVE the reaction (the sender)
    giver_counts = reactions_df['sender'].value_counts()

    # We can also get the type of reaction (e.g., "Liked", "❤️", "😂")
    reaction_type_counts = reactions_df.dropna(subset=['reaction_type'])['reaction_type'].value_counts()

    return {
        'total_reactions': int(len(reactions_df)),
        'reaction_types_summary': {str(k): int(v) for k, v in reaction_type_counts.head(20).items()},
        'top_reaction_givers': [{"user": str(u), "count": int(c)} for u, c in giver_counts.head(10).items()],
        'note': "Recipient analysis is not available for reactions detected from message text."
    }

def icebreaker_analysis(df: pd.DataFrame) -> dict:
    """Identifies who starts conversations and what the first message is."""
    if df.empty: return {}

    # Use non-reaction messages for conversation starters
    analysis_df = df[~df['is_reaction']].copy()
    if analysis_df.empty: return {}

    first_messages = analysis_df.drop_duplicates(subset='conversation_id', keep='first')
    if first_messages.empty: return {}

    first_overall = first_messages.iloc[0]
    starter_counts = first_messages['sender'].value_counts()

    return {
        'conversation_starter_counts': [{"user": u, "count": int(c)} for u, c in starter_counts.items()],
        'first_ever_icebreaker': {
            "sender": str(first_overall['sender']),
            "datetime": first_overall['datetime'].isoformat(),
            "message": first_overall['message'][:250]
        }
    }

def calculate_response_metrics(df: pd.DataFrame) -> dict:
    """Calculates detailed response time metrics between users."""
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

    agg_metrics = valid_responses.groupby(['next_sender', 'sender'], observed=False)['response_time_minutes'].agg([
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
                'start_time': prev_msg['datetime'].isoformat(),
                'end_time': row['datetime'].isoformat(),
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

def analyze_word_patterns(df: pd.DataFrame, word_pattern: re.Pattern, generic_words: set, **kwargs) -> dict:
    """Performs a comprehensive analysis of word usage, n-grams, and language distribution."""
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
    """Analyzes emoji usage patterns for the overall chat and per user."""
    if df.empty or 'has_emoji' not in df.columns: return {}
    if not df['has_emoji'].any(): return {'total_emojis_used': 0}

    # Use the original 'message' column to capture emojis in both messages and reactions
    emoji_df = df[df['has_emoji']].copy()
    if emoji_df.empty: return {'total_emojis_used': 0}

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
    """Extracts and analyzes questions asked by each user from non-reaction messages."""
    if df.empty or 'has_question' not in df.columns: return {}

    questions_df = df[df['has_question']].copy()
    if questions_df.empty: return {'total_questions_asked': 0}

    question_data = defaultdict(list)
    for _, row in questions_df.iterrows():
        sentences = [s.strip() for s in sentence_pattern.split(row['text_content']) if '?' in s]
        for sentence in sentences:
            question_data[str(row['sender'])].append({
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
    """Extracts, counts, and analyzes shared URLs from non-reaction messages."""
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

def analyze_sentiment(df: pd.DataFrame, word_pattern: re.Pattern, positive_words: set, negative_words: set) -> dict:
    """Performs lexicon-based sentiment analysis on non-reaction messages."""
    if df.empty or 'text_content' not in df.columns: return {}
    analysis_df = df.copy()

    def calculate_sentiment(message: str) -> dict:
        if not isinstance(message, str) or not message: return {'raw': 0, 'norm': 0}
        words = set(word_pattern.findall(message.lower()))
        word_count = len(words)
        if word_count == 0: return {'raw': 0, 'norm': 0}

        pos = len(words.intersection(positive_words))
        neg = len(words.intersection(negative_words))
        return {'raw': pos - neg, 'norm': (pos - neg) / word_count}

    sent_scores = analysis_df['text_content'].apply(calculate_sentiment)
    analysis_df['sentiment_raw'] = [s['raw'] for s in sent_scores]
    analysis_df['sentiment_norm'] = [s['norm'] for s in sent_scores]

    user_sentiment = analysis_df.groupby('sender', observed=False)['sentiment_norm'].agg(['mean', 'std']).fillna(0)
    sentiment_timeline = analysis_df[analysis_df['text_content'] != ''].resample('D', on='datetime')['sentiment_norm'].mean().dropna()

    return {
        'overall_average_sentiment': analysis_df[analysis_df['text_content'] != '']['sentiment_norm'].mean(),
        'sentiment_timeline': {k.strftime('%Y-%m-%d'): v for k, v in sentiment_timeline.to_dict().items()},
        'user_average_sentiment': { u: {'mean': d['mean'], 'std_dev': d['std']} for u, d in user_sentiment.iterrows() },
        'positive_message_count': int((analysis_df['sentiment_raw'] > 0).sum()),
        'negative_message_count': int((analysis_df['sentiment_raw'] < 0).sum()),
        'neutral_message_count': int((analysis_df[analysis_df['text_content'] != '']['sentiment_raw'] == 0).sum())
    }

def analyze_topics(df: pd.DataFrame, generic_words: set, n_topics: int = 7, n_top_words: int = 10) -> dict:
    """Performs topic modeling on the text content of messages."""
    if df.empty or 'text_content' not in df.columns:
        return {"error": "No data for topic modeling."}

    # Use only messages with actual text content for topic modeling
    docs = df[df['text_content'].str.strip() != '']['text_content'].tolist()

    if len(docs) < n_topics:
        return {"error": f"Not enough messages for topic modeling (found {len(docs)}, need at least {n_topics})."}

    try:
        vectorizer = TfidfVectorizer(
            max_df=0.80, min_df=5, stop_words=list(generic_words),
            lowercase=True, ngram_range=(1, 2)
        )
        tfidf = vectorizer.fit_transform(docs)

        # If the vocabulary is empty after vectorizing (e.g., all words were stopwords)
        if tfidf.shape[1] == 0:
            return {"error": "No meaningful vocabulary found after filtering for topic modeling."}

        feature_names = vectorizer.get_feature_names_out()

        model = NMF(n_components=n_topics, random_state=42, init='nndsvda', l1_ratio=0.5, max_iter=1000)
        W = model.fit_transform(tfidf)

        # Dominant topic for each document
        doc_topics = W.argmax(axis=1)
        topic_distribution = Counter(doc_topics)

        topics = []
        for idx, comp in enumerate(model.components_):
            top_ws = [feature_names[i] for i in comp.argsort()[:-n_top_words - 1:-1]]
            topics.append({
                "topic_id": idx,
                "top_words": top_ws,
                "message_percentage": round((topic_distribution.get(idx, 0) / len(docs)) * 100, 2)
            })

        return {"discovered_topics": sorted(topics, key=lambda x: x['message_percentage'], reverse=True)}

    except Exception as e:
        return {"error": f"Topic modeling failed: {str(e)}"}

# ==============================================================================
# 5. THEMATIC & BEHAVIORAL ANALYSIS
# ==============================================================================

# In analysis_modules.py

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

        # --- NEW: Calculate hourly distribution for the user ---
        user_hourly_counts = user_total_df['hour'].value_counts()
        # Create a complete 24-hour dictionary, filling missing hours with 0
        hourly_distribution = {hour: int(user_hourly_counts.get(hour, 0)) for hour in range(24)}
        # --- END NEW ---

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
                # --- NEW field added here ---
                'hourly_distribution': hourly_distribution,
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
    return _create_thematic_report(df, argument_words, 'argument')

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

    # Get top 5 most substantial messages
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

def analyze_sad_tone(df: pd.DataFrame, sad_words: set) -> dict:
    return _create_thematic_report(df, sad_words, 'sadness')

def analyze_romance_tone(df: pd.DataFrame, romance_words: set) -> dict:
    return _create_thematic_report(df, romance_words, 'romance')

def analyze_sexual_tone(df: pd.DataFrame, sexual_words: set) -> dict:
    return _create_thematic_report(df, sexual_words, 'sexual_content')

def analyze_happy_tone(df: pd.DataFrame, positive_words: set) -> dict:
    return _create_thematic_report(df, positive_words, 'happy_content')

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


def analyze_emotions_ml(df: pd.DataFrame, sample_size: int = 1000) -> dict:
    """
    Analyzes the emotional content of messages using a pre-trained transformer model.
    Samples data if the dataset is too large to prevent timeouts.
    """
    if pipeline is None:
        return {"error": "The 'transformers' and 'torch' libraries are required. Please run 'pip install transformers torch'."}

    analysis_df = df[df['text_content'].str.strip() != ''].copy()
    if analysis_df.empty:
        return {"error": "No text content available for emotion analysis."}

    # --- Random Sampling for Large Datasets ---
    total_docs = len(analysis_df)
    model_name = "j-hartmann/emotion-english-distilroberta-base"
    note = f"Analysis performed on {total_docs} messages using the '{model_name}' model."

    if total_docs > sample_size:
        analysis_df = analysis_df.sample(n=sample_size, random_state=42)
        note += f" (Analysis was run on a random sample of {sample_size} messages to ensure speed)."

    docs = analysis_df['text_content'].tolist()

    try:
        # --- Using the previous, more accurate model ---
        emotion_classifier = pipeline("text-classification", model=model_name, return_all_scores=True)
    except Exception as e:
        return {"error": f"Failed to load the emotion model. It might be downloading. Error: {e}"}

    try:
        results = emotion_classifier(docs, batch_size=8, truncation=True)
    except Exception as e:
        return {"error": f"Failed during model prediction: {e}"}

    # Process the results and add them to the DataFrame
    for i, res_list in enumerate(results):
        for emotion in res_list:
            analysis_df.loc[analysis_df.index[i], f"emotion_{emotion['label']}"] = emotion['score']

    # Define emotion columns based on the model's output
    emotion_columns = [f"emotion_{label}" for label in ['anger', 'disgust', 'fear', 'joy', 'neutral', 'sadness', 'surprise']]
    overall_avg_scores = {
        col.replace('emotion_', ''): analysis_df[col].mean()
        for col in emotion_columns if col in analysis_df.columns
    }

    top_messages_per_emotion = {}
    for emotion in ['anger', 'joy', 'sadness']:
        col_name = f'emotion_{emotion}'
        if col_name in analysis_df.columns:
            top_5_df = analysis_df.nlargest(5, col_name)
            top_messages_per_emotion[emotion] = [
                {"message": row['message'], "sender": row['sender'], "datetime": row['datetime'].isoformat(), "score": round(row[col_name], 4)}
                for _, row in top_5_df.iterrows()
            ]

    user_emotion_summary = {}
    for sender, group in analysis_df.groupby('sender', observed=False):
        user_avg_scores = {
            col.replace('emotion_', ''): group[col].mean()
            for col in emotion_columns if col in group.columns
        }
        if user_avg_scores:
            dominant_emotion = max(user_avg_scores, key=user_avg_scores.get)
            user_emotion_summary[str(sender)] = {
                'dominant_emotion': dominant_emotion,
                'average_scores': user_avg_scores
            }

    return {
        "summary": {
            "overall_average_scores": overall_avg_scores,
            "user_dominant_emotions": user_emotion_summary,
        },
        "top_messages_per_emotion": top_messages_per_emotion,
        "note": note
    }
