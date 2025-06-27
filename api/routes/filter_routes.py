from ..helpers.response_helpers import make_json_response
from flask import request
from flask import Blueprint, jsonify
from datetime import datetime

filter_bp = Blueprint('filter_routes', __name__)

@filter_bp.route('/filter', methods=['POST'])
def filter_messages_endpoint():
    from ..session_manager import session_manager

    data = request.get_json() or {}
    session_id = session_manager.get_session_id()

    processed_data = session_manager.get_processed_messages(session_id)
    if not processed_data:
        return jsonify({"error": "No processed messages found in the session to filter."}), 400

    # Handle both old format (dict with 'messages' key) and new format (list of messages)
    if isinstance(processed_data, dict) and 'messages' in processed_data:
        original_messages = processed_data['messages']
    elif isinstance(processed_data, list):
        original_messages = processed_data
    else:
        return jsonify({"error": "Invalid processed data format."}), 400

    group_mappings = data.get('group_mappings', {})  # e.g., {"Adam": ["John Doe"], "Eve": ["Jane D."]}
    unassigned_label = data.get('unassigned_label', 'Other')
    remove_list = set(data.get('remove', []))

    sender_to_group_map = {sender: group_name for group_name, senders in group_mappings.items() for sender in senders}

    filtered_messages = []
    # Track original sender metadata and message counts
    original_sender_metadata = {}
    sender_to_group_map = {sender: group_name for group_name, senders in group_mappings.items() for sender in senders}

    for original_msg in original_messages:
        sender = original_msg.get('sender')
        source = original_msg.get('source', 'Unknown')

        if sender in remove_list:
            continue

        msg = original_msg.copy()

        # Track original sender metadata regardless of grouping
        if sender and sender not in original_sender_metadata:
            original_sender_metadata[sender] = {
                'source': source,
                'count': 0
            }
        if sender:
            original_sender_metadata[sender]['count'] += 1

        # Apply grouping for the filtered messages
        if sender in sender_to_group_map:
            new_sender_name = sender_to_group_map[sender]
            msg['sender'] = new_sender_name
        else:
            if group_mappings:
                msg['sender'] = unassigned_label

        filtered_messages.append(msg)

    # Create compact metadata format with original senders
    compact_participants_metadata = {}
    for sender, metadata in original_sender_metadata.items():
        source = metadata['source']
        count = metadata['count']
        # Format: "original_sender": "source, message_count"
        compact_participants_metadata[sender] = f"{source}, {count}"

    # Create the filtered data structure with messages and metadata
    filtered_data = {
        'messages': filtered_messages,
        'metadata': {
            'participants': compact_participants_metadata,
            'messages_total': len(original_messages),
            'filtered_messages': len(filtered_messages)
        },
        'filter_settings': {
            'group_mappings': group_mappings,
            'unassigned_label': unassigned_label,
            'removed_senders': list(remove_list)
        },
        'timestamp': datetime.now().isoformat(),
        'count': len(filtered_messages)
    }

    # Store the complete filtered data (messages + metadata)
    session_manager.store_filtered_messages(session_id, filtered_data)

    return make_json_response(
        {"message": f"Successfully filtered messages. {len(filtered_messages)} messages remaining."},
        filename='filter_confirmation.json'
    )