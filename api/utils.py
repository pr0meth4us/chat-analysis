import os

def ensure_dir(path):
    os.makedirs(path, exist_ok=True)

def log(message: str):
    print(f"[LOG] {message}")
