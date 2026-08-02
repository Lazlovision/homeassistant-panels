import asyncio
import json
import os
import re
import sys
import time
import websockets
import yaml


def load_secrets():
    secrets_path = r'f:\Homeassistant\secrets.json'
    if os.path.exists(secrets_path):
        with open(secrets_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {
        'HA_IP': os.environ.get('HA_IP', '10.10.10.100'),
        'HA_TOKEN': os.environ.get('HA_TOKEN', 'YOUR_HA_LONG_LIVED_TOKEN_HERE')
    }


async def push():
    # ── Step 1: Read source file once into memory ──
    source_path = r'f:\Homeassistant\homeassistant dashboards\office_v6.yaml'
    with open(source_path, 'r', encoding='utf-8') as f:
        raw_text = f.read()

    # ── Step 2: Inject new view ID (non-destructive — in-memory only) ──
    ts = int(time.time())
    new_id = f'office_view_v6_clean_v6_88_{ts}'

    # Match actual YAML structure: path → id → badges
    # Old regex expected badges immediately after path, but id: sits between them.
    pattern = r'(path:\s*office-panel\n\s*)id:\s*\S+(\n\s*badges:)'
    replacement = rf'\1id: {new_id}\2'
    new_text = re.sub(pattern, replacement, raw_text, count=1)

    # ── Step 3: Parse YAML for WebSocket payload ──
    yaml_data = yaml.safe_load(new_text)
    config = {
        'title': yaml_data.get('title', 'Office Panel'),
        'views': yaml_data['views'],
        'kiosk_mode': yaml_data.get('kiosk_mode', {})
    }

    # ── Step 4: Load credentials ──
    secrets = load_secrets()
    ha_ip = secrets.get('HA_IP', '10.10.10.100')
    token = secrets.get('HA_TOKEN', '')

    if not token or token == 'YOUR_HA_LONG_LIVED_TOKEN_HERE':
        print('ERROR: No valid HA_TOKEN found. Set it in secrets.json or HA_TOKEN env var.')
        sys.exit(1)

    url = f'ws://{ha_ip}:8123/api/websocket'

    # ── Step 5: WebSocket push with full error handling ──
    try:
        async with websockets.connect(url) as ws:
            # ── Auth ──
            await ws.recv()  # consume auth_required
            await ws.send(json.dumps({'type': 'auth', 'access_token': token}, ensure_ascii=False))
            auth_resp = json.loads(await ws.recv())
            if auth_resp.get('type') == 'auth_required':
                print('ERROR: Authentication failed. Check HA_TOKEN in secrets.json')
                sys.exit(1)
            if auth_resp.get('type') != 'auth_ok':
                print(f'ERROR: Unexpected auth response: {auth_resp}')
                sys.exit(1)
            print('Authenticated OK.')

            # ── Save to office-panel dashboard ──
            await ws.send(json.dumps({
                'id': 1,
                'type': 'lovelace/config/save',
                'url_path': 'office-panel',
                'config': config
            }, ensure_ascii=False))
            resp = json.loads(await ws.recv())
            if 'error' in resp:
                print(f'ERROR: Save to office-panel failed: {resp["error"]}')
                sys.exit(1)
            print('Saved office-panel: OK')

            # ── Save to main default dashboard (url_path: None) ──
            await ws.send(json.dumps({
                'id': 2,
                'type': 'lovelace/config/save',
                'url_path': None,
                'config': config
            }, ensure_ascii=False))
            resp2 = json.loads(await ws.recv())
            if 'error' in resp2:
                print(f'WARNING: Save to default dashboard (url_path: None) failed: {resp2["error"]}')
            else:
                print('Saved main default dashboard (url_path: None): OK')


            # ── Fire update events ──
            await ws.send(json.dumps({
                'id': 3,
                'type': 'fire_event',
                'event_type': 'lovelace_updated',
                'event_data': {'url_path': 'office-panel'}
            }, ensure_ascii=False))
            await ws.recv()

            await ws.send(json.dumps({
                'id': 4,
                'type': 'fire_event',
                'event_type': 'lovelace_updated',
                'event_data': {'url_path': None}
            }, ensure_ascii=False))
            await ws.recv()


            print('Lovelace update events fired.')

    except (ConnectionRefusedError, OSError) as e:
        print(f'ERROR: Cannot connect to Home Assistant at {ha_ip}:8123')
        print(f'  Detail: {e}')
        sys.exit(1)
    except Exception as e:
        print(f'ERROR: Push failed: {e}')
        sys.exit(1)

    # ── Step 6: Only write files after successful push ──
    with open(source_path, 'w', encoding='utf-8') as f:
        f.write(new_text)
    with open(r'f:\Homeassistant\homeassistant dashboards\office.yaml', 'w', encoding='utf-8') as f:
        f.write(new_text)

    print(f'Push complete. View ID updated to {new_id}.')
    print('Local files updated: office_v6.yaml, office.yaml')


if __name__ == '__main__':
    asyncio.run(push())
