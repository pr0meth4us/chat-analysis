import hashlib
import json
from datetime import datetime
from bs4 import BeautifulSoup
from ..utils import log
from ..config import Config
from .date_parser import parse_datetime_comprehensive
from .html_parser import (
    extract_json_from_html, extract_telegram, extract_facebook,
    extract_instagram, extract_imessage, extract_discord_html
)
from .json_parser import parse_generic_json


def process_uploaded_files(files, progress_callback=None):
    compiled = []
    total_files = len(files)

    for i, file in enumerate(files):
        log(f"Processing file {i+1}/{total_files}: {file.filename}")

        if progress_callback:
            progress = 5 + ((i + 1) / total_files) * 65
            progress_callback(
                progress_percent=progress,
                stage="Parsing files...",
                message=f"{i+1} / {total_files} files parsed"
            )

        msgs = []
        try:
            content = file.read().decode('utf-8')
            file.seek(0)

            if file.filename.lower().endswith('.json'):
                msgs = parse_generic_json(json.loads(content))
            elif file.filename.lower().endswith('.html'):
                soup = BeautifulSoup(content, 'lxml')
                msgs += extract_json_from_html(soup)
                msgs += extract_telegram(soup)
                msgs += extract_facebook(soup)
                msgs += extract_instagram(soup)
                msgs += extract_imessage(soup)
                msgs += extract_discord_html(soup)

            log(f" → Extracted {len(msgs)} messages from {file.filename}")
            compiled.extend(msgs)
        except Exception as e:
            log(f" [ERROR] Could not process {file.filename}: {e}")
            continue

    # Stage 2: Deduplication (Progress: 70% -> 85%)
    if progress_callback:
        progress_callback(progress_percent=70, stage="Deduplicating messages...")

    seen_hashes = set()
    unique_messages = []
    total_compiled = len(compiled)
    for i, msg in enumerate(compiled):
        message_content = str(msg.get('message', ''))
        content_hash = hashlib.md5(f"{msg.get('timestamp', '')}{msg.get('sender', '')}{message_content}".encode('utf-8')).hexdigest()
        if content_hash not in seen_hashes:
            seen_hashes.add(content_hash)
            unique_messages.append(msg)

    log(f"Deduplication complete. Removed {len(compiled) - len(unique_messages)} duplicates (Original: {len(compiled)}, New: {len(unique_messages)}).")

    if progress_callback:
        progress_callback(progress_percent=85, stage="Standardizing timestamps...")

    standardized = []
    total_unique = len(unique_messages)
    for msg in unique_messages:
        dt = parse_datetime_comprehensive(msg.get('timestamp', ''))
        if dt:
            msg['timestamp'] = dt.strftime(Config.TARGET_FORMAT)
            standardized.append(msg)
        else:
            log(f" [WARNING] Could not parse timestamp: {msg.get('timestamp')} - Skipping")

    if progress_callback:
        progress_callback(progress_percent=95, stage="Sorting messages...")

    def sort_key(msg):
        try:
            return datetime.strptime(msg.get('timestamp'), Config.TARGET_FORMAT)
        except (ValueError, TypeError):
            return datetime.min

    standardized.sort(key=sort_key)
    log("Messages sorted by timestamp")

    if progress_callback:
        progress_callback(progress_percent=98, stage="Finalizing...")

    return standardized
