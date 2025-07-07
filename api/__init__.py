from flask import Blueprint
from .utils import ensure_dir
from .error_handlers import register_error_handlers
from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
load_dotenv()
from .config import Config

def create_chat_analysis_blueprint():
    chat_bp = Blueprint('chat_analysis_api', __name__)

    from .routes.analysis_routes import analysis_bp
    from .routes.data_routes import data_bp
    from .routes.filter_routes import filter_bp
    from .routes.process_routes import process_bp
    from .routes.task_routes import tasks_bp
    from .routes.search_routes import search_bp

    chat_bp.register_blueprint(analysis_bp)
    chat_bp.register_blueprint(filter_bp)
    chat_bp.register_blueprint(data_bp)
    chat_bp.register_blueprint(process_bp)
    chat_bp.register_blueprint(tasks_bp, url_prefix='/tasks')
    chat_bp.register_blueprint(search_bp, url_prefix='/search')

    register_error_handlers(chat_bp)

    ensure_dir(Config.UPLOAD_FOLDER)

    return chat_bp

def create_app():
    app = Flask(__name__)

    allowed_origins = [
        "http://localhost:3000",
        "https://chat-analysis-beryl.vercel.app",
        "https://chatanalysis.webhop.me"
    ]

    CORS(app, resources={r"/*": {"origins": allowed_origins}},
         supports_credentials=True, max_age=3600)
    app.config.update(
        SESSION_COOKIE_SAMESITE="None",
        SESSION_COOKIE_SECURE=True,
        MAX_CONTENT_LENGTH=Config.MAX_CONTENT_LENGTH,
        UPLOAD_FOLDER=Config.UPLOAD_FOLDER,
        SECRET_KEY = Config.SECRET_KEY,
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