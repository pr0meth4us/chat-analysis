from flask import Blueprint, jsonify

from api.background_task_manager import task_manager
from api.session_manager import session_manager
from utils import log

tasks_bp = Blueprint('tasks', __name__)


@tasks_bp.route('/status/<task_id>', methods=['GET'])
def get_task_status_endpoint(task_id):
    """Gets the status of any background task (processing or analysis)."""
    status = task_manager.get_task_status(task_id)
    if not status:
        return jsonify({"error": "Task not found"}), 404
    return jsonify(status)


@tasks_bp.route('/session', methods=['GET'])
def get_session_tasks_endpoint():
    """Gets all tasks associated with the current user session."""
    session_id = session_manager.get_session_id()
    tasks = task_manager.get_session_tasks(session_id)
    return jsonify({"session_id": session_id, "tasks": tasks})


@tasks_bp.route('/session/clear', methods=['POST'])
def clear_session_endpoint():
    """Clears all data for the current session, including associated tasks."""
    session_id = session_manager.get_session_id()

    # --- ADDED: Clear tasks from the task manager ---
    task_manager.clear_session_tasks(session_id)

    # This function clears file-based storage
    session_manager.clear_session_data(session_id)

    log(f"Cleared all data and tasks for session {session_id}")
    return jsonify({"message": "Session data and associated tasks have been cleared."})