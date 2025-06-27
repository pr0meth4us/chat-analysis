# chat_analysis/routes/process_routes.py
from flask import Blueprint, request, jsonify
from ..session_manager import session_manager
from ..utils import log
from ..background_task_manager import get_task_manager
from ..workers import process_file_worker

process_bp = Blueprint('process', __name__)

@process_bp.route('/process', methods=['POST'])
def process_data_endpoint():
    if 'file' not in request.files:
        return jsonify({"error": "No file part in the request"}), 400

    uploaded_file = request.files['file']
    if uploaded_file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    try:
        file_content = uploaded_file.read()
        filename = uploaded_file.filename

        task_manager = get_task_manager()
        session_id = session_manager.get_session_id()

        # Submit the task to the background task manager
        task_id = task_manager.submit_task(
            session_id,
            process_file_worker, # Use the directly integrated worker
            session_id,
            file_content,
            filename
        )

        log(f"Started file processing task {task_id} for file '{filename}'.")

        initial_status = task_manager.get_task_status(task_id)
        return jsonify(initial_status), 202

    except Exception as e:
        log(f"ERROR: An unexpected error occurred in the /process endpoint: {e}")
        return jsonify({"error": "An internal server error occurred.", "details": str(e)}), 500