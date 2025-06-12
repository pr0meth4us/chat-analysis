import json
from flask import Blueprint, request, jsonify
from api.session_manager import session_manager
from analyzer.main_analyzer import ChatAnalyzer
from utils import log

analysis_bp = Blueprint('analysis', __name__)

@analysis_bp.route('/analyze', methods=['POST'])
def analyze_messages():
    """Analyze filtered messages and generate report"""
    raw_messages = None
    session_id = session_manager.get_session_id()

    # 1) Try JSON payload
    if request.is_json:
        data = request.get_json(silent=True) or {}
        raw_messages = data.get('filtered_messages')

    # 2) Try file upload
    if 'file' in request.files:
        try:
            f = request.files['file']
            file_data = json.load(f)
            raw_messages = file_data.get('filtered_messages')
        except Exception:
            return jsonify({"error": "Invalid JSON file"}), 400

    # 3) Session fallback
    if not isinstance(raw_messages, list):
        raw_messages = session_manager.get_filtered_messages(session_id)
        log(f"Using stored filtered messages from session {session_id}: {len(raw_messages or [])} messages")

    # Validate messages
    if not raw_messages:
        return jsonify({
            "error": "No messages to analyze. Upload and filter first, or provide 'filtered_messages'."
        }), 400

    # Prepare full message dicts
    messages = []
    for msg in raw_messages:
        if isinstance(msg, dict):
            messages.append({
                'sender': msg.get('sender', 'unknown'),
                'message': msg.get('message', ''),
                'timestamp': msg.get('timestamp')
            })

    if not messages:
        return jsonify({"error": "No valid message objects to analyze."}), 400

    # Initialize analyzer and preprocess
    analyzer = ChatAnalyzer(messages, input_type='messages')
    analyzer.load_and_preprocess()

    # Defensive check
    if not hasattr(analyzer, 'df') or analyzer.df is None or analyzer.df.empty:
        return jsonify({"error": "Internal error: failed to build analysis data."}), 500

    try:
        report = analyzer.generate_comprehensive_report()
    except Exception as e:
        log(f"Analysis error: {e}")
        return jsonify({"error": "Analysis failed internally."}), 500

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
