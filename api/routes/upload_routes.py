import os
from zipfile import ZipFile
from io import BytesIO
from flask import Blueprint, request, jsonify
from api.session_manager import session_manager
from parser.main_parser import process_uploaded_files
from utils import log
from api.helpers.response_helpers import make_json_response

upload_bp = Blueprint('upload', __name__)

@upload_bp.route('/upload', methods=['POST'])
def upload_files():
    """Handle file upload and processing"""
    if 'files' not in request.files:
        return jsonify({"error": "No file part in the request"}), 400

    files = request.files.getlist('files')
    if not files or all(f.filename == '' for f in files):
        return jsonify({"error": "No selected files"}), 400

    processed = process_uploaded_files(files)
    session_id = session_manager.get_session_id()
    session_manager.store_processed_messages(session_id, processed)

    log(f"Uploaded {len(files)} files, parsed {len(processed)} messages. Session: {session_id}")

    return make_json_response({
        "message": f"Processed {len(processed)} messages.",
        "session_id": session_id,
        "unique_senders": sorted({m.get('sender') for m in processed if m.get('sender')})
    }, filename='processed.json')

@upload_bp.route('/upload-zip', methods=['POST'])
def upload_zip():
    """Handle ZIP file upload and processing"""
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

    processed = process_uploaded_files(file_objs)
    session_id = session_manager.get_session_id()
    session_manager.store_processed_messages(session_id, processed)

    log(f"Uploaded ZIP with {len(file_objs)} files, parsed {len(processed)} messages. Session: {session_id}")

    return make_json_response({
        "message": f"Processed {len(processed)} messages from ZIP.",
        "session_id": session_id,
        "unique_senders": sorted({m.get('sender') for m in processed if m.get('sender')})
    }, filename='processed.json')
