@echo off
echo ==========================================
echo    Sahimed Production Preview (Fast)
echo ==========================================
SET "PATH=C:\node-v25.8.1-win-x64\node-v25.8.1-win-x64;%PATH%"
CD /D "%~dp0"

echo 1. Clearing old server on Port 9002...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :9002') do taskkill /f /pid %%a >nul 2>&1

echo 2. Building production bundle (This might take a minute)...
call npm run build

echo 3. Starting production server...
start /B cmd /c "npm start -- -p 9002 > prod.log 2>&1"

echo 4. Waiting for server to initialize...
timeout /t 10

echo 5. Creating public tunnel...
npx localtunnel --port 9002

pause
