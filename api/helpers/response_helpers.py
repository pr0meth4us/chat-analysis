import io
import json
from flask import request, jsonify, send_file

def should_download():
    """Check if response should be downloaded as file"""
    q = request.args.get('download', '').lower()
    f = request.form.get('download', '').lower()
    return q == 'true' or f == 'true'

def make_json_response(data: dict, filename: str = 'data.json'):
    """Create JSON response or file download based on request parameters"""
    if should_download():
        buf = io.BytesIO(json.dumps(data, ensure_ascii=False, indent=2).encode('utf-8'))
        return send_file(
            buf,
            mimetype='application/json',
            as_attachment=True,
            download_name=filename
        )
    return jsonify(data)

