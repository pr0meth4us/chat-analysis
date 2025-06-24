import pandas as pd
from datetime import datetime

def dataset_overview(df: pd.DataFrame) -> dict:
    if df.empty:
        return {}

    start_date = df['datetime'].min().date()
    end_date = df['datetime'].max().date()
    analysis_df = df[~df['is_reaction']].copy()
    if not analysis_df.empty:
        daily_counts = analysis_df.resample('D', on='datetime').size()
        non_zero_days = daily_counts[daily_counts > 0]
        daily_avg_messages = non_zero_days.mean() if len(non_zero_days) > 0 else 0
    else:
        daily_avg_messages = 0

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
        'analysis_timestamp': datetime.now().isoformat(),
        'daily_average_messages': round(daily_avg_messages, 2),
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