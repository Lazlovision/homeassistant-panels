$src = 'F:\Homeassistant\homeassistant dashboards\rendering_test.yaml'
$dst = '\\obelisk\docker\homeassistant\homeassistant dashboards\office_v6.yaml'
Write-Host "Copying rendering test to HA server..."
Copy-Item $src $dst -Force
Write-Host "Done. Verifying..."
$verify = Get-Item $dst
Write-Host "Deployed: $($verify.Length) bytes at $($verify.LastWriteTime)"
