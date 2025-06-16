from api.session_manager import session_manager
from api.helpers.response_helpers import make_json_response
from utils import log
from flask import Blueprint, jsonify

data_bp = Blueprint('data', __name__)


@data_bp.route('/data/processed', methods=['GET'])
def download_processed_messages():
    """Downloads the full set of messages after initial processing."""
    session_id = session_manager.get_session_id()
    messages = session_manager.get_processed_messages(session_id)

    if not messages:
        return jsonify({"error": "No processed messages found in session."}), 404

    log(f"Providing download for {len(messages)} processed messages.")
    return make_json_response(messages, filename="processed_messages.json")


@data_bp.route('/data/filtered', methods=['GET'])
def download_filtered_messages():
    """Downloads the messages after they have been filtered."""
    session_id = session_manager.get_session_id()
    messages = session_manager.get_filtered_messages(session_id)

    if not messages:
        return jsonify({"error": "No filtered messages found in session. Please filter first."}), 404

    log(f"Providing download for {len(messages)} filtered messages.")
    return make_json_response(messages, filename="filtered_messages.json")


@data_bp.route('/data/report', methods=['GET'])
def download_analysis_report():
    """Downloads the latest analysis report."""
    session_id = session_manager.get_session_id()
    report = session_manager.get_analysis_result(session_id)

    if not report:
        return jsonify({"error": "No analysis report found in session. Please run an analysis first."}), 404

    log("Providing download for analysis report.")
    return make_json_response(report, filename="analysis_report.json")
