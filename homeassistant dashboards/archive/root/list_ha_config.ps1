net use Z: '\\Obelisk\docker' 2>$null
if (Test-Path 'Z:\homeassistant') {
    Write-Host "Contents of Z:\homeassistant:"
    Get-ChildItem 'Z:\homeassistant' | Select-Object Name, Mode, LastWriteTime
    Write-Host ""
    Write-Host "Dashboard files:"
    Get-ChildItem 'Z:\homeassistant\homeassistant dashboards' -ErrorAction SilentlyContinue | Select-Object Name, Length, LastWriteTime
} else {
    Write-Host "Z:\homeassistant not accessible"
}
net use Z: /delete /y 2>$null
