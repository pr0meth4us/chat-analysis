import json
from flask import Blueprint, request, jsonify
from api.session_manager import session_manager
from analyzer.main_analyzer import ChatAnalyzer
from utils import log

analysis_bp = Blueprint('analysis', __name__)

@analysis_bp.route('/analyze', methods=['POST'])
def analyze_messages():
    """Analyze filtered messages and generate report"""
    messages = None

    # Accept JSON body or uploaded JSON file
    if 'file' in request.files:
        f = request.files['file']
        try:
            data = json.load(f)
            messages = data.get('filtered_messages')
        except Exception:
            return jsonify({"error": "Invalid JSON file"}), 400
    else:
        body = request.get_json() or {}
        messages = body.get('filtered_messages')

    # If no messages provided, check session store
    if not messages:
        session_id = session_manager.get_session_id()
        stored_filtered = session_manager.get_filtered_messages(session_id)
        if stored_filtered:
            minimal = stored_filtered
            log(f"Using stored filtered messages from session {session_id}: {len(minimal)} messages")
        else:
            return jsonify({
                "error": "Provide 'filtered_messages' list, upload JSON file, or filter messages first"
            }), 400
    else:
        if not isinstance(messages, list) or not messages:
            return jsonify({
                "error": "Provide 'filtered_messages' list, upload JSON file, or filter messages first"
            }), 400
        # Reconstruct minimal message dict for analyzer
        minimal = [{'message': m} for m in messages]

    analyzer = ChatAnalyzer(minimal)
    report = analyzer.generate_comprehensive_report()
    return jsonify({"analysis_report": report})

@analysis_bp.route('/count_keyword', methods=['POST'])
def count_keyword():
    """Count keyword occurrences in messages by sender"""
    data = request.get_json() or {}
    keyword = data.get('keyword')
    messages = data.get('messages')

    if not messages:
        session_id = session_manager.get_session_id()
        messages = session_manager.get_filtered_messages(session_id)

    if not keyword or not isinstance(messages, list):
        return jsonify({
            "error": "Provide 'keyword' and ensure messages are available"
        }), 400

    keyword_lower = keyword.lower()
    counts = {}

    for msg in messages:
        sender = msg.get('sender')
        text = msg.get('message', '')
        if keyword_lower in text.lower():
            counts[sender] = counts.get(sender, 0) + 1

    return jsonify({
        "keyword": keyword,
        "message_count": len(messages),
        "total_matches": sum(counts.values()),
        "counts": counts
    })