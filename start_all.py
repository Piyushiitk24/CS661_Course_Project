import subprocess
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

commands = [
    ("Module_Sankhadeep/client", ["npm", "run", "dev", "--", "--port=5173"]),
    ("Module_Aakriti", ["npm", "run", "dev", "--", "--port=5174"]),
    ("Module_Piyush_Ravi", ["flask", "run", "--port=5001"]),
    ("Module_Ananya_Arpita/Celeb_news", ["flask", "run", "--port=5002"]),
    ("Module_Disha_Khushi", ["flask", "run", "--port=5003"]),
]

pid_file = os.path.join(BASE_DIR, "pids.txt")

def start_server(path, command):
    full_path = os.path.join(BASE_DIR, path)
    print(f"Starting server in {full_path} with command: {' '.join(command)}")
    process = subprocess.Popen(command, cwd=full_path)
    return process.pid

def main():
    pids = []
    for path, command in commands:
        pid = start_server(path, command)
        pids.append(pid)

    # Save all PIDs to a file
    with open(pid_file, "w") as f:
        for pid in pids:
            f.write(f"{pid}\n")

    print("\n✅ All servers launched! PIDs saved to pids.txt.\n")

if __name__ == "__main__":
    main()
