# Startup Script for Vaatia College CMS Backend

Write-Host "🚀 Starting Vaatia College CMS Backend..." -ForegroundColor Cyan

# Kill any existing process on port 3000
$portProcess = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | Select-Object -First 1
if ($portProcess) {
    Write-Host "⚠️  Cleaning up old server process (PID: $($portProcess.OwningProcess))..." -ForegroundColor Yellow
    Stop-Process -Id $portProcess.OwningProcess -Force -ErrorAction SilentlyContinue
}

# Run npm start via cmd.exe to bypass PowerShell execution restrictions
cmd /c "npm start"

Write-Host "✅ Backend is shutting down." -ForegroundColor Red
Read-Host "Press Enter to close..."
