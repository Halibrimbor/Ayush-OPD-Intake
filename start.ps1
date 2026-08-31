$ErrorActionPreference = "Stop"
$root = $PSScriptRoot
$backend = Join-Path $root "backend"
$frontend = Join-Path $root "frontend"

if (-not (Test-Path (Join-Path $backend "app\main.py"))) {
    throw "Backend was not found at $backend"
}
if (-not (Test-Path (Join-Path $frontend "package.json"))) {
    throw "Frontend was not found at $frontend"
}

Write-Host "Starting Ayush OPD backend on http://127.0.0.1:8000" -ForegroundColor Cyan
Start-Process powershell.exe -ArgumentList @(
    "-NoExit",
    "-NoLogo",
    "-Command",
    "Set-Location '$backend'; uvicorn app.main:app --reload --port 8000"
)

Write-Host "Starting Ayush OPD frontend on http://localhost:3000" -ForegroundColor Green
Start-Process powershell.exe -ArgumentList @(
    "-NoExit",
    "-NoLogo",
    "-Command",
    "Set-Location '$frontend'; npm run dev"
)

Write-Host "Services started. Open http://localhost:3000" -ForegroundColor Yellow
