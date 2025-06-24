import pandas as pd
import numpy as np


def calculate_relationship_metrics(df: pd.DataFrame, response_metrics_data: dict) -> dict:
    if df.empty: return {}
    analysis_df = df[~df['is_reaction']]
    total_messages = len(analysis_df)
    if total_messages == 0: return {}

    user_counts = analysis_df['sender'].value_counts()
    ideal_pct = 100 / len(user_counts) if len(user_counts) > 0 else 100
    balance_dev = sum(abs(pct - ideal_pct) for pct in (user_counts / total_messages * 100))
    balance_score = max(0, 100 - balance_dev)

    daily_counts = df.resample('D', on='datetime').size()
    if daily_counts.mean() > 0 and len(daily_counts) > 1:
        cv = daily_counts.std() / daily_counts.mean()
        consistency_score = max(0, 100 * np.exp(-cv))
    else:
        consistency_score = 100 if len(daily_counts) <= 1 else 0

    consistency_score = min(consistency_score, 100)

    all_medians = []
    if isinstance(response_metrics_data, dict):
        all_medians = [m['median_response_minutes'] for u in response_metrics_data.values() for m in u.values()]

    avg_median_resp = np.mean(all_medians) if all_medians else 60
    responsiveness_score = max(0, 100 - 20 * np.log1p(avg_median_resp))

    total_days = (df['date'].max() - df['date'].min()).days + 1
    daily_avg = total_messages / total_days if total_days > 0 else 0
    engagement_score = min(100, daily_avg * 2)

    weights = {'balance': 0.30, 'consistency': 0.25, 'responsiveness': 0.25, 'engagement': 0.20}
    final_score = sum([
        balance_score * weights['balance'],
        consistency_score * weights['consistency'],
        responsiveness_score * weights['responsiveness'],
        engagement_score * weights['engagement']
    ])

    if final_score > 85:
        intensity = "VERY_HIGH"
    elif final_score > 70:
        intensity = "HIGH"
    elif final_score > 40:
        intensity = "MEDIUM"
    else:
        intensity = "LOW"

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
