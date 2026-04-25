import subprocess
import os
import time
import sys
import webbrowser
import platform

def print_header():
    print("=" * 60)
    print("      AI Chain Guard - Automated Project Launcher")
    print("=" * 60)
    print()

def kill_processes():
    print("[1/5] Cleaning up existing services (Ports 5000, 8000)...")
    if platform.system() == "Windows":
        # Only kill processes on our specific ports to avoid killing the launcher itself
        ports = [5000, 8000]
        for port in ports:
            try:
                # Find PID using netstat
                cmd = f'netstat -ano | findstr :{port}'
                output = subprocess.check_output(cmd, shell=True).decode()
                for line in output.strip().split('\n'):
                    if 'LISTENING' in line:
                        pid = line.strip().split()[-1]
                        print(f"      Stopping process {pid} on port {port}...")
                        subprocess.run(f"taskkill /F /PID {pid} /T", shell=True, capture_output=True)
            except Exception:
                pass # Port likely not in use
    print("      Cleanup complete.")

def get_python_exe():
    venv_python = os.path.abspath(".venv/Scripts/python.exe")
    if os.path.exists(venv_python):
        return venv_python
    return sys.executable  # Fallback to current python

def start_ganache():
    print("[2/5] Launching Ganache Blockchain...")
    # Microsoft Store AppID found on system
    app_id = "GanacheUI_rb4352f0jd4m2!GanacheUI"
    
    try:
        # Use PowerShell to start the UWP app
        ps_cmd = f"Start-Process 'explorer.exe' 'shell:AppsFolder\\{app_id}'"
        subprocess.run(["powershell", "-Command", ps_cmd], check=True)
        print(f"      [*] Triggered Ganache UI ({app_id})")
        print("      [!] Please ensure your Ganache Workspace is set to Port 7545.")
    except Exception as e:
        print(f"      [!] Failed to launch Ganache UI: {e}")
        print("      [*] Falling back to Ganache CLI (requires npx)...")
        subprocess.Popen("npx ganache-cli --port 7545 -m \"secret\"", shell=True, creationflags=subprocess.CREATE_NEW_CONSOLE)
    
    print("      Waiting 10 seconds for blockchain warming...")
    time.sleep(10)

def start_backend(python_exe):
    print("[3/5] Starting Backend API (Port 5000)...")
    app_path = os.path.abspath("backend/app.py")
    if not os.path.exists(app_path):
        print(f"      [!] ERROR: Could not find {app_path}")
        return False
        
    # Start in a new console window so the user can see logs
    process = subprocess.Popen([python_exe, app_path], creationflags=subprocess.CREATE_NEW_CONSOLE)
    return True

def start_frontend(python_exe):
    print("[4/5] Starting Frontend Server (Port 8000)...")
    if not os.path.exists("frontend"):
        print("      [!] ERROR: Frontend directory not found.")
        return False
        
    args = [python_exe, "-m", "http.server", "8000", "-d", "frontend"]
    subprocess.Popen(args, creationflags=subprocess.CREATE_NEW_CONSOLE)
    return True

def main():
    print_header()
    kill_processes()
    
    python_exe = get_python_exe()
    print(f"      Using Python: {python_exe}")
    
    start_ganache()
    
    if start_backend(python_exe) and start_frontend(python_exe):
        print("\n[5/5] Launching Live Dashboard...")
        time.sleep(5)
        webbrowser.open("http://localhost:8000")
        
        print("\n" + "=" * 60)
        print("   SUCCESS: All services have been triggered!")
        print("=" * 60)
        print("   Frontend:    http://localhost:8000")
        print("   Backend API:  http://localhost:5000")
        print("   Blockchain:   http://localhost:7545")
        print("\n   Keep the opened terminal windows running.")
        print("   Press Enter to exit this launcher.")
        input()
    else:
        print("\n[!] Setup failed. Check the errors above.")
        input("Press Enter to exit...")

if __name__ == "__main__":
    main()
