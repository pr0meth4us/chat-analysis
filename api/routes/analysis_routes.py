import json

from flask import Blueprint, request

from analyzer.main_analyzer import ChatAnalyzer
from api.session_manager import session_manager
from helpers.response_helpers import make_json_response
from utils import log

analysis_bp = Blueprint('analysis', __name__)

@analysis_bp.route('/analyze', methods=['POST'])
def analyze_messages():
    """Analyze filtered messages and generate report"""
    session_id = session_manager.get_session_id()
    raw_messages = None

    if request.is_json:
        payload = request.get_json(silent=True) or {}
        raw_messages = payload.get('filtered_messages')

    if 'file' in request.files:
        try:
            f = request.files['file']
            file_data = json.load(f)
            raw_messages = file_data.get('filtered_messages')
        except Exception:
            return make_json_response({"error": "Invalid JSON file"}, f"{session_id}-analysis.json", status_code=400)

    if not isinstance(raw_messages, list):
        raw_messages = session_manager.get_filtered_messages(session_id)
        log(f"Using stored filtered messages from session {session_id}: {len(raw_messages or [])} messages")

    if not raw_messages:
        return make_json_response(
            {"error": "No messages to analyze."},
            f"{session_id}-analysis.json", status_code=400
        )

    messages = [{
        'source': m.get('source','unknown'), 'sender': m.get('sender','unknown'),
        'message': m.get('message',''), 'timestamp': m.get('timestamp')
    } for m in raw_messages if isinstance(m, dict)]
    if not messages:
        return make_json_response({"error": "No valid message objects to analyze."}, f"{session_id}-analysis.json", status_code=400)

    analyzer = ChatAnalyzer(messages, input_type='messages')
    analyzer.load_and_preprocess()
    if analyzer.df.empty:
        return make_json_response({"error": "Internal error: failed to build analysis data."}, f"{session_id}-analysis.json", status_code=500)

    try:
        report = analyzer.generate_comprehensive_report()
    except Exception as e:
        log(f"Analysis error: {e}")
        return make_json_response({"error": "Analysis failed internally."}, f"{session_id}-analysis.json", status_code=500)

    return make_json_response({'analysis_report': report}, f"{session_id}-analysis.json")


@analysis_bp.route('/count_keyword', methods=['POST'])
def count_keyword():
    """Count keyword occurrences in messages by sender"""
    session_id = session_manager.get_session_id()
    data = request.get_json() or {}
    keyword = data.get('keyword')
    messages = data.get('messages')
    if not isinstance(messages, list):
        messages = session_manager.get_filtered_messages(session_id)
    if not keyword or not isinstance(messages, list):
        return make_json_response({"error": "Provide 'keyword'."}, f"{session_id}-count.json", status_code=400)

    counts = {}
    kl = keyword.lower()
    for msg in messages:
        text = msg.get('message','')
        if kl in text.lower(): counts[msg.get('sender')] = counts.get(msg.get('sender'),0)+1
    result = {"keyword":keyword, "message_count":len(messages), "total_matches":sum(counts.values()), "counts":counts}
    return make_json_response(result, f"{session_id}-count.json")