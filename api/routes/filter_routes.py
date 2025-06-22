from api.session_manager import session_manager
from api.helpers.response_helpers import make_json_response
from flask import request
from utils import log
from flask import Blueprint, jsonify
import copy

filter_bp = Blueprint('filter_routes', __name__)

@filter_bp.route('/filter', methods=['POST'])
def filter_messages_endpoint():
    data = request.get_json() or {}
    session_id = session_manager.get_session_id()

    original_messages = session_manager.get_processed_messages(session_id)
    if not original_messages:
        return jsonify({"error": "No processed messages found in the session to filter."}), 400

    # --- MODIFICATION START ---
    # New, more generic data structure from the frontend
    group_mappings = data.get('group_mappings', {})  # e.g., {"Adam": ["John Doe"], "Eve": ["Jane D."]}
    unassigned_label = data.get('unassigned_label', 'Other')
    remove_list = set(data.get('remove', []))

    # Create a reverse map for quick lookups: { "John Doe": "Adam" }
    sender_to_group_map = {sender: group_name for group_name, senders in group_mappings.items() for sender in senders}
    # --- MODIFICATION END ---

    filtered_messages = []
    for original_msg in original_messages:
        sender = original_msg.get('sender')

        if sender in remove_list:
            continue

        msg = original_msg.copy()

        # --- MODIFICATION START ---
        # Re-label the sender based on the group they were assigned to
        if sender in sender_to_group_map:
            msg['sender'] = sender_to_group_map[sender]
        else:
            # If a sender is not in any group, label them as 'unassigned_label'
            # (unless no groups were defined at all)
            if group_mappings:
                msg['sender'] = unassigned_label
        # --- MODIFICATION END ---

        filtered_messages.append(msg)

    session_manager.store_filtered_messages(session_id, filtered_messages)
    log(f"Filtered messages for session {session_id}. Count: {len(filtered_messages)}")

    return make_json_response(
        {"message": f"Successfully filtered messages. {len(filtered_messages)} messages remaining."},
        filename='filter_confirmation.json'
    )