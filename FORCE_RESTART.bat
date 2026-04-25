@echo off
setlocal
cd /d "%~dp0"
color 0c

echo =======================================================
echo     AI CHAIN GUARD - NUCLEAR FORCE RESTART UTILITY
echo =======================================================
echo.
echo [!] WARNING: This will forcibly terminate all processes 
echo     running on ports 5000 (Flask), 8000 (Node Gateway), 
echo     and 7545 (Ganache/Truffle).
echo.
echo Press any key to initiate sequence or CTRL+C to cancel...
pause >nul

echo.
echo [*] Terminating Port 5000 (Flask Backend)...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":5000" ^| find "LISTENING"') do taskkill /f /pid %%a 2>nul

echo [*] Terminating Port 8000 (Unified API Gateway)...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":8000" ^| find "LISTENING"') do taskkill /f /pid %%a 2>nul

echo [*] Terminating Port 7545 (Ganache Blockchain)...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":7545" ^| find "LISTENING"') do taskkill /f /pid %%a 2>nul

echo.
echo [*] Zombie processes eradicated.
echo [*] Re-launching AI Chain Guard...
echo.
timeout /t 2 /nobreak >nul

call start_all_services.bat
