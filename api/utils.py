import os

def ensure_dir(path):
    os.makedirs(path, exist_ok=True)

import datetime

def log(message):
    """Prints a timestamped log message."""
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{timestamp}] {message}")