from flask import jsonify, request

def register_error_handlers(app):
    """Register error handlers for the Flask app"""

    @app.errorhandler(413)
    def too_large(e):
        return jsonify({
            "error": "File too large",
            "limit": app.config.get('MAX_CONTENT_LENGTH'),
            "attempt": request.content_length
        }), 413