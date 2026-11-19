@echo off
title iCoded Automation Runner
echo ===================================================
echo   iCoded Automation - Dataset Generator & Assessment
echo ===================================================
echo.
echo Starting Backend API on port 5000...
start "iCoded Backend (Port 5000)" cmd /k "cd server && node server.js"
echo.
echo Starting Frontend Client on port 3000...
start "iCoded Frontend (Port 3000)" cmd /k "cd client && npm run dev"
echo.
echo Launching browser to http://localhost:3000 ...
timeout /t 3 /nobreak > nul
start http://localhost:3000
echo Both services are running in background windows.
pause
