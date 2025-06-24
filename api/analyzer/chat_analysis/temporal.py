import pandas as pd
from datetime import timedelta
import numpy as np


def temporal_patterns(df: pd.DataFrame) -> dict:
    if df.empty: return {}

    analysis_df = df
    total_activities = len(analysis_df)
    if total_activities == 0: return {}

    hourly_activity = analysis_df['hour'].value_counts().sort_index()
    daily_activity_by_name = analysis_df['day_of_week'].value_counts()
    daily_activity_by_date = analysis_df['date'].value_counts().sort_index()
    monthly_activity = analysis_df['datetime'].dt.to_period('M').value_counts().sort_index()

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
    analysis_df = df[~df['is_reaction']].copy()
    if analysis_df.empty:
        return {'top_streaks': [], 'total_active_days': 0}

    unique_dates = sorted(analysis_df['date'].unique())
    if not unique_dates:
        return {'top_streaks': [], 'total_active_days': 0}

    unique_dates = [pd.to_datetime(d).date() for d in unique_dates]
    all_streaks = []
    current_streak = [unique_dates[0]]
    for i in range(1, len(unique_dates)):
        if unique_dates[i] == unique_dates[i - 1] + timedelta(days=1):
            current_streak.append(unique_dates[i])
        else:
            all_streaks.append(current_streak)
            current_streak = [unique_dates[i]]
    all_streaks.append(current_streak)

    all_streaks.sort(key=len, reverse=True)
    top_streaks_data = []
    for streak in all_streaks[:3]:
        if not streak: continue
        start_date = streak[0]
        end_date = streak[-1]
        first_msg_in_streak = analysis_df[analysis_df['date'].dt.date == start_date].iloc[0]
        last_msg_in_streak = analysis_df[analysis_df['date'].dt.date == end_date].iloc[-1]
        first_msg_after = None
        current_streak_end_date_index = unique_dates.index(end_date)
        if current_streak_end_date_index + 1 < len(unique_dates):
            resumption_date = unique_dates[current_streak_end_date_index + 1]
            days_gap = (resumption_date - end_date).days
            first_msg_after_row = analysis_df[analysis_df['date'].dt.date == resumption_date].iloc[0]
            first_msg_after = {
                'sender': str(first_msg_after_row['sender']),
                'message': first_msg_after_row['message'][:200],
                'datetime': first_msg_after_row['datetime'].isoformat(),
                'days_gap': days_gap
            }
        top_streaks_data.append({
            'length_days': len(streak),
            'start_date': start_date.isoformat(),
            'end_date': end_date.isoformat(),
            'first_message': {
                'sender': str(first_msg_in_streak['sender']),
                'message': first_msg_in_streak['message'][:200],
                'datetime': first_msg_in_streak['datetime'].isoformat()
            },
            'last_message': {
                'sender': str(last_msg_in_streak['sender']),
                'message': last_msg_in_streak['message'][:200],
                'datetime': last_msg_in_streak['datetime'].isoformat()
            },
            'first_message_after_break': first_msg_after
        })

    return {
        'top_streaks': top_streaks_data,
        'total_active_days': len(unique_dates)
    }


def detect_ghost_periods(df: pd.DataFrame) -> dict:
    if df.empty: return {}
    long_gaps_df = df[df['time_gap_minutes'] > 720].copy()
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
    from collections import Counter
    silence_breaker_counts = Counter(g['who_broke_silence'] for g in ghost_periods)

    return {
        'total_ghost_periods': len(ghost_periods),
        'longest_ghost_period_hours': ghost_periods[0]['duration_hours'] if ghost_periods else 0,
        'average_ghost_duration_hours': np.mean([g['duration_hours'] for g in ghost_periods]) if ghost_periods else 0,
        'who_breaks_silence_most': [{"user": u, "count": c} for u, c in silence_breaker_counts.most_common()],
        'top_ghost_periods': ghost_periods[:10],
    }
