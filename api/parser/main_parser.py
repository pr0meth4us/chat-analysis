import hashlib
import json
from datetime import datetime
from bs4 import BeautifulSoup
from utils import log
from config import Config
from .date_parser import parse_datetime_comprehensive
from .html_parser import (
    extract_json_from_html, extract_telegram, extract_facebook,
    extract_instagram, extract_imessage, extract_discord_html
)
from .json_parser import parse_generic_json


def process_uploaded_files(files):
    """
    Processes a list of uploaded files, extracts messages, standardizes them,
    and removes duplicates.
    """
    compiled = []
    total_files = len(files)
    processed_files = 0

    for file in files:
        processed_files += 1
        log(f"Processing file {processed_files}/{total_files}")
        msgs = []
        try:
            content = file.read().decode('utf-8')
            file.seek(0)  # Reset file pointer after reading

            if file.filename.lower().endswith('.json'):
                data = json.loads(content)
                msgs = parse_generic_json(data)
            elif file.filename.lower().endswith('.html'):
                soup = BeautifulSoup(content, 'html.parser')
                msgs += extract_json_from_html(soup)
                msgs += extract_telegram(soup)
                msgs += extract_facebook(soup)
                msgs += extract_instagram(soup)
                msgs += extract_imessage(soup)
                msgs += extract_discord_html(soup)

            log(f"  → Extracted {len(msgs)} messages from {file.filename}")
            compiled.extend(msgs)
        except Exception as e:
            log(f"  [ERROR] Processing {file.filename}: {e}")
            continue

    # Deduplication and Standardization
    seen_hashes = set()
    unique_messages = []
    for msg in compiled:
        content_hash = hashlib.md5(
            f"{msg.get('timestamp', '')}{msg.get('sender', '')}{msg.get('message', '')}".encode()).hexdigest()
        if content_hash not in seen_hashes:
            seen_hashes.add(content_hash)
            unique_messages.append(msg)

    log(f"Removed {len(compiled) - len(unique_messages)} duplicate messages")

    standardized = []
    for msg in unique_messages:
        dt = parse_datetime_comprehensive(msg.get('timestamp', ''))
        if dt:
            msg['timestamp'] = dt.strftime(Config.TARGET_FORMAT)
            standardized.append(msg)

    def sort_key(msg):
        try:
            return datetime.strptime(msg.get('timestamp'), Config.TARGET_FORMAT)
        except (ValueError, TypeError):
            return datetime.min

    standardized.sort(key=sort_key)
    log("Messages sorted by timestamp")
    return standardized
