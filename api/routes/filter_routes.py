from flask import Blueprint, request, jsonify
from api.session_manager import session_manager
from utils import log
from api.helpers.response_helpers import make_json_response

filter_bp = Blueprint('filter', __name__)

@filter_bp.route('/filter', methods=['POST'])
def filter_messages():
    """Filter and process messages based on criteria"""
    data = request.get_json() or {}

    # Retrieve messages from request or session
    messages = data.get('messages')
    if not messages:
        session_id = session_manager.get_session_id()
        messages = session_manager.get_processed_messages(session_id)
        if not messages:
            return jsonify({
                "error": "No messages found. Upload first or provide 'messages' in body."
            }), 400
        log(f"Filtering stored messages from session {session_id}: {len(messages)} messages")

    # Extract filter parameters
    me_list = set(data.get('me', []))
    remove_list = set(data.get('remove', []))
    other_label = data.get('other_label', 'other')

    # Apply filters and relabel
    grouped = []
    for msg in messages:
        sender = msg.get('sender')
        if sender in remove_list:
            continue
        msg['sender'] = 'me' if sender in me_list else other_label
        grouped.append(msg)

    # Remove duplicates
    seen = {}
    for msg in grouped:
        key = (msg.get('timestamp'), msg.get('sender'), msg.get('message'))
        seen[key] = msg
    cleaned = list(seen.values())

    # Store cleaned messages for analysis
    session_id = session_manager.get_session_id()
    session_manager.store_filtered_messages(session_id, cleaned)

    log(f"Filtered {len(cleaned)} unique messages.")

    # Return only message texts as JSON array
    messages_only = [m.get('message') for m in cleaned]
    return make_json_response({"filtered_messages": messages_only}, filename='filtered.json')
