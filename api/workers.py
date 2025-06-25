import os
from zipfile import ZipFile, is_zipfile
from api.session_manager import session_manager
from api.parser.main_parser import process_uploaded_files
from api.analyzer.chat_analyzer import ChatAnalyzer
from utils import log


def process_file_worker(session_id: str, temp_file_paths: list[str], progress_callback: callable = None):
    file_objs = []
    archives_to_close = []

    def update_progress(progress, stage):
        if progress_callback:
            try:
                progress_callback(progress=progress, stage=stage)
            except Exception as e:
                log(f"Progress callback error: {e}")

    try:
        log(f"Worker starting for {len(temp_file_paths)} path(s).")
        update_progress(5, "Initializing file processing")

        for temp_file_path in temp_file_paths:
            log(f"Processing path: {temp_file_path}")
            if is_zipfile(temp_file_path):
                archive = ZipFile(temp_file_path, 'r')
                archives_to_close.append(archive)
                namelist = [m for m in archive.namelist() if not m.endswith('/') and not m.startswith('__MACOSX/')]
                log(f"Detected ZIP file with {len(namelist)} members.")
                update_progress(15, f"Extracting from {os.path.basename(temp_file_path)}")

                for member_name in namelist:
                    f = archive.open(member_name)
                    setattr(f, 'filename', member_name)
                    file_objs.append(f)
            else:
                log("Detected single file.")
                f = open(temp_file_path, 'rb')
                setattr(f, 'filename', os.path.basename(temp_file_path))
                file_objs.append(f)

        if not file_objs:
            raise ValueError("No processable files were found in the upload(s).")

        update_progress(25, "Parsing and consolidating files")

        def file_progress_callback(progress_percent=None, stage=None, message=None, **kwargs):
            if progress_percent is not None:
                mapped_progress = 25 + (progress_percent * 0.70)
                display_stage = stage or "Processing files"
                if message:
                    display_stage = f"{display_stage} - {message}"
                update_progress(mapped_progress, display_stage)

        processed_messages = process_uploaded_files(
            file_objs,
            progress_callback=file_progress_callback
        )

        update_progress(98, "Storing results")
        # Only store messages, no separate participants
        session_manager.store_processed_messages(session_id, processed_messages)

        update_progress(100, "File processing completed")

        return {
            "message": f"Successfully processed {len(processed_messages)} messages from {len(file_objs)} source file(s).",
            "unique_senders": sorted({m.get('sender') for m in processed_messages if m.get('sender')})
        }

    except Exception as e:
        log(f"ERROR in file processing worker for session {session_id}: {str(e)}")
        raise
    finally:
        for f in file_objs:
            try:
                f.close()
            except:
                pass
        for archive in archives_to_close:
            archive.close()

        for temp_file_path in temp_file_paths:
            if os.path.exists(temp_file_path):
                try:
                    os.remove(temp_file_path)
                    log(f"Cleaned up temporary file: {temp_file_path}")
                except Exception as e:
                    log(f"Error cleaning up temp file {temp_file_path}: {e}")


def run_analysis_worker(session_id: str, modules_to_run: list = None,
                        progress_callback: callable = None):
    """Worker function to run the main ChatAnalyzer with filtered data only."""

    def update_progress(progress, stage):
        """Helper to safely update progress."""
        if progress_callback:
            try:
                progress_callback(progress=progress, stage=stage)
            except Exception as e:
                log(f"Progress callback error: {e}")

    try:
        update_progress(5, "Initializing analyzer")

        filtered_data = session_manager.get_filtered_messages(session_id)
        if not filtered_data:
            raise ValueError("No filtered messages found. Please run filtering first.")

        filtered_messages = filtered_data.get('messages', [])

        # --- FIX START ---
        # The participant data is nested inside the 'metadata' object.
        metadata = filtered_data.get('metadata', {})
        metadata = filtered_data.get('metadata', {})
        filter_settings = filtered_data.get('filter_settings', {})
        participants = list(metadata.get('participants', {}).keys())



        if not filtered_messages:
            raise ValueError("No messages found in filtered data.")

        log(f"Found {len(participants)} participants: {participants}")

        def analyzer_progress_callback(progress_percent=None, step_name=None, **kwargs):
            if progress_percent is not None:
                mapped_progress = 10 + (progress_percent * 0.85)
                stage = step_name or "Running analysis"
                update_progress(mapped_progress, stage)

        analyzer = ChatAnalyzer(
            file_path_or_messages=filtered_messages,
            input_type='messages',
            progress_callback=analyzer_progress_callback,
            participants=participants,
            metadata=metadata,
            filter_settings=filter_settings
        )
        update_progress(10, "Loading and preprocessing data")
        analyzer.load_and_preprocess()

        update_progress(15, "Running comprehensive analysis")
        report = analyzer.generate_comprehensive_report(modules_to_run=modules_to_run)

        update_progress(98, "Storing analysis results")
        session_manager.store_analysis_result(session_id, report)

        update_progress(100, "Analysis completed")

        return {"analysis_report": report, "message": "Analysis complete!"}

    except Exception as e:
        log(f"ERROR during analysis worker for session {session_id}: {str(e)}")
        raise