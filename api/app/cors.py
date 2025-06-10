from flask_cors import CORS

def init_cors(app):
    CORS(
        app,
        resources={r"/*": {"origins": "https://chat-analysis-gold.vercel.app"}},
        supports_credentials=True,
        max_age=3600
    )
