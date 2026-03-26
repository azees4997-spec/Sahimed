@echo off
echo ===================================================
echo   SahiMed AI Cloud Deployment Assistant
echo ===================================================
echo.
echo 1. Installing root dependencies...
call npm install
echo.
echo 2. Installing cloud functions dependencies...
cd functions
call npm install
cd ..
echo.
echo 3. Deploying AI processing to Firebase Cloud...
echo (Note: You may be asked to login if not already)
call firebase deploy --only functions
echo.
echo ===================================================
echo   Deployment Complete! 
echo   Your AI is now running in the Cloud.
echo ===================================================
pause
