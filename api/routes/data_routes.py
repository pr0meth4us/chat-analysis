from flask import Blueprint, jsonify, request
from api.session_manager import session_manager
from api.helpers.response_helpers import make_json_response
from utils import log

data_bp = Blueprint('data', __name__)

# ==============================================================================
# GET (DOWNLOAD) ROUTES
# ==============================================================================

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


# ==============================================================================
# POST (INSERT/UPLOAD) ROUTES
# ==============================================================================

@data_bp.route('/data/insert/processed', methods=['POST'])
def insert_processed_messages():
    """Inserts a list of processed messages into the session."""
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
    """Inserts a list of filtered messages into the session."""
    session_id = session_manager.get_session_id()
    messages = request.get_json()

    if not messages or not isinstance(messages, list):
        return jsonify({"error": "Request body must be a JSON list of message objects."}), 400

    try:
        session_manager.store_filtered_messages(session_id, messages)
        log(f"Inserted {len(messages)} filtered messages into session {session_id}.")
        return jsonify({"message": "Successfully inserted filtered messages.", "count": len(messages)}), 201
    except Exception as e:
        log(f"ERROR inserting filtered messages: {e}")
        return jsonify({"error": "An internal error occurred while storing messages."}), 500


@data_bp.route('/data/insert/report', methods=['POST'])
def insert_analysis_report():
    """Inserts a full analysis report into the session."""
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

# ==============================================================================
# POST (CLEAR) ROUTES
# ==============================================================================

@data_bp.route('/data/clear/processed', methods=['POST'])
def clear_processed_messages():
    """Clears processed messages, which will also clear subsequent filtered and analysis data."""
    session_id = session_manager.get_session_id()
    try:
        # Clearing processed implies subsequent data is invalid
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
    """Clears filtered messages and the analysis report which depends on them."""
    session_id = session_manager.get_session_id()
    try:
        # Clearing filtered implies analysis is invalid
        session_manager.clear_filtered_messages(session_id)
        session_manager.clear_analysis_result(session_id)
        log(f"Cleared filtered and analysis data for session {session_id}.")
        return jsonify({"message": "Successfully cleared filtered data and analysis report."}), 200
    except Exception as e:
        log(f"ERROR clearing filtered data: {e}")
        return jsonify({"error": "An internal error occurred."}), 500


@data_bp.route('/data/clear/report', methods=['POST'])
def clear_analysis_report():
    """Clears only the analysis report."""
    session_id = session_manager.get_session_id()
    try:
        session_manager.clear_analysis_result(session_id)
        log(f"Cleared analysis report for session {session_id}.")
        return jsonify({"message": "Successfully cleared analysis report."}), 200
    except Exception as e:
        log(f"ERROR clearing analysis report: {e}")
        return jsonify({"error": "An internal error occurred."}), 500
