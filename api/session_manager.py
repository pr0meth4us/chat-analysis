import uuid
import json
import os
from flask import session
from threading import Lock
from datetime import datetime, timedelta


class SessionManager:
    def __init__(self, storage_dir='session_data'):
        self.storage_dir = storage_dir
        self.processed_messages_store = {}
        self.filtered_messages_store = {}
        self.processing_status_store = {}
        self.analysis_status_store = {}
        self.analysis_result_store = {}
        self.lock = Lock()

        # Ensure storage directory exists
        os.makedirs(storage_dir, exist_ok=True)

        # Clean up old sessions on startup
        self._cleanup_old_sessions()

    def get_session_id(self):
        """Get or create session ID"""
        if 'session_id' not in session:
            session['session_id'] = str(uuid.uuid4())
        return session['session_id']

    def _get_file_path(self, session_id, data_type):
        """Get file path for session data"""
        return os.path.join(self.storage_dir, f"{session_id}_{data_type}.json")

    def store_processed_messages(self, session_id, messages):
        """Store processed messages for a session"""
        with self.lock:
            # Store in memory for quick access
            self.processed_messages_store[session_id] = messages

            # Also store to file for persistence
            file_path = self._get_file_path(session_id, 'processed')
            try:
                with open(file_path, 'w', encoding='utf-8') as f:
                    json.dump({
                        'messages': messages,
                        'timestamp': datetime.now().isoformat(),
                        'count': len(messages)
                    }, f, ensure_ascii=False, indent=2)
            except Exception as e:
                print(f"Error saving processed messages to file: {e}")

    def get_processed_messages(self, session_id):
        """Retrieve processed messages for a session"""
        # Try memory first
        if session_id in self.processed_messages_store:
            return self.processed_messages_store[session_id]

        # Try loading from file
        file_path = self._get_file_path(session_id, 'processed')
        if os.path.exists(file_path):
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    messages = data.get('messages', [])
                    # Cache in memory
                    self.processed_messages_store[session_id] = messages
                    return messages
            except Exception as e:
                print(f"Error loading processed messages from file: {e}")

    def store_analysis_status(self, session_id, status):
        """Store analysis status for a session"""
        with self.lock:
            self.analysis_status_store[session_id] = status

            # Also store to file
            file_path = self._get_file_path(session_id, 'analysis_status')
            try:
                with open(file_path, 'w', encoding='utf-8') as f:
                    json.dump(status, f, ensure_ascii=False, indent=2)
            except Exception as e:
                print(f"Error saving analysis status to file: {e}")

    def get_analysis_status(self, session_id):
        """Retrieve analysis status for a session"""
        # Try memory first
        if session_id in self.analysis_status_store:
            return self.analysis_status_store[session_id]

        # Try loading from file
        file_path = self._get_file_path(session_id, 'analysis_status')
        if os.path.exists(file_path):
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    status = json.load(f)
                    # Cache in memory
                    self.analysis_status_store[session_id] = status
                    return status
            except Exception as e:
                print(f"Error loading analysis status from file: {e}")

        return None

    def store_analysis_result(self, session_id, result):
        """Store analysis result for a session"""
        with self.lock:
            self.analysis_result_store[session_id] = result

            # Also store to file
            file_path = self._get_file_path(session_id, 'analysis_result')
            try:
                with open(file_path, 'w', encoding='utf-8') as f:
                    json.dump({
                        'result': result,
                        'timestamp': datetime.now().isoformat()
                    }, f, ensure_ascii=False, indent=2)
            except Exception as e:
                print(f"Error saving analysis result to file: {e}")

    def get_analysis_result(self, session_id):
        """Retrieve analysis result for a session"""
        # Try memory first
        if session_id in self.analysis_result_store:
            return self.analysis_result_store[session_id]

        # Try loading from file
        file_path = self._get_file_path(session_id, 'analysis_result')
        if os.path.exists(file_path):
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    result = data.get('result')
                    # Cache in memory
                    if result:
                        self.analysis_result_store[session_id] = result
                    return result
            except Exception as e:
                print(f"Error loading analysis result from file: {e}")

        return None

    def store_filtered_messages(self, session_id, messages):
        """Store filtered messages for a session"""
        with self.lock:
            # Store in memory for quick access
            self.filtered_messages_store[session_id] = messages

            # Also store to file for persistence
            file_path = self._get_file_path(session_id, 'filtered')
            try:
                with open(file_path, 'w', encoding='utf-8') as f:
                    json.dump({
                        'messages': messages,
                        'timestamp': datetime.now().isoformat(),
                        'count': len(messages)
                    }, f, ensure_ascii=False, indent=2)
            except Exception as e:
                print(f"Error saving filtered messages to file: {e}")

    def get_filtered_messages(self, session_id):
        """Retrieve filtered messages for a session"""
        # Try memory first
        if session_id in self.filtered_messages_store:
            return self.filtered_messages_store[session_id]

        # Try loading from file
        file_path = self._get_file_path(session_id, 'filtered')
        if os.path.exists(file_path):
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    messages = data.get('messages', [])
                    # Cache in memory
                    self.filtered_messages_store[session_id] = messages
                    return messages
            except Exception as e:
                print(f"Error loading filtered messages from file: {e}")

        return None

    def store_processing_status(self, session_id, status):
        """Store processing status for a session"""
        with self.lock:
            self.processing_status_store[session_id] = status

            # Also store to file
            file_path = self._get_file_path(session_id, 'status')
            try:
                with open(file_path, 'w', encoding='utf-8') as f:
                    json.dump(status, f, ensure_ascii=False, indent=2)
            except Exception as e:
                print(f"Error saving processing status to file: {e}")

    def get_processing_status(self, session_id):
        """Retrieve processing status for a session"""
        # Try memory first
        if session_id in self.processing_status_store:
            return self.processing_status_store[session_id]

        # Try loading from file
        file_path = self._get_file_path(session_id, 'status')
        if os.path.exists(file_path):
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    status = json.load(f)
                    # Cache in memory
                    self.processing_status_store[session_id] = status
                    return status
            except Exception as e:
                print(f"Error loading processing status from file: {e}")

        return None

    def clear_session_data(self, session_id):
        """Clear all data for a session"""
        with self.lock:
            # Clear from memory
            self.processed_messages_store.pop(session_id, None)
            self.filtered_messages_store.pop(session_id, None)
            self.processing_status_store.pop(session_id, None)
            self.analysis_status_store.pop(session_id, None)
            self.analysis_result_store.pop(session_id, None)

            # Clear files
            for data_type in ['processed', 'filtered', 'status', 'analysis_status', 'analysis_result']:
                file_path = self._get_file_path(session_id, data_type)
                try:
                    if os.path.exists(file_path):
                        os.remove(file_path)
                except Exception as e:
                    print(f"Error removing file {file_path}: {e}")

    def _cleanup_old_sessions(self, max_age_days=7):
        """Clean up old session files"""
        if not os.path.exists(self.storage_dir):
            return

        cutoff_time = datetime.now() - timedelta(days=max_age_days)

        for filename in os.listdir(self.storage_dir):
            file_path = os.path.join(self.storage_dir, filename)
            try:
                # Check file modification time
                file_time = datetime.fromtimestamp(os.path.getmtime(file_path))
                if file_time < cutoff_time:
                    os.remove(file_path)
                    print(f"Removed old session file: {filename}")
            except Exception as e:
                print(f"Error cleaning up file {filename}: {e}")

    def get_session_stats(self, session_id):
        """Get statistics for a session"""
        processed = self.get_processed_messages(session_id)
        filtered = self.get_filtered_messages(session_id)
        status = self.get_processing_status(session_id)
        analysis_status = self.get_analysis_status(session_id)
        analysis_result = self.get_analysis_result(session_id)

        stats = {
            'session_id': session_id,
            'has_processed': processed is not None,
            'has_filtered': filtered is not None,
            'has_status': status is not None,
            'has_analysis_status': analysis_status is not None,
            'has_analysis_result': analysis_result is not None
        }

        if processed:
            stats['processed_count'] = len(processed)
            stats['unique_senders'] = len(set(m.get('sender') for m in processed if m.get('sender')))

        if filtered:
            stats['filtered_count'] = len(filtered)

        if status:
            stats['processing_status'] = status.get('status')

        if analysis_status:
            stats['analysis_status'] = analysis_status.get('status')
            stats['analysis_progress'] = analysis_status.get('progress', 0)

        return stats


# Global instance
session_manager = SessionManager()