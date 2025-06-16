import os
from zipfile import ZipFile
from io import BytesIO
from flask import Blueprint, request, jsonify
from api.session_manager import session_manager
from parser.main_parser import process_uploaded_files
from utils import log
from api.helpers.response_helpers import make_json_response
from api.background_task_manager import task_manager

upload_bp = Blueprint('upload', __name__)


def process_files_with_progress(files, session_id, progress_callback=None):
    """Process files with progress reporting"""
    try:
        if progress_callback:
            progress_callback(10.0)

        processed = process_uploaded_files(files, progress_callback)

        if progress_callback:
            progress_callback(90.0)

        session_manager.store_processed_messages(session_id, processed)

        if progress_callback:
            progress_callback(100.0)

        return {
            "message": f"Processed {len(processed)} messages.",
            "session_id": session_id,
            "unique_senders": sorted({m.get('sender') for m in processed if m.get('sender')})
        }
    except Exception as e:
        log(f"Error processing files: {str(e)}")
        raise


@upload_bp.route('/upload', methods=['POST'])
def upload_files():
    """Handle file upload and processing with background tasks"""
    if 'files' not in request.files:
        return jsonify({"error": "No file part in the request"}), 400

    files = request.files.getlist('files')
    if not files or all(f.filename == '' for f in files):
        return jsonify({"error": "No selected files"}), 400

    session_id = session_manager.get_session_id()

    # For small uploads, process immediately
    total_size = sum(len(f.read()) for f in files)
    for f in files:
        f.seek(0)  # Reset file pointers

    if total_size < 1024 * 1024:  # Less than 1MB, process immediately
        try:
            result = process_files_with_progress(files, session_id)
            log(f"Uploaded {len(files)} files, parsed {len(result['unique_senders'])} messages. Session: {session_id}")
            return make_json_response(result, filename='processed.json')
        except Exception as e:
            return jsonify({"error": f"Processing failed: {str(e)}"}), 500

    # For larger uploads, use background processing
    task_id = task_manager.submit_task(session_id, process_files_with_progress, files, session_id)

    log(f"Started background task {task_id} for {len(files)} files. Session: {session_id}")

    return jsonify({
        "message": "Upload started. Processing in background.",
        "task_id": task_id,
        "session_id": session_id,
        "status": "processing"
    }), 202


@upload_bp.route('/upload-zip', methods=['POST'])
def upload_zip():
    """Handle ZIP file upload and processing with background tasks"""
    if 'zipfile' not in request.files:
        return jsonify({"error": "No zipfile part in the request"}), 400

    zip_storage = request.files['zipfile']

    try:
        archive = ZipFile(BytesIO(zip_storage.read()))
    except Exception:
        return jsonify({"error": "Invalid ZIP archive"}), 400

    file_objs = []
    for member in archive.namelist():
        base = os.path.basename(member)
        if member.endswith('/') or member.startswith('__MACOSX/') or base.startswith('._'):
            continue

        try:
            f = archive.open(member)
            setattr(f, 'filename', member)
            file_objs.append(f)
        except Exception:
            log(f"Skipping unreadable file: {member}")

    if not file_objs:
        return jsonify({"error": "No valid files in ZIP"}), 400

    session_id = session_manager.get_session_id()

    # Use background processing for ZIP files (they're typically larger)
    task_id = task_manager.submit_task(session_id, process_files_with_progress, file_objs, session_id)

    log(f"Started background task {task_id} for ZIP with {len(file_objs)} files. Session: {session_id}")

    return jsonify({
        "message": "ZIP upload started. Processing in background.",
        "task_id": task_id,
        "session_id": session_id,
        "status": "processing"
    }), 202


@upload_bp.route('/task-status/<task_id>', methods=['GET'])
def get_task_status(task_id):
    """Get the status of a background task"""
    status = task_manager.get_task_status(task_id)

    if not status:
        return jsonify({"error": "Task not found"}), 404

    # If task is completed, also return the processed data
    if status['status'] == 'completed' and status['result']:
        result = status['result']
        return make_json_response({
            **status,
            **result
        }, filename='processed.json')

    return jsonify(status)


@upload_bp.route('/session-tasks', methods=['GET'])
def get_session_tasks():
    """Get all tasks for the current session"""
    session_id = session_manager.get_session_id()
    tasks = task_manager.get_session_tasks(session_id)
    return jsonify({"session_id": session_id, "tasks": tasks})


@upload_bp.route('/cancel-task/<task_id>', methods=['POST'])
def cancel_task(task_id):
    """Cancel a pending task"""
    success = task_manager.cancel_task(task_id)

    if success:
        return jsonify({"message": "Task cancelled successfully"})
    else:
        return jsonify({"error": "Task not found or cannot be cancelled"}), 400