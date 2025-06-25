import os
import uuid
import tempfile
from flask import Blueprint, request, jsonify
from ..session_manager import session_manager
from ..utils import log
from ..workers import process_file_worker
from ..background_task_manager import get_task_manager

process_bp = Blueprint('process', __name__)


@process_bp.route('/process', methods=['POST'])
def process_data_endpoint():
    uploaded_files = request.files.getlist('file')

    if not uploaded_files or all(f.filename == '' for f in uploaded_files):
        return jsonify({"error": "No selected files"}), 400

    temp_paths = []
    uploaded_filenames = []
    temp_dir = tempfile.gettempdir()

    try:
        for uploaded_file in uploaded_files:
            if uploaded_file.filename == '': continue
            temp_filename = f"upload_{uuid.uuid4().hex}_{uploaded_file.filename}"
            temp_path = os.path.join(temp_dir, temp_filename)
            uploaded_file.save(temp_path)
            temp_paths.append(temp_path)
            uploaded_filenames.append(uploaded_file.filename)
            log(f"File saved temporarily to: {temp_path}")

        if not temp_paths:
            return jsonify({"error": "No processable files were uploaded."}), 400

    except Exception as e:
        log(f"ERROR: Failed to save temporary file(s): {str(e)}")
        for path in temp_paths:
            if os.path.exists(path):
                os.remove(path)
        return jsonify({"error": "Could not save uploaded file(s) for processing."}), 500

    task_manager = get_task_manager()
    session_id = session_manager.get_session_id()
    task_id = task_manager.submit_task(session_id, process_file_worker, session_id, temp_paths)

    log(f"Started processing task {task_id} for files: {', '.join(uploaded_filenames)}")

    initial_task_status = task_manager.get_task_status(task_id)
    return jsonify(initial_task_status), 202
