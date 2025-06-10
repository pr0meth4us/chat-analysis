from flask import Blueprint, request, jsonify, current_app
from ..parser.main_parser import process_uploaded_files
from ..utils import log

bp = Blueprint("upload", __name__)

@bp.route("/upload", methods=["POST"])
def upload_files():
    if "files" not in request.files:
        return jsonify({"error": "No file part in the request"}), 400

    files = request.files.getlist("files")
    if not files or all(f.filename == "" for f in files):
        return jsonify({"error": "No selected files"}), 400

    processed_messages = process_uploaded_files(files)
    unique_senders = sorted({msg.get("sender") for msg in processed_messages if msg.get("sender")})

    log(f"Uploaded {len(files)} files, parsed {len(processed_messages)} messages.")
    return jsonify({
        "message": f"Processed {len(processed_messages)} messages.",
        "unique_senders": unique_senders,
        "processed_messages": processed_messages,
    })
