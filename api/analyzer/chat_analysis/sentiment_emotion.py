import pandas as pd
import re
from transformers import pipeline

emotion_classifier = pipeline(
    "text-classification",
    model="j-hartmann/emotion-english-distilroberta-base",
    return_all_scores=True
)

def analyze_sentiment(df: pd.DataFrame, word_pattern: re.Pattern, positive_words: set, negative_words: set) -> dict:
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


def analyze_emotions_ml(df: pd.DataFrame, sample_size: int = 1000) -> dict:
    analysis_df = df[df['text_content'].str.strip() != ''].copy()
    if analysis_df.empty:
        return {"error": "No text content available for emotion analysis."}

    total_docs = len(analysis_df)
    model_name = "j-hartmann/emotion-english-distilroberta-base"
    note = f"Analysis performed on {total_docs} messages using the '{model_name}' model."
    if total_docs > sample_size:
        analysis_df = analysis_df.sample(n=sample_size, random_state=42)
        note += f" (Analysis was run on a random sample of {sample_size} messages to ensure speed)."

    docs = analysis_df['text_content'].tolist()
    try:
        results = emotion_classifier(docs, batch_size=8, truncation=True)
    except Exception as e:
        return {"error": f"Failed during model prediction: {e}"}

    for i, res_list in enumerate(results):
        for emotion in res_list:
            analysis_df.loc[analysis_df.index[i], f"emotion_{emotion['label']}"] = emotion['score']

    emotion_columns = [f"emotion_{label}" for label in ['anger', 'disgust', 'fear', 'joy', 'sadness', 'surprise']]
    overall_avg_scores = {
        col.replace('emotion_', ''): analysis_df[col].mean()
        for col in emotion_columns if col in analysis_df.columns
    }

    top_messages_per_emotion = {}
    for emotion in ['anger', 'joy', 'sadness', 'disgust', 'fear', 'surprise']:
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
            for col in [f"emotion_{l}" for l in ['anger', 'disgust', 'fear', 'joy', 'neutral', 'sadness', 'surprise']] if col in group.columns
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