import subprocess
import os
import time
import sys
import webbrowser
import platform
import urllib.request
import urllib.error

# ── Configuration ────────────────────────────────────────────────
BACKEND_PORT = 5000
GATEWAY_PORT = 8000
GANACHE_PORT = 7545
GANACHE_APP_ID = "GanacheUI_rb4352f0jd4m2!GanacheUI"
HEALTH_CHECK_URL = f"http://localhost:{BACKEND_PORT}/api/elite/status"
HEALTH_CHECK_TIMEOUT = 30  # seconds to wait for backend to become healthy
PROJECT_DIR = os.path.dirname(os.path.abspath(__file__))


def print_header():
    print()
    print("=" * 60)
    print("      AI Chain Guard - Automated Project Launcher")
    print("=" * 60)
    print()


def kill_port(port):
    """Kill any process listening on a specific port (Windows only)."""
    if platform.system() != "Windows":
        return
    try:
        cmd = f'netstat -ano | findstr :{port}'
        output = subprocess.check_output(cmd, shell=True).decode()
        for line in output.strip().split('\n'):
            if 'LISTENING' in line:
                pid = line.strip().split()[-1]
                print(f"      Stopping PID {pid} on port {port}...")
                subprocess.run(f"taskkill /F /PID {pid} /T", shell=True,
                               capture_output=True)
    except Exception:
        pass  # Port not in use — that's fine


def cleanup():
    """Kill old processes on our ports."""
    print("[1/5] Cleaning up stale services...")
    for port in [BACKEND_PORT, GATEWAY_PORT]:
        kill_port(port)
    print("      Done.")


def get_python_exe():
    """Resolve the best Python executable (venv preferred)."""
    venv_python = os.path.join(PROJECT_DIR, ".venv", "Scripts", "python.exe")
    if os.path.exists(venv_python):
        return venv_python
    return sys.executable


def start_backend(python_exe):
    """Start the Flask backend in a new console window that stays open on crash."""
    print("[2/5] Starting Backend API (Port 5000)...")
    app_path = os.path.join(PROJECT_DIR, "backend", "app.py")
    if not os.path.exists(app_path):
        print(f"      [!] ERROR: {app_path} not found!")
        return False

    # Use cmd /k so the window stays open if the process crashes
    cmd = f'cmd /k ""{python_exe}" "{app_path}" || (echo. & echo [!] BACKEND CRASHED — see error above & pause)"'
    subprocess.Popen(cmd, shell=True, creationflags=subprocess.CREATE_NEW_CONSOLE)
    print("      Backend process launched.")
    return True


def start_gateway():
    """Start the Master Unified Gateway (Port 8000)."""
    print("[3/5] Starting Unified Master Gateway (Port 8000)...")
    gateway_path = os.path.join(PROJECT_DIR, "gateway.js")
    if not os.path.exists(gateway_path):
        print(f"      [!] ERROR: {gateway_path} not found!")
        return False

    # Check if node is installed
    cmd = f'cmd /k "node "{gateway_path}" || (echo. & echo [!] GATEWAY CRASHED — ensure node.js is installed & pause)"'
    subprocess.Popen(cmd, shell=True, creationflags=subprocess.CREATE_NEW_CONSOLE)
    print("      Gateway process launched.")
    return True


def wait_for_backend():
    """Poll the backend health endpoint until it responds or timeout."""
    print(f"\n      Waiting for backend to become ready ", end="", flush=True)
    start = time.time()
    while time.time() - start < HEALTH_CHECK_TIMEOUT:
        try:
            req = urllib.request.Request(HEALTH_CHECK_URL)
            req.add_header("X-SPIFFE-ID", "spiffe://ai-chain-guard.io/internal/launcher")
            resp = urllib.request.urlopen(req, timeout=2)
            if resp.status == 200:
                print(" READY!")
                return True
        except (urllib.error.URLError, ConnectionRefusedError, OSError):
            pass
        print(".", end="", flush=True)
        time.sleep(1.5)

    print(" TIMEOUT!")
    print("      [!] Backend did not respond within "
          f"{HEALTH_CHECK_TIMEOUT}s. Check the backend window for errors.")
    return False


def start_ganache():
    """Launch Ganache UI using multiple reliable methods."""
    print("[4/5] Launching Ganache Blockchain...")

    # Method 1: Use PowerShell Start-Process with the shell:AppsFolder URI directly
    try:
        ps_cmd = f'powershell -NoProfile -Command "Start-Process \\"shell:AppsFolder\\{GANACHE_APP_ID}\\""'
        result = subprocess.run(ps_cmd, shell=True, capture_output=True, timeout=15)
        if result.returncode == 0:
            print("      Ganache UI launched successfully.")
            print("      [!] Ensure your Ganache Workspace uses Port 7545.")
            return
    except Exception as e:
        print(f"      Method 1 failed: {e}")

    # Method 2: Try direct explorer.exe invocation (without Start-Process wrapper)
    try:
        subprocess.Popen(
            f'explorer.exe "shell:AppsFolder\\{GANACHE_APP_ID}"',
            shell=True
        )
        print("      Ganache UI triggered via explorer.")
        print("      [!] Ensure your Ganache Workspace uses Port 7545.")
        return
    except Exception as e:
        print(f"      Method 2 failed: {e}")

    # Method 3: Fallback to Ganache CLI
    print("      [!] Could not launch Ganache UI.")
    print("      [*] Trying Ganache CLI fallback (requires npx)...")
    try:
        subprocess.Popen(
            f'npx ganache-cli --port {GANACHE_PORT} -m "secret"',
            shell=True, creationflags=subprocess.CREATE_NEW_CONSOLE
        )
        print("      Ganache CLI started.")
    except Exception:
        print("      [!] Ganache CLI also failed. Please start Ganache manually.")
        print("          The backend will still work — blockchain features")
        print("          will show warnings but won't crash.")


def main():
    os.chdir(PROJECT_DIR)
    print_header()

    # Step 1: Cleanup
    cleanup()

    # Resolve Python
    python_exe = get_python_exe()
    print(f"      Python: {python_exe}\n")

    # Step 2: Start Backend FIRST (most important)
    if not start_backend(python_exe):
        print("\n[!] Cannot start backend. Aborting.")
        input("Press Enter to exit...")
        return

    # Step 3: Start Gateway
    if not start_gateway():
        print("\n[!] Cannot start gateway. Aborting.")
        input("Press Enter to exit...")
        return

    # Wait for backend to actually be ready before opening browser
    backend_ready = wait_for_backend()

    # Step 4: Ganache LAST (optional, non-blocking)
    start_ganache()

    # Step 5: Open browser
    print("\n[5/5] Launching Dashboard...")
    if backend_ready:
        webbrowser.open(f"http://localhost:{GATEWAY_PORT}")

    # Summary
    print()
    print("=" * 60)
    status = "SUCCESS" if backend_ready else "PARTIAL"
    print(f"   {status}: Services launched!")
    print("=" * 60)
    print(f"   Frontend:     http://localhost:{GATEWAY_PORT}")
    print(f"   Backend API:  http://localhost:{BACKEND_PORT}")
    print(f"   Blockchain:   http://localhost:{GANACHE_PORT}")
    if not backend_ready:
        print("\n   [!] Backend may still be starting — check its window.")
    print("\n   Keep the terminal windows open while using the app.")
    print("   Press Enter to exit this launcher.")
    input()


if __name__ == "__main__":
    main()
