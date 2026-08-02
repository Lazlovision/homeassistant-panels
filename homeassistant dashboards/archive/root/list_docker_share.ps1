net use Z: '\\Obelisk\docker' 2>$null
if (Test-Path Z:) {
    Write-Host "Contents of Z: (\\Obelisk\docker):"
    Get-ChildItem Z: | Select-Object Name, Mode, LastWriteTime
} else {
    Write-Host "Z: not accessible"
}
net use Z: /delete /y 2>$null
