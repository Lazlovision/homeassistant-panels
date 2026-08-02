net use Z: '\\Obelisk\docker' 2>$null
if (Test-Path 'Z:\homeassistant') {
    # Search for dashboard-related files
    Write-Host "Searching for dashboard files..."
    Get-ChildItem 'Z:\homeassistant' -Recurse -Filter '*office*' -ErrorAction SilentlyContinue | Select-Object FullName, Length, LastWriteTime
    Write-Host ""
    Write-Host "Searching for yaml dashboards..."
    Get-ChildItem 'Z:\homeassistant' -Recurse -Filter '*dashboard*' -ErrorAction SilentlyContinue | Select-Object FullName, Length, LastWriteTime
    Write-Host ""
    # Check for 'homeassistant dashboards' directory (with space)
    $dashDir = 'Z:\homeassistant\homeassistant dashboards'
    if (Test-Path $dashDir) {
        Write-Host "Found dashboard directory: $dashDir"
        Get-ChildItem $dashDir | Select-Object Name, Length, LastWriteTime
    } else {
        Write-Host "Dashboard directory not found at: $dashDir"
        # List all directories
        Write-Host ""
        Write-Host "All directories in Z:\homeassistant:"
        Get-ChildItem 'Z:\homeassistant' -Directory | Select-Object Name
    }
}
net use Z: /delete /y 2>$null
