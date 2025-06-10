from flask import Blueprint, request, jsonify
from ..analyzer.main_analyzer import ChatAnalyzer
from ..utils import log

bp = Blueprint("analyze", __name__)

@bp.route("/filter_and_analyze", methods=["POST"])
def filter_and_analyze():
    data = request.get_json() or {}
    messages = data.get("messages")
    me_list = set(data.get("me", []))
    remove_list = set(data.get("remove", []))
    other_label = data.get("other_label", "other")

    if not isinstance(messages, list):
        return jsonify({"error": "No messages provided"}), 400

    grouped = []
    for msg in messages:
        sender = msg.get("sender")
        if sender in remove_list:
            continue
        msg["sender"] = "me" if sender in me_list else other_label
        grouped.append(msg)

    log(f"Kept {len(grouped)} messages after filtering.")

    # Fix: Initialize analyzer with messages and specify input_type
    analyzer = ChatAnalyzer(grouped, input_type='messages')

    # Fix: Call load_and_preprocess before generating report
    analyzer.load_and_preprocess()

    # Now generate the report
    report = analyzer.generate_comprehensive_report()
    return jsonify(report)