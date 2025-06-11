# app/__init__.py
from flask import Flask
from flask_cors import CORS
import os
from config import Config
from utils import ensure_dir

def create_app():
    app = Flask(__name__)

    # CORS configuration
    CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}},
         supports_credentials=True, max_age=3600)

    # App configuration
    app.config.update(
        SESSION_COOKIE_SAMESITE="None",
        SESSION_COOKIE_SECURE=False,
        MAX_CONTENT_LENGTH=Config.MAX_CONTENT_LENGTH,
        UPLOAD_FOLDER=Config.UPLOAD_FOLDER,
        SECRET_KEY=os.urandom(24)
    )

    ensure_dir(Config.UPLOAD_FOLDER)

    # Register blueprints
    from api.routes.upload_routes import upload_bp
    from api.routes.filter_routes import filter_bp
    from api.routes.analysis_routes import analysis_bp
    from api.routes.utility_routes import utility_bp

    app.register_blueprint(upload_bp, url_prefix='/api')
    app.register_blueprint(filter_bp, url_prefix='/api')
    app.register_blueprint(analysis_bp, url_prefix='/api')
    app.register_blueprint(utility_bp, url_prefix='/api')

    # Register error handlers
    from api.error_handlers import register_error_handlers
    register_error_handlers(app)

    return app
