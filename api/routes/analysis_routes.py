import json
from flask import Blueprint, request, jsonify
from api.session_manager import session_manager
from api.helpers.response_helpers import make_json_response
from utils import log
from api.analyzer.main_analyzer import ChatAnalyzer
from api.background_task_manager import task_manager

analysis_bp = Blueprint('analysis', __name__)


# --- Reusable Task Function ---
def analyze_messages_with_progress(messages: list, session_id: str, modules_to_run: list = None,
                                   progress_callback: callable = None):
    """
    Performs chat analysis on a given set of messages, with progress reporting
    and support for running specific analysis modules.

    Args:
        messages: A list of message dictionaries to analyze.
        session_id: The ID of the current session.
        modules_to_run: An optional list of specific analysis modules to run.
        progress_callback: A function to report progress (0.0 to 100.0).
    """
    try:
        if progress_callback:
            # We can now pass the callback directly to the analyzer for more granular progress
            analyzer = ChatAnalyzer(messages, input_type='messages', progress_callback=progress_callback)
        else:
            analyzer = ChatAnalyzer(messages, input_type='messages')

        analyzer.load_and_preprocess()

        if analyzer.df.empty:
            raise Exception("Failed to build analysis data - no valid messages found after preprocessing.")

        # Pass the modules_to_run list to the report generator
        report = analyzer.generate_comprehensive_report(modules_to_run=modules_to_run)

        # Store the complete analysis result in the session
        session_manager.store_analysis_result(session_id, report)

        # The task result will contain the full report
        return {
            "analysis_report": report,
            "message": f"Analysis completed successfully for {len(messages)} messages."
        }
    except Exception as e:
        log(f"Error during background analysis for session {session_id}: {str(e)}")
        # Re-raise to ensure the task manager marks it as failed
        raise


@analysis_bp.route('/analyze', methods=['POST'])
def analyze_messages():
    """
    Analyzes filtered messages. Can run specific modules if provided in the
    JSON payload OR as a form field when uploading a file.
    """
    session_id = session_manager.get_session_id()
    raw_messages = None
    modules_to_run = None  # Initialize modules_to_run

    # --- Extract messages and optional modules_to_run list ---
    if request.is_json:
        payload = request.get_json(silent=True) or {}
        raw_messages = payload.get('filtered_messages')
        modules_to_run = payload.get('modules_to_run')  # Get the list of modules
        if modules_to_run:
            log(f"Analysis request for session {session_id} will run specific modules from JSON: {modules_to_run}")

    if 'file' in request.files:
        try:
            f = request.files['file']
            file_data = json.load(f)
            # The JSON file itself should contain a 'filtered_messages' key
            raw_messages = file_data.get('filtered_messages', file_data)

            # Check for modules_to_run in the form data as well
            if 'modules_to_run' in request.form:
                modules_str = request.form['modules_to_run']
                try:
                    # Best practice: send as a JSON-stringified list, e.g., '["mod1", "mod2"]'
                    modules_to_run = json.loads(modules_str)
                    log(f"Found 'modules_to_run' in form data (JSON): {modules_to_run}")
                except json.JSONDecodeError:
                    # Fallback: handle as a simple comma-separated string, e.g., 'mod1,mod2'
                    modules_to_run = [m.strip() for m in modules_str.split(',') if m.strip()]
                    log(f"Found 'modules_to_run' in form data (CSV): {modules_to_run}")

        except Exception as e:
            log(f"Error reading uploaded file for session {session_id}: {str(e)}")
            return make_json_response({"error": "Invalid JSON file"}, status_code=400)

    if not isinstance(raw_messages, list):
        raw_messages = session_manager.get_filtered_messages(session_id)
        if raw_messages:
            log(f"Using stored filtered messages from session {session_id}: {len(raw_messages)} messages")

    if not raw_messages:
        return make_json_response({"error": "No messages to analyze. Please upload and filter first."}, status_code=400)

    messages = [
        {'source': m.get('source', 'unknown'), 'sender': m.get('sender', 'unknown'), 'message': m.get('message', ''),
         'timestamp': m.get('timestamp')} for m in raw_messages if isinstance(m, dict)]

    if not messages:
        return make_json_response({"error": "No valid message objects to analyze."}, status_code=400)

    message_count = len(messages)
    log(f"Starting analysis for session {session_id}: {message_count} messages")

    use_background = (message_count > 1000 or request.args.get('background', '').lower() in ['true', '1', 'yes'])

    # Corrected call in analysis_routes.py
    # In analysis_routes.py

    if use_background:
        # The `messages` and `session_id` arguments for analyze_messages_with_progress
        # are now passed positionally to avoid the name collision.
        task_id = task_manager.submit_task(
            session_id,  # Arg for submit_task
            analyze_messages_with_progress,  # Arg for submit_task (the function to run)
            messages,  # Positional arg for analyze_messages_with_progress
            session_id,  # Positional arg for analyze_messages_with_progress
            modules_to_run=modules_to_run  # Keyword arg for analyze_messages_with_progress
        )
        log(f"Started background analysis task {task_id} for session {session_id}")
        return jsonify({
            "message": f"Analysis of {message_count} messages started in the background.",
            "task_id": task_id,
            "session_id": session_id,
            "status_url": f"/api/analysis/task-status/{task_id}"
        }), 202
    else:
        try:
            result = analyze_messages_with_progress(messages, session_id, modules_to_run=modules_to_run)
            log(f"Synchronous analysis completed for session {session_id}")
            return make_json_response(result, f"{session_id}-analysis.json")
        except Exception as e:
            log(f"Synchronous analysis error for session {session_id}: {str(e)}")
            return make_json_response({"error": "Analysis failed internally.", "details": str(e)}, status_code=500)


@analysis_bp.route('/task-status/<task_id>', methods=['GET'])
def get_analysis_status(task_id):
    """
    Get the status and result of a background analysis task.
    When the task is 'completed', the response will contain the full analysis report.
    """
    status = task_manager.get_task_status(task_id)

    if not status:
        return jsonify({"error": "Analysis task not found"}), 404

    # If the task is completed successfully, the full result is already in the 'result' field.
    if status.get('status') == 'completed':
        return make_json_response({
            "task_info": status,
            "result": status.get('result')  # The report is here
        }, filename=f"analysis-task-{task_id}.json")

    return jsonify(status)


# --- Other Utility Routes (Unchanged but retained for completeness) ---

@analysis_bp.route('/can-analyze', methods=['GET'])
def can_analyze():
    """Check if the current session has messages ready for analysis."""
    session_id = session_manager.get_session_id()
    filtered_messages = session_manager.get_filtered_messages(session_id)
    if filtered_messages:
        return jsonify({"can_analyze": True, "message_count": len(filtered_messages), "message_type": "filtered"})
    processed_messages = session_manager.get_processed_messages(session_id)
    if processed_messages:
        return jsonify({"can_analyze": True, "message_count": len(processed_messages), "message_type": "processed",
                        "recommendation": "Consider filtering first."})
    return jsonify({"can_analyze": False, "message": "No messages available for analysis."})


@analysis_bp.route('/analyze-background', methods=['POST'])
def analyze_messages_background_force():
    """Force background analysis regardless of message count."""
    request.args = request.args.copy()
    request.args['background'] = 'true'
    return analyze_messages()


@analysis_bp.route('/count_keyword', methods=['POST'])
def count_keyword():
    """Count keyword occurrences in messages by sender"""
    session_id = session_manager.get_session_id()
    data = request.get_json(silent=True) or {}
    keyword = data.get('keyword')
    messages = data.get('messages') or session_manager.get_filtered_messages(session_id)

    if not keyword or not isinstance(messages, list):
        return make_json_response({"error": "Provide 'keyword' and ensure messages are available."}, status_code=400)

    # This logic can also be moved to a background task for very large datasets
    counts = {}
    kl = keyword.lower()
    for msg in messages:
        text = msg.get('message', '')
        if kl in text.lower():
            sender = msg.get('sender', 'Unknown')
            counts[sender] = counts.get(sender, 0) + 1

    result = {"keyword": keyword, "total_matches": sum(counts.values()), "counts_by_sender": counts}
    return make_json_response(result, f"{session_id}-count.json")


@analysis_bp.route('/session-tasks', methods=['GET'])
def get_session_tasks():
    """Get all tasks for the current session"""
    session_id = session_manager.get_session_id()
    tasks = task_manager.get_session_tasks(session_id)
    return jsonify({"session_id": session_id, "tasks": tasks})


@analysis_bp.route('/cancel-task/<task_id>', methods=['POST'])
def cancel_task(task_id):
    """Cancel a pending task"""
    success = task_manager.cancel_task(task_id)
    if success:
        return jsonify({"message": "Task cancelled successfully."})
    else:
        return jsonify({"error": "Task not found or cannot be cancelled."}), 400
