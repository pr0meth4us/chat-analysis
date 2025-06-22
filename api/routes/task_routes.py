from flask import Blueprint, jsonify

from api.background_task_manager import task_manager
from api.session_manager import session_manager
from utils import log

tasks_bp = Blueprint('tasks', __name__)


@tasks_bp.route('/status/<task_id>', methods=['GET'])
def get_task_status_endpoint(task_id):
    """Gets the status of a specific task."""
    status = task_manager.get_task_status(task_id)
    if not status:
        return jsonify({"error": "Task not found"}), 404
    return jsonify(status)


@tasks_bp.route('/session', methods=['GET'])
def get_session_tasks_endpoint():
    """Gets all tasks associated with the current session."""
    session_id = session_manager.get_session_id()
    tasks = task_manager.get_session_tasks(session_id)
    return jsonify({"session_id": session_id, "tasks": tasks})


@tasks_bp.route('/session/clear', methods=['POST'])
def clear_session_endpoint():
    """Clears all data and tasks for the current session."""
    session_id = session_manager.get_session_id()
    task_manager.clear_session_tasks(session_id)
    session_manager.clear_session_data(session_id)

    log(f"Cleared all data and tasks for session {session_id}")
    return jsonify({"message": "Session data and associated tasks have been cleared."})


# --- NEW ENDPOINT ---
@tasks_bp.route('/cancel/<task_id>', methods=['POST'])
def cancel_task_endpoint(task_id):
    log(f"Received request to cancel task {task_id}")
    success = task_manager.cancel_task(task_id)

    if not success:
        return jsonify({"error": "Task not found or could not be cancelled."}), 404

    return jsonify({"message": f"Task {task_id} has been successfully cancelled."}), 200
