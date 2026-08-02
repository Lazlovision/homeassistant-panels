import json from 'json';
import ws from 'ws';

const secrets = json.parse(await Bun.file('F:/Homeassistant/secrets.json').text());
const ha_ip = secrets.HA_IP;
const token = secrets.HA_TOKEN;

// Check if dashboard config has been updated
const resp = await fetch(`http://${ha_ip}/api/config`, {
  headers: { 'Authorization': `Bearer ${token}` }
});
const config = json.parse(await resp.text());
console.log('Dashboards:', json.stringify(config.areas || {}, null, 2).slice(0, 200));

// Check the specific dashboard
const dashResp = await fetch(`http://${ha_ip}/api/dashboards/office-panel`, {
  headers: { 'Authorization': `Bearer ${token}` }
});
console.log('Status:', dashResp.status);
const dash = json.parse(await dashResp.text());
console.log('View ID:', dash?.views?.[0]?.id);
console.log('Title:', dash?.title);
console.log('Has screensaver:', JSON.stringify(dash).includes('screensaver'));
console.log('Dashboard size:', JSON.stringify(dash).length, 'chars');