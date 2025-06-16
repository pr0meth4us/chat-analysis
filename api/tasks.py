# api/tasks.py

from celery import shared_task
from api.session_manager import session_manager
import traceback

@shared_task(name="tasks.process_zip_bytes")
def process_zip_bytes(zip_bytes, session_id):
    try:
        from zipfile import ZipFile
        from io import BytesIO
        import os
        from api.parser.main_parser import process_uploaded_files

        archive = ZipFile(BytesIO(zip_bytes))

        file_objs = []
        for member in archive.infolist():
            if member.is_dir():
                continue
            base = os.path.basename(member.filename)
            if member.filename.startswith('__MACOSX/') or base.startswith('._'):
                continue
            try:
                f = archive.open(member)
                f.filename = member.filename
                file_objs.append(f)
            except Exception:
                continue

        if not file_objs:
            return {"error": "No valid files in ZIP"}

        processed = process_uploaded_files(file_objs)

        # Store processed messages to disk using session ID
        session_manager.store_processed_messages(session_id, processed)

        return {
            "message": f"Processed {len(processed)} messages from ZIP.",
            "session_id": session_id,
            "unique_senders": sorted({m.get('sender') for m in processed if m.get('sender')}),
            "count": len(processed)
        }

    except Exception as e:
        return {
            "error": str(e),
            "traceback": traceback.format_exc()
        }
