import pandas as pd
from collections import defaultdict

def analyze_user_behavior(df: pd.DataFrame) -> dict:
    if df.empty: return {}
    user_analysis = {}
    analysis_df = df[~df['is_reaction']].copy()

    for sender in df['sender'].unique():
        user_total_df = df[df['sender'] == sender]
        user_msgs_df = analysis_df[analysis_df['sender'] == sender]
        if user_total_df.empty: continue

        conv_starters = df.drop_duplicates(subset='conversation_id', keep='first')
        initiation_count = (conv_starters['sender'] == sender).sum()
        user_hourly_counts = user_total_df['hour'].value_counts()
        hourly_distribution = {hour: int(user_hourly_counts.get(hour, 0)) for hour in range(24)}

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

def icebreaker_analysis(df: pd.DataFrame) -> dict:
    if df.empty: return {}
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
        'mean', 'median', 'min', 'max', 'std', 'count', lambda x: x.quantile(0.90) # Added 'count'
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