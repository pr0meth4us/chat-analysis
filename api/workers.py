import os
from zipfile import ZipFile, is_zipfile
from api.session_manager import session_manager
from parser.main_parser import process_uploaded_files
from api.analyzer.main_analyzer import ChatAnalyzer
from utils import log


def process_file_worker(session_id: str, temp_file_path: str, progress_callback: callable = None):
    """Process uploaded files with simplified progress reporting."""
    file_objs = []
    archive = None

    def update_progress(progress, stage):
        """Helper to safely update progress."""
        if progress_callback:
            try:
                progress_callback(progress=progress, stage=stage)
            except Exception as e:
                log(f"Progress callback error: {e}")

    try:
        log(f"Worker starting for file: {temp_file_path}")
        update_progress(5, "Initializing file processing")

        if is_zipfile(temp_file_path):
            archive = ZipFile(temp_file_path, 'r')
            namelist = [m for m in archive.namelist() if not m.endswith('/') and not m.startswith('__MACOSX/')]
            log(f"Detected ZIP file with {len(namelist)} members.")
            update_progress(15, "Extracting files from archive")

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
            raise ValueError("No processable files were found.")

        update_progress(5, "Processing files")

        # Create a progress mapper for the file processing
        def file_progress_callback(progress_percent=None, stage=None, message=None, **kwargs):
            # Handle the different parameter names from process_uploaded_files
            if progress_percent is not None:
                # Direct mapping: parser's progress matches worker's progress
                display_stage = stage or "Processing files"
                if message:
                    display_stage = f"{display_stage} - {message}"
                update_progress(progress_percent, display_stage)

        processed_messages = process_uploaded_files(
            file_objs,
            progress_callback=file_progress_callback
        )

        update_progress(98, "Storing results")
        session_manager.store_processed_messages(session_id, processed_messages)

        update_progress(100, "File processing completed")

        return {
            "message": f"Successfully processed {len(processed_messages)} messages.",
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
        if archive:
            archive.close()
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)
            log(f"Cleaned up temporary file: {temp_file_path}")


def run_analysis_worker(messages: list, session_id: str, modules_to_run: list = None,
                        progress_callback: callable = None):
    """Worker function to run the main ChatAnalyzer with simplified progress reporting."""

    def update_progress(progress, stage):
        """Helper to safely update progress."""
        if progress_callback:
            try:
                progress_callback(progress=progress, stage=stage)
            except Exception as e:
                log(f"Progress callback error: {e}")

    try:
        update_progress(5, "Initializing analyzer")

        # Create a progress mapper for the analyzer
        def analyzer_progress_callback(progress_percent=None, step_name=None, **kwargs):
            # Map the analyzer's progress to our range (10-95%)
            if progress_percent is not None:
                mapped_progress = 10 + (progress_percent * 0.85)  # Scale to 85% of remaining
                stage = step_name or "Running analysis"
                update_progress(mapped_progress, stage)

        analyzer = ChatAnalyzer(
            file_path_or_messages=messages,
            input_type='messages',
            progress_callback=analyzer_progress_callback
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