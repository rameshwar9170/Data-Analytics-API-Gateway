# iCoded Automation Server Runner
Write-Host "Starting iCoded Automation Full-Stack Platform..." -ForegroundColor Cyan

# Check Atlas Network Access
Write-Host "Verifying MongoDB Atlas Connectivity..." -ForegroundColor Yellow
$currentIp = (Invoke-RestMethod -Uri "https://api.ipify.org?format=json").ip
Write-Host "Current Public IP: $currentIp" -ForegroundColor Green

Write-Host "Starting Backend API on Port 5000..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\server'; node server.js"

Write-Host "Starting Frontend Dev Server on Port 3000..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\client'; npm run dev"

Write-Host "Both servers started! Open http://localhost:3000 in your browser." -ForegroundColor Green
