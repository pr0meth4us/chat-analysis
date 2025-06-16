from api.session_manager import session_manager
from api.helpers.response_helpers import make_json_response
from flask import request
from utils import log
from flask import Blueprint, jsonify

filter_bp = Blueprint('filter_routes', __name__)
@filter_bp.route('/filter', methods=['POST'])
def filter_messages_endpoint():
    """Filters the processed messages stored in the session."""
    data = request.get_json() or {}
    session_id = session_manager.get_session_id()
    messages = session_manager.get_processed_messages(session_id)

    if not messages:
        return jsonify({"error": "No processed messages found in the session to filter."}), 400

    me_list = set(data.get('me', []))
    remove_list = set(data.get('remove', []))
    other_label = data.get('other_label', 'other')

    filtered_messages = []
    for msg in messages:
        sender = msg.get('sender')
        if sender in remove_list:
            continue
        if me_list:
            msg['sender'] = 'me' if sender in me_list else other_label
        filtered_messages.append(msg)

    session_manager.store_filtered_messages(session_id, filtered_messages)
    log(f"Filtered messages for session {session_id}. Count: {len(filtered_messages)}")

    return make_json_response(
        {"message": f"Successfully filtered messages. {len(filtered_messages)} messages remaining."},
        filename='filter_confirmation.json'
    )
