from flask import Blueprint, request
from api.session_manager import session_manager
from api.helpers.response_helpers import make_json_response

utility_bp = Blueprint('utility', __name__)

@utility_bp.route('/get_stored_messages', methods=['GET'])
def get_stored_messages():
    """Retrieve stored processed messages for current session (JSON or file)"""
    session_id = session_manager.get_session_id()
    msgs = session_manager.get_processed_messages(session_id)

    if not msgs:
        return make_json_response(
            {"error": "No processed messages. Upload first."},
            filename=f"{session_id}-messages.json"
        ), 404

    return make_json_response(msgs, filename=f"{session_id}-messages.json")

@utility_bp.route('/clear', methods=['POST'])
def clear_session():
    """Clear all session data"""
    session_id = session_manager.get_session_id()
    session_manager.clear_session_data(session_id)
    return make_json_response(
        {"message": "Cleared session data", "session_id": session_id},
        filename=f"{session_id}-cleared.json"
    )
