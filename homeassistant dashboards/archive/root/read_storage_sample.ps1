net use Z: '\\Obelisk\docker' 2>$null
if (Test-Path 'Z:\homeassistant\.storage\lovelace.office_panel') {
    $json = Get-Content 'Z:\homeassistant\.storage\lovelace.office_panel' -Raw | ConvertFrom-Json
    $card = $json.data.config.views[0].cards[0].cards[0]
    Write-Host "First card type: $($card.type)"
    Write-Host "Custom fields keys: $($card.custom_fields.PSObject.Properties.Name -join ', ')"
    # Show first custom_field value (first 500 chars)
    $firstKey = $card.custom_fields.PSObject.Properties.Name[0]
    $firstVal = $card.custom_fields.$firstKey
    Write-Host ""
    Write-Host "First custom_field ($firstKey) first 500 chars:"
    $firstVal.Substring(0, [Math]::Min(500, $firstVal.Length))
}
net use Z: /delete /y 2>$null
