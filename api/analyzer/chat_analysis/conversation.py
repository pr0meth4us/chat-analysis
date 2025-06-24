import pandas as pd
import numpy as np

def analyze_conversation_patterns(df: pd.DataFrame) -> dict:
    if df.empty or 'conversation_id' not in df.columns:
        return {'total_conversations': 0}
    analysis_df = df[~df['is_reaction']].copy()
    if analysis_df.empty:
        return {'total_conversations': 0}

    all_responses = analysis_df[analysis_df['sender'] != analysis_df['sender'].shift(1)]
    if len(all_responses) > 1:
        population_avg_seconds = all_responses['datetime'].diff().dt.total_seconds().mean()
        if pd.isna(population_avg_seconds):
            population_avg_seconds = 300
    else:
        population_avg_seconds = 300

    conversations = []
    for conv_id in analysis_df['conversation_id'].unique():
        conv_df = analysis_df[analysis_df['conversation_id'] == conv_id].copy()
        if len(conv_df['sender'].unique()) < 2 or len(conv_df) < 5:
            continue

        start_time = conv_df['datetime'].min()
        end_time = conv_df['datetime'].max()
        duration_minutes = (end_time - start_time).total_seconds() / 60
        effective_duration_hours = max(duration_minutes / 60, 0.001)
        messages_per_hour = len(conv_df) / effective_duration_hours
        turn_taking_ratio = (conv_df['sender'] != conv_df['sender'].shift(1)).sum() / len(conv_df)
        conv_responses = conv_df[conv_df['sender'] != conv_df['sender'].shift(1)]
        conv_avg_seconds = conv_responses['datetime'].diff().dt.total_seconds().mean() if len(conv_responses) > 1 else population_avg_seconds
        if pd.isna(conv_avg_seconds): conv_avg_seconds = population_avg_seconds
        relative_pace_factor = np.log1p(population_avg_seconds / (conv_avg_seconds + 1))
        intensity_score = (np.log1p(messages_per_hour) * turn_taking_ratio * relative_pace_factor)
        sample_messages = conv_df.head(5)[['sender', 'message', 'datetime']].to_dict('records')

        conversations.append({
            'id': int(conv_id),
            'start_time': start_time,
            'participants': list(conv_df['sender'].unique()),
            'message_count': len(conv_df),
            'duration_minutes': round(duration_minutes, 2),
            'intensity_score': round(intensity_score, 2),
            'avg_response_time_seconds': round(conv_avg_seconds, 2),
            'relative_pace_factor': round(relative_pace_factor, 2),
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
        'population_average_response_seconds': round(population_avg_seconds, 2),
        'conversation_starter_counts': [{"user": u, "count": int(c)} for u, c in valid_starters.items()],
        'longest_conversations_by_duration': longest_by_duration,
        'longest_conversations_by_messages': longest_by_messages,
        'most_intense_conversations': most_intense,
    }

def analyze_rapid_fire_conversations(df: pd.DataFrame, min_messages=10, max_gap_minutes=2):
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

        if exchange_rate > 0.3:
            rapid_fire_sessions.append({
                'start_time': start_time, 'end_time': end_time, 'duration_minutes': round(duration, 2),
                'total_messages': len(rapid_group), 'participants': list(rapid_group['sender'].unique()),
                'messages_per_minute': round(len(rapid_group) / duration, 2), 'exchange_rate': round(exchange_rate, 2),
            })

    rapid_fire_sessions.sort(key=lambda x: x['messages_per_minute'], reverse=True)
    return {'total_rapid_fire_sessions': len(rapid_fire_sessions), 'top_10_sessions': rapid_fire_sessions[:10]}