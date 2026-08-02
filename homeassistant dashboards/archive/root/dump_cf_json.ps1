net use Z: '\\Obelisk\docker' 2>$null
if (Test-Path 'Z:\homeassistant\.storage\lovelace.office_panel') {
    $json = Get-Content 'Z:\homeassistant\.storage\lovelace.office_panel' -Raw | ConvertFrom-Json
    $card = $json.data.config.views[0].cards[0].cards[0]
    # Convert back to JSON to see raw structure
    $cfJson = $card.custom_fields | ConvertTo-Json -Depth 5
    Write-Host $cfJson.Substring(0, [Math]::Min(1500, $cfJson.Length))
}
net use Z: /delete /y 2>$null
