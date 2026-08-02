net use Z: '\\Obelisk\docker' 2>$null
if (Test-Path 'Z:\homeassistant\.storage\lovelace.office_panel') {
    $raw = Get-Content 'Z:\homeassistant\.storage\lovelace.office_panel' -Raw
    # Show first 3000 chars to see the structure
    Write-Host $raw.Substring(0, [Math]::Min(3000, $raw.Length))
}
net use Z: /delete /y 2>$null
