@echo off
echo ==========================================
echo    Sahimed Public Preview Tunneling
echo ==========================================
echo echo Set up environment...
SET "PATH=C:\node-v25.8.1-win-x64\node-v25.8.1-win-x64;%PATH%"
CD /D "%~dp0"

echo.
echo 0. Stopping any existing server on Port 9002...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :9002') do taskkill /f /pid %%a >nul 2>&1

echo.
echo 1. Starting local server in background (Port 9002)...
echo Logs will be saved to server.log
start /B cmd /c "npm run dev > server.log 2>&1"

echo.
echo 2. Waiting for server to initialize (15 seconds)...
timeout /t 15

echo.
echo 3. Creating public tunnel...
echo (You might need to enter your IP or click 'Continue' on the first load)
npx localtunnel --port 9002

pause
