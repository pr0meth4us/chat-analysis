import os
import uuid
import tempfile

from flask import Blueprint, request, jsonify
from api.session_manager import session_manager
from utils import log
from api.background_task_manager import task_manager
from api.workers import process_file_worker

process_bp = Blueprint('process', __name__)


@process_bp.route('/process', methods=['POST'])
def process_data_endpoint():
    if 'file' not in request.files:
        return jsonify({"error": "No 'file' part in the request"}), 400

    uploaded_file = request.files['file']
    if uploaded_file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    try:
        temp_dir = tempfile.gettempdir()
        temp_filename = f"upload_{uuid.uuid4().hex}_{uploaded_file.filename}"
        temp_path = os.path.join(temp_dir, temp_filename)
        uploaded_file.save(temp_path)
        log(f"File saved temporarily to: {temp_path}")
    except Exception as e:
        log(f"ERROR: Failed to save temporary file: {str(e)}")
        return jsonify({"error": "Could not save uploaded file for processing."}), 500

    session_id = session_manager.get_session_id()
    task_id = task_manager.submit_task(session_id, process_file_worker, session_id, temp_path)

    log(f"Started processing task {task_id} for file {uploaded_file.filename}")
    initial_task_status = task_manager.get_task_status(task_id)
    return jsonify(initial_task_status), 202