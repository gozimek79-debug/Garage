import subprocess
import time

try:
    print("Attempting to push...")
    result = subprocess.run(["git", "push", "origin", "main"], capture_output=True, text=True, timeout=15)
    print("STDOUT:", result.stdout)
    print("STDERR:", result.stderr)
except Exception as e:
    print("Failed:", e)
