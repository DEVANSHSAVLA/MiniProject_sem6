@echo off
setlocal
cd /d "%~dp0"

echo ==============================================
echo       AI Chain Guard - Project Manager
echo ==============================================

:: Check for virtual environment python
if exist ".venv\Scripts\python.exe" (
    .venv\Scripts\python.exe run_ai_guard.py
) else (
    echo [!] Virtual environment not found. Trying system python...
    python run_ai_guard.py
)

pause
