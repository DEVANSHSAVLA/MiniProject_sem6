@echo off
setlocal enabledelayedexpansion
title AI Chain Guard - SecOps Project Launcher
cd /d "%~dp0"
color 0b

echo ===================================================================
echo     AI CHAIN GUARD - ZERO TRUST SECURITY FRAMEWORK
echo ===================================================================
echo   [!] Initializing High-Fidelity Blockchain & AI Environment
echo ===================================================================
echo.

:: Check for virtual environment python
if exist ".venv\Scripts\python.exe" (
    echo [*] Virtual Environment Detected.
    set PYTHON_CMD=.venv\Scripts\python.exe
) else (
    echo [!] Virtual environment not found. Using global python...
    set PYTHON_CMD=python
)

echo [*] Starting Unified Gateway (Port 8000) ^& Flask Backend (Port 5000)...
echo [*] Waiting for Ganache Blockchain (Port 7545)...
echo.
echo -------------------------------------------------------------------
echo   Press CTRL+C at any time to terminate all services.
echo   For emergency port cleanup, use FORCE_RESTART.bat
echo -------------------------------------------------------------------
echo.

%PYTHON_CMD% run_ai_guard.py

echo.
echo [!] Services terminated.
pause
