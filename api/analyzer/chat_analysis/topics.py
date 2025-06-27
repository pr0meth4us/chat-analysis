import pandas as pd
from collections import Counter

def analyze_topics(df: pd.DataFrame, generic_words: set, n_topics: int = 7, n_top_words: int = 10) -> dict:
    from sklearn.decomposition import NMF
    from sklearn.feature_extraction.text import TfidfVectorizer

    if df.empty or 'text_content' not in df.columns:
        return {"error": "No data for topic modeling."}

    docs = df[df['text_content'].str.strip() != '']['text_content'].tolist()
    if len(docs) < n_topics:
        return {"error": f"Not enough messages for topic modeling (found {len(docs)}, need at least {n_topics})."}

    try:
        vectorizer = TfidfVectorizer(
            max_df=0.80, min_df=5, stop_words=list(generic_words),
            lowercase=True, ngram_range=(1, 2)
        )
        tfidf = vectorizer.fit_transform(docs)
        if tfidf.shape[1] == 0:
            return {"error": "No meaningful vocabulary found after filtering for topic modeling."}

        feature_names = vectorizer.get_feature_names_out()
        model = NMF(n_components=n_topics, random_state=42, init='nndsvda', l1_ratio=0.5, max_iter=1000)
        W = model.fit_transform(tfidf)
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
