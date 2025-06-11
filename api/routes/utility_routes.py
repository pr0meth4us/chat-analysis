from flask import Blueprint, jsonify
from api.session_manager import session_manager

utility_bp = Blueprint('utility', __name__)

@utility_bp.route('/get_stored_messages', methods=['GET'])
def get_stored_messages():
    """Retrieve stored processed messages for current session"""
    session_id = session_manager.get_session_id()
    msgs = session_manager.get_processed_messages(session_id)

    if not msgs:
        return jsonify({"error": "No processed messages. Upload first."}), 404

    return jsonify({
        "session_id": session_id,
        "messages": msgs
    })

@utility_bp.route('/clear', methods=['POST'])
def clear_session():
    """Clear all session data"""
    session_id = session_manager.get_session_id()
    session_manager.clear_session_data(session_id)

    return jsonify({
        "message": "Cleared session data",
        "session_id": session_id
    })
