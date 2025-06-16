"""
Background Workers - Contains the core logic for long-running tasks.
These functions are submitted to the BackgroundTaskManager.
"""
import os
from zipfile import ZipFile, is_zipfile
from api.session_manager import session_manager
from parser.main_parser import process_uploaded_files
from api.analyzer.main_analyzer import ChatAnalyzer
from utils import log

def process_file_worker(session_id: str, temp_file_path: str, progress_callback: callable = None):
    """
    A single worker that smartly handles either a ZIP file or a single chat file.
    """
    file_objs = []
    archive = None
    try:
        log(f"Worker starting for file: {temp_file_path}")
        if progress_callback:
            progress_callback(progress_percent=5.0, stage="Initializing...")

        # Check if the file is a ZIP archive
        if is_zipfile(temp_file_path):
            archive = ZipFile(temp_file_path, 'r')
            namelist = [m for m in archive.namelist() if not m.endswith('/') and not m.startswith('__MACOSX/')]
            log(f"Detected ZIP file with {len(namelist)} members.")

            for i, member_name in enumerate(namelist):
                if progress_callback:
                    percent = 10.0 + (80.0 * (i + 1) / len(namelist))
                    progress_callback(progress_percent=percent, stage=f"Extracting: {os.path.basename(member_name)}")

                f = archive.open(member_name)
                setattr(f, 'filename', member_name)
                file_objs.append(f)
        else:
            # It's a single file
            log("Detected single file.")
            if progress_callback: progress_callback(progress_percent=10.0, stage="Opening file...")
            f = open(temp_file_path, 'rb') # Open in binary mode for parsers
            setattr(f, 'filename', os.path.basename(temp_file_path))
            file_objs.append(f)

        if not file_objs:
            raise ValueError("No processable files were found.")

        # Pass the file objects to the core parser
        processed_messages = process_uploaded_files(file_objs)
        session_manager.store_processed_messages(session_id, processed_messages)

        if progress_callback: progress_callback(progress_percent=100.0, stage="Completed")

        return {
            "message": f"Successfully processed {len(processed_messages)} messages.",
            "unique_senders": sorted({m.get('sender') for m in processed_messages if m.get('sender')})
        }

    except Exception as e:
        log(f"ERROR in file processing worker for session {session_id}: {str(e)}")
        raise
    finally:
        # Ensure all opened file resources are closed
        for f in file_objs:
            try: f.close()
            except: pass
        if archive:
            archive.close()

        # Clean up the temporary file from disk
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)
            log(f"Cleaned up temporary file: {temp_file_path}")

def run_analysis_worker(messages: list, session_id: str, modules_to_run: list = None, progress_callback: callable = None):
    """Worker function to run the main ChatAnalyzer."""
    try:
        analyzer = ChatAnalyzer(
            file_path_or_messages=messages,
            input_type='messages',
            progress_callback=progress_callback
        )
        analyzer.load_and_preprocess()
        report = analyzer.generate_comprehensive_report(modules_to_run=modules_to_run)

        session_manager.store_analysis_result(session_id, report)

        return {"analysis_report": report}
    except Exception as e:
        log(f"ERROR during analysis worker for session {session_id}: {str(e)}")
        raise