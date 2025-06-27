from .analyzer.chat_analyzer import ChatAnalyzer
import os
from zipfile import ZipFile, is_zipfile
from .session_manager import session_manager
from .parsers.main_parser import (
    process_single_file,
    deduplicate_and_sort_messages
)
from .utils import log


def process_file_worker(session_id: str, temp_file_paths: list[str], progress_callback: callable = None):
    """
    Processes uploaded files, including extracting from ZIP archives, in a memory-efficient way.
    It processes files one-by-one, deduplicates messages on-the-fly, and ignores irrelevant file types.
    """
    all_messages = []
    seen_hashes = set()
    archives_to_close = []

    def update_progress(progress, stage, message=""):
        if progress_callback:
            try:
                full_stage = f"{stage} - {message}" if message else stage
                progress_callback(progress=progress, stage=full_stage)
            except Exception as e:
                log(f"Progress callback error: {e}")

    try:
        log(f"Worker starting for {len(temp_file_paths)} path(s).")
        update_progress(5, "Initializing file processing")

        file_metadata_list = []
        valid_extensions = ('.json', '.html', '.htm')

        # --- Step 1: Discover all valid files to get a total count for progress reporting ---
        for temp_file_path in temp_file_paths:
            if is_zipfile(temp_file_path):
                try:
                    archive = ZipFile(temp_file_path, 'r')
                    archives_to_close.append(archive) # Ensure it gets closed later

                    # Filter for valid files and ignore directories/junk
                    namelist = [
                        m for m in archive.namelist()
                        if not m.endswith('/')
                           and not m.startswith('__MACOSX/')
                           and m.lower().endswith(valid_extensions)
                    ]

                    for member_name in namelist:
                        file_metadata_list.append({'type': 'zip', 'zip_path': temp_file_path, 'member_name': member_name})
                except Exception as e:
                    log(f" [WARNING] Could not read ZIP file {temp_file_path}. Skipping. Error: {e}")
            elif temp_file_path.lower().endswith(valid_extensions):
                file_metadata_list.append({'type': 'single', 'path': temp_file_path})
            else:
                log(f" [INFO] Ignoring non-supported file: {os.path.basename(temp_file_path)}")


        total_files_to_process = len(file_metadata_list)
        if not total_files_to_process:
            raise ValueError("No processable files (.json, .html, .htm) were found in the upload(s).")

        log(f"Found {total_files_to_process} valid files to process.")

        # --- Step 2: Process valid files one by one ---
        for i, file_meta in enumerate(file_metadata_list):
            current_progress = 10 + (i / total_files_to_process) * 65 # Progress from 10% to 75%

            file_to_process = None
            filename_for_log = ""

            try:
                if file_meta['type'] == 'zip':
                    # Find the correct archive object to open the member
                    archive_obj = next((arc for arc in archives_to_close if arc.filename == file_meta['zip_path']), None)
                    if archive_obj:
                        file_to_process = archive_obj.open(file_meta['member_name'])
                        filename_for_log = file_meta['member_name']
                else:
                    file_to_process = open(file_meta['path'], 'rb')
                    filename_for_log = os.path.basename(file_meta['path'])

                if not file_to_process:
                    log(f" [WARNING] Could not open file for metadata: {file_meta}. Skipping.")
                    continue

                setattr(file_to_process, 'filename', filename_for_log)
                log(f"Processing ({i+1}/{total_files_to_process}): {filename_for_log}")
                update_progress(current_progress, "Parsing files", f"{i+1}/{total_files_to_process}")

                # This function now reads, parses, and deduplicates a SINGLE file on the fly
                newly_found_messages = process_single_file(file_to_process, seen_hashes)
                all_messages.extend(newly_found_messages)

            finally:
                if file_to_process:
                    file_to_process.close()

        # --- Step 3: Finalize the collected unique messages ---
        update_progress(75, "Finalizing and sorting")
        processed_messages = deduplicate_and_sort_messages(all_messages)

        update_progress(98, "Storing results in session")
        session_manager.store_processed_messages(session_id, processed_messages)
        update_progress(100, "File processing completed")

        return {
            "message": f"Successfully processed {len(processed_messages)} messages from {total_files_to_process} source file(s).",
            "unique_senders": sorted({m.get('sender') for m in processed_messages if m.get('sender')})
        }
    except Exception as e:
        log(f"ERROR in file processing worker for session {session_id}: {str(e)}")
        raise # Re-raise exception to be caught by the task manager
    finally:
        # --- Final Cleanup ---
        for archive in archives_to_close:
            try:
                archive.close()
            except:
                pass
        for temp_file_path in temp_file_paths:
            if os.path.exists(temp_file_path):
                try:
                    os.remove(temp_file_path)
                    log(f"Cleaned up temporary file: {temp_file_path}")
                except Exception as e:
                    log(f"Error cleaning up temp file {temp_file_path}: {e}")



def run_analysis_worker(session_id: str, modules_to_run: list = None,
                        progress_callback: callable = None):
    def update_progress(progress, stage):
        if progress_callback:
            try:
                progress_callback(progress=progress, stage=stage)
            except Exception as e:
                log(f"Progress callback error: {e}")

    try:
        update_progress(5, "Initializing analyzer")
        filtered_data = session_manager.get_filtered_messages(session_id)
        if not filtered_data: raise ValueError("No filtered messages found. Please run filtering first.")

        filtered_messages = filtered_data.get('messages', [])
        metadata = filtered_data.get('metadata', {})
        filter_settings = filtered_data.get('filter_settings', {})
        participants = list(metadata.get('participants', {}).keys())

        if not filtered_messages: raise ValueError("No messages found in filtered data.")

        log(f"Found {len(participants)} participants: {participants}")

        def analyzer_progress_callback(progress_percent=None, step_name=None, **kwargs):
            if progress_percent is not None:
                mapped_progress = 10 + (progress_percent * 0.85)
                stage = step_name or "Running analysis"
                update_progress(mapped_progress, stage)

        analyzer = ChatAnalyzer(
            file_path_or_messages=filtered_messages, input_type='messages',
            progress_callback=analyzer_progress_callback, participants=participants,
            metadata=metadata, filter_settings=filter_settings
        )
        update_progress(10, "Loading and preprocessing data")
        analyzer.load_and_preprocess()

        update_progress(15, "Running comprehensive analysis")
        report = analyzer.generate_comprehensive_report(modules_to_run=modules_to_run)

        update_progress(98, "Storing analysis results")
        session_manager.store_analysis_result(session_id, report)
        update_progress(100, "Analysis completed")

        return {"message": "Analysis completed successfully!"}

    except Exception as e:
        log(f"ERROR during analysis worker for session {session_id}: {str(e)}")
        raise
