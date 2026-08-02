$src = 'F:\Homeassistant\homeassistant dashboards\rendering_test.yaml'
$dst = '\\Obelisk\docker\homeassistant\homeassistant dashboards\office_v6.yaml'

# Try to map the docker share
net use Z: '\\Obelisk\docker' /persistent:no 2>$null
if (-not (Test-Path Z:)) {
    Write-Host "Docker share not accessible, trying direct copy..."
} else {
    Write-Host "Mapped Z: to \\Obelisk\docker"
    $dst = 'Z:\homeassistant\homeassistant dashboards\office_v6.yaml'
}

# Copy the file
try {
    Copy-Item $src $dst -Force
    Write-Host "SUCCESS: Copied to $dst"
    $verify = Get-Item $dst
    Write-Host "Verified: $($verify.Length) bytes"
} catch {
    Write-Host "FAILED: $_"
}

# Cleanup
net use Z: /delete /y 2>$null
