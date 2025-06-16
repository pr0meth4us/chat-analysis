import hashlib
import json
from datetime import datetime
from bs4 import BeautifulSoup
from api.utils import log
from api.config import Config
from .date_parser import parse_datetime_comprehensive
from .html_parser import (
    extract_json_from_html, extract_telegram, extract_facebook,
    extract_instagram, extract_imessage, extract_discord_html
)
from .json_parser import parse_generic_json


def process_uploaded_files(files, progress_callback=None):
    """
    Processes a list of uploaded files, extracts messages, standardizes them,
    and removes duplicates. Now supports progress reporting.
    """
    compiled = []
    total_files = len(files)
    processed_files = 0

    for file in files:
        processed_files += 1
        if progress_callback:
            # Reserve 0-70% for file processing
            progress = (processed_files / total_files) * 70
            progress_callback(progress)

        log(f"Processing file {processed_files}/{total_files}: {file.filename}")
        msgs = []
        try:
            content = file.read().decode('utf-8')
            file.seek(0)  # Reset file pointer after reading

            if file.filename.lower().endswith('.json'):
                data = json.loads(content)
                msgs = parse_generic_json(data)
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
        except UnicodeDecodeError:
            log(f" [ERROR] Failed to decode {file.filename}. Skipping.")
            continue
        except json.JSONDecodeError:
            log(f" [ERROR] Invalid JSON in {file.filename}. Skipping.")
            continue
        except Exception as e:
            log(f" [ERROR] Processing {file.filename}: {e}")
            continue

    if progress_callback:
        progress_callback(75)

    # Deduplication and Standardization
    seen_hashes = set()
    unique_messages = []
    for i, msg in enumerate(compiled):
        if progress_callback and i % 1000 == 0:
            # Progress 75-85% for deduplication
            progress = 75 + (i / len(compiled)) * 10
            progress_callback(progress)

        message_content = str(msg.get('message', ''))
        content_hash = hashlib.md5(
            f"{msg.get('timestamp', '')}{msg.get('sender', '')}{message_content}".encode('utf-8')).hexdigest()
        if content_hash not in seen_hashes:
            seen_hashes.add(content_hash)
            unique_messages.append(msg)

    log(f"Removed {len(compiled) - len(unique_messages)} duplicate messages")

    if progress_callback:
        progress_callback(85)

    standardized = []
    for i, msg in enumerate(unique_messages):
        if progress_callback and i % 1000 == 0:
            # Progress 85-95% for standardization
            progress = 85 + (i / len(unique_messages)) * 10
            progress_callback(progress)

        dt = parse_datetime_comprehensive(msg.get('timestamp', ''))
        if dt:
            msg['timestamp'] = dt.strftime(Config.TARGET_FORMAT)
            standardized.append(msg)
        else:
            log(f" [WARNING] Could not parse timestamp for message: {msg.get('timestamp')} - Skipping message")

    def sort_key(msg):
        try:
            return datetime.strptime(msg.get('timestamp'), Config.TARGET_FORMAT)
        except (ValueError, TypeError):
            return datetime.min

    if progress_callback:
        progress_callback(95)

    standardized.sort(key=sort_key)
    log("Messages sorted by timestamp")

    return standardized