from flask import Blueprint, jsonify, request
from ..session_manager import session_manager
from ..helpers.response_helpers import make_json_response
from ..utils import log

data_bp = Blueprint('data', __name__)

@data_bp.route('/data/processed', methods=['GET'])
def download_processed_messages():
    session_id = session_manager.get_session_id()
    messages = session_manager.get_processed_messages(session_id)

    if not messages:
        return jsonify({"error": "No processed messages found in session."}), 404

    log(f"Providing download for {len(messages)} processed messages.")
    return make_json_response(messages, filename="processed_messages.json")


@data_bp.route('/data/filtered', methods=['GET'])
def download_filtered_messages():
    session_id = session_manager.get_session_id()
    messages = session_manager.get_filtered_messages(session_id)

    if not messages:
        return jsonify({"error": "No filtered messages found in session. Please filter first."}), 404

    log(f"Providing download for {len(messages)} filtered messages.")
    return make_json_response(messages, filename="filtered_messages.json")


@data_bp.route('/data/report', methods=['GET'])
def download_analysis_report():
    session_id = session_manager.get_session_id()
    report = session_manager.get_analysis_result(session_id)

    if not report:
        return jsonify({"error": "No analysis report found in session. Please run an analysis first."}), 404

    log("Providing download for analysis report.")
    return make_json_response(report, filename="analysis_report.json")


@data_bp.route('/data/insert/processed', methods=['POST'])
def insert_processed_messages():
    session_id = session_manager.get_session_id()
    messages = request.get_json()

    if not messages or not isinstance(messages, list):
        return jsonify({"error": "Request body must be a JSON list of message objects."}), 400

    try:
        session_manager.store_processed_messages(session_id, messages)
        log(f"Inserted {len(messages)} processed messages into session {session_id}.")
        return jsonify({"message": "Successfully inserted processed messages.", "count": len(messages)}), 201
    except Exception as e:
        log(f"ERROR inserting processed messages: {e}")
        return jsonify({"error": "An internal error occurred while storing messages."}), 500


@data_bp.route('/data/insert/filtered', methods=['POST'])
def insert_filtered_messages():
    session_id = session_manager.get_session_id()
    request_data = request.get_json()
    if not isinstance(request_data, dict):
        return jsonify({"error": "Request body must be a JSON object."}), 400

    if 'messages' not in request_data or not isinstance(request_data['messages'], list):
        return jsonify(
            {"error": "Request JSON object must contain a 'messages' key with a list of message objects."}), 400
    filtered_data_to_store = request_data.copy()
    message_count = len(filtered_data_to_store['messages'])
    filtered_data_to_store['timestamp'] = session_manager._get_current_timestamp()
    filtered_data_to_store['count'] = message_count

    try:
        session_manager.store_filtered_messages(session_id, filtered_data_to_store)
        log(f"Inserted full filtered data object with {message_count} messages into session {session_id}.")
        return jsonify({
            "message": "Successfully inserted filtered data object.",
            "count": message_count
        }), 201
    except Exception as e:
        log(f"ERROR inserting filtered data object: {e}")
        return jsonify({"error": "An internal error occurred while storing the data."}), 500


@data_bp.route('/data/insert/report', methods=['POST'])
def insert_analysis_report():
    session_id = session_manager.get_session_id()
    report = request.get_json()

    if not report or not isinstance(report, dict):
        return jsonify({"error": "Request body must be a JSON object representing the report."}), 400

    try:
        session_manager.store_analysis_result(session_id, report)
        log(f"Inserted analysis report into session {session_id}.")
        return jsonify({"message": "Successfully inserted analysis report."}), 201
    except Exception as e:
        log(f"ERROR inserting analysis report: {e}")
        return jsonify({"error": "An internal error occurred while storing the report."}), 500

@data_bp.route('/data/clear/processed', methods=['POST'])
def clear_processed_messages():
    session_id = session_manager.get_session_id()
    try:
        session_manager.clear_processed_messages(session_id)
        session_manager.clear_filtered_messages(session_id)
        session_manager.clear_analysis_result(session_id)
        log(f"Cleared all processed, filtered, and analysis data for session {session_id}.")
        return jsonify({"message": "Successfully cleared processed data and subsequent steps."}), 200
    except Exception as e:
        log(f"ERROR clearing processed data: {e}")
        return jsonify({"error": "An internal error occurred."}), 500

@data_bp.route('/data/clear/filtered', methods=['POST'])
def clear_filtered_messages():
    session_id = session_manager.get_session_id()
    try:
        session_manager.clear_filtered_messages(session_id)
        session_manager.clear_analysis_result(session_id)
        log(f"Cleared filtered and analysis data for session {session_id}.")
        return jsonify({"message": "Successfully cleared filtered data and analysis report."}), 200
    except Exception as e:
        log(f"ERROR clearing filtered data: {e}")
        return jsonify({"error": "An internal error occurred."}), 500


@data_bp.route('/data/clear/report', methods=['POST'])
def clear_analysis_report():
    session_id = session_manager.get_session_id()
    try:
        session_manager.clear_analysis_result(session_id)
        log(f"Cleared analysis report for session {session_id}.")
        return jsonify({"message": "Successfully cleared analysis report."}), 200
    except Exception as e:
        log(f"ERROR clearing analysis report: {e}")
        return jsonify({"error": "An internal error occurred."}), 500
