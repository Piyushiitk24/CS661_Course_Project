import os
import signal

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
pid_file = os.path.join(BASE_DIR, "pids.txt")

def main():
    if not os.path.exists(pid_file):
        print("❌ No pids.txt found. Nothing to stop.")
        return

    with open(pid_file, "r") as f:
        pids = [int(line.strip()) for line in f if line.strip()]

    for pid in pids:
        try:
            os.kill(pid, signal.SIGTERM)
            print(f"✅ Killed process {pid}")
        except ProcessLookupError:
            print(f"⚠️ Process {pid} already not running.")
        except Exception as e:
            print(f"❌ Error killing process {pid}: {e}")

    # After stopping, delete the pid file
    os.remove(pid_file)
    print("\n✅ All servers stopped. Ports are free now.")

if __name__ == "__main__":
    main()
