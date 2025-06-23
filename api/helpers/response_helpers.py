import io
import re
import json
from flask import request, send_file, Response

def should_download() -> bool:
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
    default_paths = [
        'analysis_report.word_analysis.top_50_meaningful_words_overall',
        'analysis_report.word_analysis.top_20_bigrams_overall',
        'analysis_report.word_analysis.top_15_trigrams_overall'
    ]
    paths = collapse_paths if collapse_paths is not None else default_paths
    keys_to_collapse = [p.split('.')[-1] for p in paths]

    pretty = json.dumps(data, indent=2, ensure_ascii=False)

    if keys_to_collapse:
        pretty = collapse_arrays_in_str(pretty, keys_to_collapse)

    if should_download():
        buf = io.BytesIO(pretty.encode('utf-8'))
        resp = send_file(
            buf,
            mimetype='application/json',
            as_attachment=True,
            download_name=filename
        )
        resp.status_code = status_code
    else:

        resp = Response(pretty, mimetype='application/json', status=status_code)

    resp.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    resp.headers['Pragma'] = 'no-cache'
    resp.headers['Expires'] = '0'

    return resp