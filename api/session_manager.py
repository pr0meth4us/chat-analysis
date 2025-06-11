import uuid
from flask import session

class SessionManager:
    def __init__(self):
        self.processed_messages_store = {}
        self.filtered_messages_store = {}

    def get_session_id(self):
        """Get or create session ID"""
        if 'session_id' not in session:
            session['session_id'] = str(uuid.uuid4())
        return session['session_id']

    def store_processed_messages(self, session_id, messages):
        """Store processed messages for a session"""
        self.processed_messages_store[session_id] = messages

    def get_processed_messages(self, session_id):
        """Retrieve processed messages for a session"""
        return self.processed_messages_store.get(session_id)

    def store_filtered_messages(self, session_id, messages):
        """Store filtered messages for a session"""
        self.filtered_messages_store[session_id] = messages

    def get_filtered_messages(self, session_id):
        """Retrieve filtered messages for a session"""
        return self.filtered_messages_store.get(session_id)

    def clear_session_data(self, session_id):
        """Clear all data for a session"""
        self.processed_messages_store.pop(session_id, None)
        self.filtered_messages_store.pop(session_id, None)

session_manager = SessionManager()
