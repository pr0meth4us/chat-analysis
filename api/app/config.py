import os

class Config:
    SECRET_KEY = os.urandom(24)
    UPLOAD_FOLDER = "./uploads"
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024
    SESSION_COOKIE_SAMESITE = "None"
    SESSION_COOKIE_SECURE = False
    TARGET_FORMAT = '%Y-%m-%d %H:%M:%S'
