from flask import Blueprint, request, jsonify
from api.session_manager import session_manager
from utils import log
import re
from collections import Counter
from thefuzz import fuzz

search_bp = Blueprint('countword', __name__)

@search_bp.route('/count_keyword', methods=['POST'])
def count_keyword_endpoint():
    payload = request.get_json()
    if not payload or 'keyword' not in payload:
        return jsonify({"error": "Keyword is required."}), 400

    keyword = payload['keyword']
    session_id = session_manager.get_session_id()

    # --- FIX START ---
    # get_filtered_messages returns the entire data object, not just the message list.
    filtered_data = session_manager.get_filtered_messages(session_id)

    # We must extract the list of messages from the 'messages' key.
    if not filtered_data or 'messages' not in filtered_data:
        return jsonify({"error": "No filtered messages found. Please filter messages before searching."}), 400

    messages_list = filtered_data.get('messages', [])
    # --- FIX END ---

    log(f"Counting keyword '{keyword}' for session {session_id} in {len(messages_list)} messages.")

    pattern = re.compile(r'\b' + re.escape(keyword) + r'\b', re.IGNORECASE)

    sender_counts = Counter()
    total_matches = 0

    # Now we iterate over the correct list of message dictionaries.
    for msg in messages_list:
        sender = msg.get('sender', 'Unknown')
        message_text = msg.get('message', '')

        if not message_text:
            continue

        matches = pattern.findall(message_text)
        if matches:
            num_matches = len(matches)
            sender_counts[sender] += num_matches
            total_matches += num_matches

    result = {
        "counts": dict(sender_counts),
        "total_matches": total_matches,
        "message_count": len(messages_list)
    }

    return jsonify(result), 200

@search_bp.route('/fuzzy', methods=['POST'])
def fuzzy_search_endpoint():
    payload = request.get_json()
    if not payload or 'query' not in payload:
        return jsonify({"error": "A 'query' phrase is required."}), 400

    query = payload['query']
    cutoff = int(payload.get('cutoff', 75))
    session_id = session_manager.get_session_id()

    filtered_data = session_manager.get_filtered_messages(session_id)

    if not filtered_data or 'messages' not in filtered_data:
        return jsonify({"error": "No filtered messages found. Please filter messages before searching."}), 400

    messages_list = filtered_data.get('messages', [])

    log(f"Starting fuzzy search for query '{query}' with cutoff {cutoff} for session {session_id}.")

    matched_messages = []
    for msg in messages_list:
        message_text = msg.get('message', '')
        if not message_text:
            continue

        score = fuzz.token_set_ratio(query, message_text)

        if score >= cutoff:
            match_info = msg.copy()
            match_info['match_score'] = score
            matched_messages.append(match_info)

    matched_messages.sort(key=lambda x: x['match_score'], reverse=True)

    log(f"Found {len(matched_messages)} fuzzy matches.")

    result = {
        "matches": matched_messages,
        "match_count": len(matched_messages),
        "total_messages_searched": len(messages_list),
        "query": query,
        "similarity_cutoff": cutoff
    }

    return jsonify(result), 200