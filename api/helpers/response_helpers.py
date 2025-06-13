import io
import re
import json
from flask import request, send_file, Response

def should_download() -> bool:
    """Return True if the client asked for a downloadable JSON file."""
    q = request.args.get('download', '').lower()
    f = request.form.get('download', '').lower()
    if q == 'true' or f == 'true':
        return True
    if request.is_json:
        body = request.get_json(silent=True) or {}
        dl = body.get('download')
        if isinstance(dl, bool) and dl:
            return True
        if isinstance(dl, str) and dl.lower() == 'true':
            return True
    return False

def collapse_arrays_in_str(s: str, keys: list) -> str:
    """
    Collapse only the arrays under the given JSON keys into a single line.
    Expects `s` to be a pretty-printed JSON string.
    """
    for key in keys:
        pattern = rf'("{re.escape(key)}"\s*:\s*)\[\s*(.*?)\s*\]'
        s = re.sub(
            pattern,
            lambda m: m.group(1) + '[' + re.sub(r'\s+', ' ', m.group(2).strip()) + ']',
            s,
            flags=re.DOTALL
        )
    return s

def make_json_response(
        data: dict,
        filename: str = 'data.json',
        collapse_paths: list = None,
        status_code: int = 200
):
    """
    Always pretty-print JSON (multi-line).  If ?download=true, return as a downloadable file.
    Collapse only the arrays under collapse_paths into single lines.
    """
    # default fields to collapse if none provided
    default_paths = [
        'analysis_report.word_analysis.top_50_meaningful_words_overall',
        'analysis_report.word_analysis.top_20_bigrams_overall',
        'analysis_report.word_analysis.top_15_trigrams_overall'
    ]
    paths = collapse_paths if collapse_paths is not None else default_paths
    keys_to_collapse = [p.split('.')[-1] for p in paths]

    # Step 1: pretty-print
    pretty = json.dumps(data, indent=2, ensure_ascii=False)

    # Step 2: collapse selected arrays
    if keys_to_collapse:
        pretty = collapse_arrays_in_str(pretty, keys_to_collapse)

    # Step 3: if download requested, wrap in file response
    if should_download():
        buf = io.BytesIO(pretty.encode('utf-8'))
        resp = send_file(
            buf,
            mimetype='application/json',
            as_attachment=True,
            download_name=filename
        )
        resp.status_code = status_code
        return resp

    # otherwise, inline response
    return Response(pretty, mimetype='application/json', status=status_code)
