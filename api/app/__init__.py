import logging
import sys

from flask import Flask

from .analyzer.main_analyzer import ChatAnalyzer
from .config import Config
from .cors import init_cors
from .parser.main_parser import process_uploaded_files
from .utils import ensure_dir


def create_app() -> Flask:
    app = Flask(__name__)
    app.config.from_object(Config)

    # Logging setup
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(logging.Formatter(
        "[%(asctime)s] %(levelname)s - %(name)s: %(message)s"
    ))
    app.logger.addHandler(console_handler)
    app.logger.setLevel(logging.INFO)
    app.logger.handlers = [console_handler]

    # Init extensions
    init_cors(app)

    # Ensure upload directory exists
    ensure_dir(app.config["UPLOAD_FOLDER"])

    # Register Blueprints
    from .routes.upload import bp as upload_bp
    from .routes.analyze import bp as analyze_bp
    app.register_blueprint(upload_bp, url_prefix="/api")
    app.register_blueprint(analyze_bp, url_prefix="/api")

    @app.route("/health", methods=["GET"])
    def health():
        """Simple liveness / readiness probe."""
        return {"status": "ok"}, 200

    app.logger.info("📦 Flask Chat Analyzer App Initialized")
    return app
