from flask import Flask
from flask_cors import CORS
import os
from api.config import Config
from api.utils import ensure_dir


def create_app():
    app = Flask(__name__)

    allowed_origins = [
        "http://localhost:3000",
        "https://chat-analysis-beryl.vercel.app"
    ]

    CORS(app, resources={r"/*": {"origins": allowed_origins}},
         supports_credentials=True, max_age=3600)

    app.config.update(
        SESSION_COOKIE_SAMESITE="None",
        SESSION_COOKIE_SECURE=True,
        MAX_CONTENT_LENGTH=Config.MAX_CONTENT_LENGTH,
        UPLOAD_FOLDER=Config.UPLOAD_FOLDER,
        SECRET_KEY=os.urandom(24),
        JSONIFY_PRETTYPRINT_REGULAR=False
    )

    ensure_dir(Config.UPLOAD_FOLDER)

    from api.routes.analysis_routes import analysis_bp
    from api.routes.data_routes import data_bp
    from api.routes.filter_routes import filter_bp
    from api.routes.process_routes import process_bp
    from api.routes.task_routes import tasks_bp
    from api.routes.search_routes import search_bp

    app.register_blueprint(analysis_bp)
    app.register_blueprint(filter_bp)
    app.register_blueprint(data_bp)
    app.register_blueprint(process_bp)
    app.register_blueprint(tasks_bp, url_prefix='/tasks')
    app.register_blueprint(search_bp, url_prefix='/search')

    from api.error_handlers import register_error_handlers
    register_error_handlers(app)

    return app
