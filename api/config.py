import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY')
    UPLOAD_FOLDER = "./uploads"
    MAX_CONTENT_LENGTH = 50 * 1024 * 1024
    SESSION_COOKIE_SAMESITE = "None"
    SESSION_COOKIE_SECURE = False
    TARGET_FORMAT = '%Y-%m-%d %H:%M:%S'
    REDIS_URL = os.getenv('REDIS_URL')
