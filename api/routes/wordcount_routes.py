from flask import Blueprint, request, jsonify
from api.session_manager import session_manager
from utils import log
import re
from collections import Counter
countword_bp =  Blueprint('countword', __name__)
@countword_bp.route('/count_keyword', methods=['POST'])
def count_keyword_endpoint():
    """Counts a specific keyword in the filtered messages from the session."""
    payload = request.get_json()
    if not payload or 'keyword' not in payload:
        return jsonify({"error": "Keyword is required."}), 400

    keyword = payload['keyword']
    session_id = session_manager.get_session_id()

    # Use filtered messages for keyword search, as it's the most relevant dataset
    messages = session_manager.get_filtered_messages(session_id)
    if not messages:
        return jsonify({"error": "No filtered messages found. Please filter messages before searching."}), 400

    log(f"Counting keyword '{keyword}' for session {session_id} in {len(messages)} messages.")

    # --- Keyword Counting Logic ---
    # Use a case-insensitive regex pattern to find the keyword as a whole word
    pattern = re.compile(r'\b' + re.escape(keyword) + r'\b', re.IGNORECASE)

    sender_counts = Counter()
    total_matches = 0

    for msg in messages:
        sender = msg.get('sender', 'Unknown')
        message_text = msg.get('message', '')

        matches = pattern.findall(message_text)
        if matches:
            num_matches = len(matches)
            sender_counts[sender] += num_matches
            total_matches += num_matches

    result = {
        "counts": dict(sender_counts),
        "total_matches": total_matches,
        "message_count": len(messages)
    }

    return jsonify(result), 200