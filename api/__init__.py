from flask import Blueprint
from .config import Config
from .utils import ensure_dir
from .error_handlers import register_error_handlers

def create_chat_analysis_blueprint():
    """Creates the blueprint for the Chat Analysis API."""
    chat_bp = Blueprint('chat_analysis_api', __name__)

    # Import and register the nested blueprints (routes)
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

    # Register error handlers specifically for this blueprint
    register_error_handlers(chat_bp)

    # Ensure necessary directories exist upon blueprint creation
    ensure_dir(Config.UPLOAD_FOLDER) # 

    return chat_bp