import uuid
import json
import psycopg2
from psycopg2 import pool
from contextlib import contextmanager
from flask import session
from datetime import datetime
from .config import Config


class PostgresSessionManager:
    def __init__(self, dsn):
        try:
            # Use a separate pool for the gateway app to avoid conflicts
            self.pool = pool.SimpleConnectionPool(minconn=1, maxconn=5, dsn=dsn)
            print("Gateway successfully created PostgreSQL connection pool.")
            self._setup_database()
            # Clear old data on startup to prevent session confusion
            self._cleanup_old_data()
        except (Exception, psycopg2.DatabaseError) as error:
            print("Gateway error while creating PostgreSQL pool", error)
            raise

    @contextmanager
    def _get_connection(self):
        conn = None
        try:
            conn = self.pool.getconn()
            yield conn
        finally:
            if conn:
                self.pool.putconn(conn)

    def _setup_database(self):
        """
        Creates tables for session data in the gateway.
        We'll use a naming convention to keep them separate from the parser's tables.
        """
        commands = [
            """
            CREATE TABLE IF NOT EXISTS gateway_session_data
            (
                id
                SERIAL
                PRIMARY
                KEY,
                session_id
                UUID
                NOT
                NULL,
                data_type
                VARCHAR
            (
                50
            ) NOT NULL,
                data_content JSONB,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW
            (
            ),
                UNIQUE
            (
                session_id,
                data_type
            )
                );
            """,
            """
            CREATE INDEX IF NOT EXISTS session_id_type_idx ON gateway_session_data (session_id, data_type);
            """,
            """
            CREATE INDEX IF NOT EXISTS created_at_idx ON gateway_session_data (created_at);
            """,
            """
            CREATE
            OR REPLACE FUNCTION delete_old_gateway_data() RETURNS void AS $$
            BEGIN
            DELETE
            FROM gateway_session_data
            WHERE created_at < NOW() - INTERVAL '24 hours';
            END;
            $$
            LANGUAGE plpgsql;
            """
        ]
        try:
            with self._get_connection() as conn:
                with conn.cursor() as cur:
                    for command in commands:
                        cur.execute(command)
                    conn.commit()
            print("Gateway database tables ensured.")
        except (Exception, psycopg2.DatabaseError) as error:
            print("Gateway DB setup error", error)

    def _cleanup_old_data(self):
        """Clean up old session data on startup to prevent confusion"""
        try:
            with self._get_connection() as conn:
                with conn.cursor() as cur:
                    # Remove data older than 24 hours
                    cur.execute("SELECT delete_old_gateway_data();")

                    # Get count of remaining sessions for logging
                    cur.execute("SELECT COUNT(DISTINCT session_id) FROM gateway_session_data;")
                    remaining_sessions = cur.fetchone()[0]

                    conn.commit()
                    print(f"Cleaned up old session data. {remaining_sessions} active sessions remaining.")
        except (Exception, psycopg2.DatabaseError) as error:
            print("Error during startup cleanup:", error)

    @staticmethod
    def get_session_id():
        """
        Gets a unique session ID from the Flask session object.
        Each browser/client gets their own unique session ID.
        """
        if 'session_id' not in session:
            session['session_id'] = str(uuid.uuid4())
            session.permanent = True  # Make session persistent across browser sessions
            print(f"Created new session ID: {session['session_id']}")
        return session['session_id']

    @staticmethod
    def clear_flask_session():
        """Force clear the Flask session to generate a new session ID"""
        session.clear()
        new_session_id = PostgresSessionManager.get_session_id()
        print(f"Cleared Flask session, new session ID: {new_session_id}")
        return new_session_id

    def _update_session_data(self, session_id: str, data_type: str, data: dict):
        """Update session data for a specific session ID and data type"""
        sql = """
              INSERT INTO gateway_session_data (session_id, data_type, data_content)
              VALUES (%(session_id)s, %(data_type)s, %(data)s) ON CONFLICT (session_id, data_type) 
            DO \
              UPDATE SET
                  data_content = EXCLUDED.data_content, \
                  created_at = NOW(); \
              """
        try:
            with self._get_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(sql, {
                        'session_id': session_id,
                        'data_type': data_type,
                        'data': json.dumps(data)
                    })
                    conn.commit()
                    print(f"Updated {data_type} data for session {session_id}")
        except (Exception, psycopg2.DatabaseError) as error:
            print(f"Error updating session data: {error}")
            raise

    def _get_session_data(self, session_id: str, data_type: str):
        """Get session data for a specific session ID and data type"""
        sql = "SELECT data_content FROM gateway_session_data WHERE session_id = %s AND data_type = %s;"
        try:
            with self._get_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(sql, (session_id, data_type))
                    row = cur.fetchone()
                    return row[0] if row else None
        except (Exception, psycopg2.DatabaseError) as error:
            print(f"Error getting session data: {error}")
            return None

    def _clear_session_data_by_type(self, session_id: str, data_type: str):
        """Clear specific type of session data for a session ID"""
        sql = "DELETE FROM gateway_session_data WHERE session_id = %s AND data_type = %s;"
        try:
            with self._get_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(sql, (session_id, data_type))
                    rows_affected = cur.rowcount
                    conn.commit()
                    print(f"Cleared {data_type} data for session {session_id} ({rows_affected} rows)")
        except (Exception, psycopg2.DatabaseError) as error:
            print(f"Error clearing session data: {error}")
            raise

    def _get_current_timestamp(self):
        """Get current timestamp in ISO format"""
        return datetime.now().isoformat()

    # ===== PROCESSED MESSAGES =====
    def store_processed_messages(self, session_id: str, messages: list):
        """Store processed messages for a session"""
        data = {
            'messages': messages,
            'count': len(messages),
            'timestamp': self._get_current_timestamp()
        }
        self._update_session_data(session_id, 'processed', data)

    def get_processed_messages(self, session_id: str):
        """Get processed messages for a session"""
        data = self._get_session_data(session_id, 'processed')
        return data.get('messages') if data else None

    def clear_processed_messages(self, session_id: str):
        """Clear processed messages for a session"""
        self._clear_session_data_by_type(session_id, 'processed')

    # ===== FILTERED MESSAGES =====
    def store_filtered_messages(self, session_id: str, filtered_data: dict):
        """Store filtered messages data for a session"""
        # Ensure we have timestamp and count
        if 'timestamp' not in filtered_data:
            filtered_data['timestamp'] = self._get_current_timestamp()
        if 'count' not in filtered_data and 'messages' in filtered_data:
            filtered_data['count'] = len(filtered_data['messages'])

        self._update_session_data(session_id, 'filtered', filtered_data)

    def get_filtered_messages(self, session_id: str):
        """Get filtered messages data for a session"""
        return self._get_session_data(session_id, 'filtered')

    def clear_filtered_messages(self, session_id: str):
        """Clear filtered messages for a session"""
        self._clear_session_data_by_type(session_id, 'filtered')

    # ===== ANALYSIS RESULTS =====
    def store_analysis_result(self, session_id: str, result: dict):
        """Store analysis result for a session"""
        if 'timestamp' not in result:
            result['timestamp'] = self._get_current_timestamp()

        self._update_session_data(session_id, 'analysis', result)

    def get_analysis_result(self, session_id: str):
        """Get analysis result for a session"""
        return self._get_session_data(session_id, 'analysis')

    def clear_analysis_result(self, session_id: str):
        """Clear analysis result for a session"""
        self._clear_session_data_by_type(session_id, 'analysis')

    # ===== SESSION MANAGEMENT =====
    def clear_session_data(self, session_id: str):
        """Delete all data associated with a session_id"""
        sql = "DELETE FROM gateway_session_data WHERE session_id = %s;"
        try:
            with self._get_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(sql, (session_id,))
                    rows_affected = cur.rowcount
                    conn.commit()
                    print(f"Cleared all PostgreSQL session data for session_id: {session_id} ({rows_affected} rows)")
        except (Exception, psycopg2.DatabaseError) as error:
            print(f"Error clearing session data: {error}")
            raise

    def get_session_info(self, session_id: str):
        """Get information about what data exists for a session"""
        sql = """
              SELECT data_type, \
                     created_at,
                     CASE
                         WHEN data_content ? 'count' THEN (data_content ->>'count')::int
                       WHEN data_content ? 'messages' THEN jsonb_array_length(data_content->'messages')
                       ELSE 1
              END \
              as item_count
            FROM gateway_session_data 
            WHERE session_id = \
              %s
              ORDER \
              BY \
              created_at \
              DESC; \
              """
        try:
            with self._get_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(sql, (session_id,))
                    rows = cur.fetchall()
                    return [
                        {
                            'data_type': row[0],
                            'created_at': row[1].isoformat() if row[1] else None,
                            'item_count': row[2] or 0
                        }
                        for row in rows
                    ]
        except (Exception, psycopg2.DatabaseError) as error:
            print(f"Error getting session info: {error}")
            return []

    def session_exists(self, session_id: str):
        """Check if a session has any data"""
        sql = "SELECT COUNT(*) FROM gateway_session_data WHERE session_id = %s;"
        try:
            with self._get_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(sql, (session_id,))
                    count = cur.fetchone()[0]
                    return count > 0
        except (Exception, psycopg2.DatabaseError) as error:
            print(f"Error checking session existence: {error}")
            return False

    # ===== ADMIN/DEBUG METHODS =====
    def get_all_sessions(self):
        """Get info about all active sessions (for debugging/admin)"""
        sql = """
              SELECT session_id,
                     COUNT(*)        as data_types,
                     MIN(created_at) as first_activity,
                     MAX(created_at) as last_activity
              FROM gateway_session_data
              GROUP BY session_id
              ORDER BY last_activity DESC; \
              """
        try:
            with self._get_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(sql)
                    rows = cur.fetchall()
                    return [
                        {
                            'session_id': str(row[0]),
                            'data_types': row[1],
                            'first_activity': row[2].isoformat() if row[2] else None,
                            'last_activity': row[3].isoformat() if row[3] else None
                        }
                        for row in rows
                    ]
        except (Exception, psycopg2.DatabaseError) as error:
            print(f"Error getting all sessions: {error}")
            return []


# Initialize the session manager
session_manager = PostgresSessionManager(dsn=Config.DATABASE_URL)