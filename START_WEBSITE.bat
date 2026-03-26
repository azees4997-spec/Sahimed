@echo off
echo Starting Sahimed Development Server...
CD /D "%~dp0"
SET "PATH=C:\node-v25.8.1-win-x64\node-v25.8.1-win-x64;%PATH%"
call npm run dev
pause
