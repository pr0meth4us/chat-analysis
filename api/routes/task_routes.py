from flask import Blueprint, jsonify
from api.background_task_manager import task_manager
from api.session_manager import session_manager
from api.helpers.response_helpers import make_json_response

tasks_bp = Blueprint('tasks', __name__)

@tasks_bp.route('/status/<task_id>', methods=['GET'])
def get_task_status(task_id):
    """Gets the status of any background task by its ID."""
    status = task_manager.get_task_status(task_id)

    if not status:
        return jsonify({"error": "Task not found"}), 404

    # If the task is completed successfully, embed the result directly
    if status.get('status') == 'completed' and status.get('result'):
        response_data = {
            "status": status.get('status'),
            "progress": 100.0,
            "data": status.get('result')
        }
        # Create a filename for the downloadable result
        session_id = session_manager.get_session_id()
        filename = f"{session_id}-{task_id}-result.json"
        return make_json_response(response_data, filename=filename)

    return jsonify(status)


@tasks_bp.route('/session-tasks', methods=['GET'])
def get_session_tasks():
    """Gets all tasks associated with the current user session."""
    session_id = session_manager.get_session_id()
    tasks = task_manager.get_session_tasks(session_id)
    return jsonify({"session_id": session_id, "tasks": tasks})


@tasks_bp.route('/cancel/<task_id>', methods=['POST'])
def cancel_task(task_id):
    """Cancels a task if it is still in the PENDING state."""
    # Note: This is a placeholder as the current task manager does not support cancellation.
    # To implement this, you would add a `cancel_task` method to the manager.
    return jsonify({"error": "Task cancellation not implemented"}), 501
