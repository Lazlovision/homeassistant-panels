net use Z: '\\Obelisk\docker' 2>$null
if (Test-Path 'Z:\homeassistant\.storage\lovelace.office_panel') {
    $content = Get-Content 'Z:\homeassistant\.storage\lovelace.office_panel' -Raw
    # Show first 2000 chars to understand the format
    Write-Host "Dashboard storage file (first 2000 chars):"
    $content.Substring(0, [Math]::Min(2000, $content.Length))
    Write-Host ""
    Write-Host "Total size: $($content.Length) chars"
} else {
    Write-Host "Dashboard storage file not found"
}
net use Z: /delete /y 2>$null
