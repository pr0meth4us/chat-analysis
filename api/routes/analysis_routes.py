from api.workers import run_analysis_worker
from flask import Blueprint, request, jsonify
from api.session_manager import session_manager
from utils import log
from api.background_task_manager import task_manager

analysis_bp = Blueprint('analysis', __name__)


@analysis_bp.route('/analyze', methods=['POST'])
def analyze_data_endpoint():
    payload = request.get_json(silent=True) or {}
    modules_to_run = payload.get('modules_to_run')

    session_id = session_manager.get_session_id()
    messages = session_manager.get_filtered_messages(session_id)

    if not messages:
        messages = session_manager.get_processed_messages(session_id)
        if not messages:
            return jsonify({"error": "No messages found to analyze."}), 400
        log("Warning: Analyzing unfiltered data.")

    log(f"Starting analysis for session {session_id} with {len(messages)} messages.")

    task_id = task_manager.submit_task(
        session_id, run_analysis_worker, messages, session_id, modules_to_run=modules_to_run
    )

    log(f"Submitted analysis task {task_id} for session {session_id}")
    initial_task_status = task_manager.get_task_status(task_id)
    return jsonify(initial_task_status), 202
