import uuid
import json
import redis
from flask import session
from datetime import timedelta
from .config import Config

SESSION_DATA_TTL = timedelta(hours=24)


class RedisSessionManager:

    def __init__(self):
        redis_url = Config.REDIS_URL
        if not redis_url:
            raise ValueError("REDIS_URL environment variable not set. Cannot connect to Redis.")

        self.redis_client = redis.from_url(redis_url, decode_responses=True)
        print("Successfully connected to Redis.")

    @staticmethod
    def get_session_id():
        if 'session_id' not in session:
            session['session_id'] = str(uuid.uuid4())
        return session['session_id']

    def _get_redis_key(self, session_id, data_type):
        return f"session:{session_id}:{data_type}"

    def store_processed_messages(self, session_id, messages):
        key = self._get_redis_key(session_id, 'processed')
        value = json.dumps(messages)
        self.redis_client.set(key, value, ex=SESSION_DATA_TTL)

    def store_filtered_messages(self, session_id, filtered_data):
        key = self._get_redis_key(session_id, 'filtered')
        value = json.dumps(filtered_data)
        self.redis_client.set(key, value, ex=SESSION_DATA_TTL)

    def store_analysis_result(self, session_id, result):
        key = self._get_redis_key(session_id, 'analysis_result')
        value = json.dumps(result)
        self.redis_client.set(key, value, ex=SESSION_DATA_TTL)

    def store_processing_status(self, session_id, status):
        key = self._get_redis_key(session_id, 'status')
        value = json.dumps(status)
        self.redis_client.set(key, value, ex=SESSION_DATA_TTL)

    def store_analysis_status(self, session_id, status):
        key = self._get_redis_key(session_id, 'analysis_status')
        value = json.dumps(status)
        self.redis_client.set(key, value, ex=SESSION_DATA_TTL)

    def get_processed_messages(self, session_id):
        key = self._get_redis_key(session_id, 'processed')
        value = self.redis_client.get(key)
        return json.loads(value) if value else None

    def get_filtered_messages(self, session_id):
        key = self._get_redis_key(session_id, 'filtered')
        value = self.redis_client.get(key)
        return json.loads(value) if value else None

    def get_analysis_result(self, session_id):
        key = self._get_redis_key(session_id, 'analysis_result')
        value = self.redis_client.get(key)
        return json.loads(value) if value else None

    def get_processing_status(self, session_id):
        key = self._get_redis_key(session_id, 'status')
        value = self.redis_client.get(key)
        return json.loads(value) if value else None

    def get_analysis_status(self, session_id):
        key = self._get_redis_key(session_id, 'analysis_status')
        value = self.redis_client.get(key)
        return json.loads(value) if value else None

    def get_filtered_messages_only(self, session_id):
        filtered_data = self.get_filtered_messages(session_id)
        if filtered_data and isinstance(filtered_data, dict) and 'messages' in filtered_data:
            return filtered_data['messages']
        return None

    def get_participants_metadata(self, session_id):
        filtered_data = self.get_filtered_messages(session_id)
        if filtered_data and isinstance(filtered_data, dict):
            return filtered_data.get('participants_metadata', {})
        return {}

    def clear_processed_messages(self, session_id):
        key = self._get_redis_key(session_id, 'processed')
        self.redis_client.delete(key)

    def clear_filtered_messages(self, session_id):
        key = self._get_redis_key(session_id, 'filtered')
        self.redis_client.delete(key)

    def clear_analysis_result(self, session_id):
        key = self._get_redis_key(session_id, 'analysis_result')
        self.redis_client.delete(key)

    def clear_session_data(self, session_id):
        keys_to_delete = [
            self._get_redis_key(session_id, 'processed'),
            self._get_redis_key(session_id, 'filtered'),
            self._get_redis_key(session_id, 'analysis_result'),
            self._get_redis_key(session_id, 'status'),
            self._get_redis_key(session_id, 'analysis_status')
        ]
        self.redis_client.delete(*keys_to_delete)


session_manager = RedisSessionManager()
