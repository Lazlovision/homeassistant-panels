# Office Dashboard — Project State

> Single source of truth. Updated after every meaningful change.

## What We're Building

A Home Assistant dashboard matching the mockup exactly: `mockup.png` in this folder.

**Mockup anatomy:**
- **Top bar:** Room name ("Living Room"), device count, security status, weather pill, settings icon
- **Scenes row:** 4 large rounded-square buttons (Arrive=blue, Movie=orange, Leave=red, Sleep=green) with emoji icons
- **Lights section:** 2x2 grid of light cards, each with icon, name, status%, toggle switch, brightness slider
- **Thermostat:** Tall card on right side with "THERMOSTAT" label, circular gradient dial, status pill, +/- controls, fan/outside info
- **Music bar:** Full-width bottom bar with album art, song info, playback controls, volume slider

**Design system:** Dark glassmorphism. Background `#151518` or `#000`. Cards `rgba(255,255,255,0.04-0.05)`. Border `rgba(255,255,255,0.07)`. Cyan accent `#00B0DF`/`#00E5FF`. Font: Outfit or Hanken Grotesk. 16px border radius on cards.

See `Design/DESIGN.md` for full design spec.

---

## Environment

| Item | Value |
|------|-------|
| HA URL | `http://YOUR_HA_IP:8123` |
| HA Version | 2026.4.4 |
| Dashboard | `office-panel` (storage mode, `lovelace.office_panel`) |
| Deploy | WebSocket `lovelace/config/save` with access token |
| Browser login | `office_panel` / `office123` (shadow DOM walk + coordinate click) |
| Access token | `YOUR_HA_LONG_LIVED_TOKEN` |
| HA config dir | `\\obelisk\docker\homeassistant` |
| Local mirror | `F:/Homeassistant/homeassistant dashboards/` |

---

## Available Entities

From `live_config.json` (your actual HA installation):

### Lights (2)
- `light.office_main_lights` — Office main overhead lights
- `light.office_nanol` — Nanoleaf wall panel

### Scenes (4)
- `scene.office_arrive` — Arrive scene
- `scene.office_movie` — Movie scene
- `scene.office_leave` — Leave scene
- `scene.office_sleep` — Sleep scene

### Climate (1)
- `climate.air_conditioner_office_climate` — Office AC unit

### Sensors (2)
- `sensor.air_conditioner_office_outside_air_temp` — Outside temperature
- `weather.forecast_home` — Weather/forecast

### Media Player (0 in live config)
- No media player entities found in live config. Music bar will need a placeholder or entity added to HA.

### Notable Gap
Mockup shows 4 lights (Ceiling Lights, Floor Lights, Chandelier, Accent Wall). We only have 2. Need to either add more light entities to HA or use placeholders.

---

## File Inventory

| File | Purpose | Status |
|------|---------|--------|
| `office_v6.yaml` | V6 release matching mockup.png | **ACTIVE** — deployed to HA |
| `office_v5.yaml` | Gemini/local LLM attempt | Obsolete reference |
| `office_v4.yaml` | Previous deployed version | Obsolete |
| `office_v3_fixed.yaml` | Previous custom thermostat attempt | Obsolete |
| `office_gemini.yaml` | Gemini's native thermostat version | Reference |
| `collapse-sidebar.js` | JS module to hide sidebar in kiosk mode | Deployed to HA |
| `live_config.json` | HA config export with entities | Reference |
| `mockup.png` | Target design | **THE TRUTH** |
| `Design/DESIGN.md` | Full design system spec | Reference |
| `PROGRESS.md` | Historical session log | Reference |
| `PROJECT_STATE.md` | This file | **AUTHORITATIVE** |

---

## Current Dashboard State

**Architecture:** Single Unified HTML Card Template (`custom_fields.hvac_panel`) with Expanded Ergonomic Button Targets

**Functional Rollback Backup Available:**
- [office_v6_working_backup.yaml](file:///f:/Homeassistant/homeassistant%20dashboards/office_v6_working_backup.yaml)
- [build_clean_v6_yaml_backup.py](file:///f:/Homeassistant/homeassistant%20dashboards/scratch/build_clean_v6_yaml_backup.py)

**Visual Layout Verification (100% Resolved & Proportioned)**:
- **Expanded Touch Targets**: Scaled System Mode buttons to **`68px`** height (`20px` bold font) and Fan Speed buttons to **`64px`** height (`18px` bold font).
- **Eliminated Dead Space**: Re-balanced vertical gaps so `SYSTEM MODE` sits comfortably below `SET POINT` without awkward empty gaps.
- **Zero Collision**: Maintained 6px padding between status pill (`💧 DRY (IDLE)`) and target setpoint banner (`24°` + `SET POINT`).

---

## What's Been Tried

### Prior Sessions (June 2026)
- Multiple iterations (v1-v3) with custom button-card thermostat implementations
- All failed to match mockup visually
- Gemini succeeded with native `type: thermostat` card + CSS theming

### Current Session (July 17, 2026)
- v4: Complete rewrite from scratch matching mockup layout
- v4.1-v4.4: Fixed `[object Object]` errors, grid areas, flex layout issues
- v4.5: Switched to vertical-stack root, merged duplicate YAML keys
- Sidebar collapse attempted via JS module (`collapse-sidebar.js`) — works after HA restart
- Theme file (`kiosk_panel.yaml`) created but sidebar still visible

### Key Failure Modes
1. **Claiming "done" without screenshot verification** — YAML looked correct but rendered wrong
2. **button-card grid areas unreliable** — custom_fields don't place where expected
3. **YAML duplicate keys silently overwrite** — two `custom_fields:` blocks, second wins
4. **horizontal-stack fights flex overrides** — vertical-stack is the correct root
5. **JS templates with CSS vars break** — `var(--name)` doesn't work in JS string context
6. **Emoji in button-card `icon` field** — tries MDI lookup, use `custom_fields` HTML instead

---

## Known Working Patterns

### Deployment
```python
# WebSocket push (works in eval kernel with top-level await)
ws = await websockets.connect("ws://YOUR_HA_IP:8123/api/websocket")
await ws.recv()
await ws.send(json.dumps({"type": "auth", "access_token": TOKEN}))
await ws.recv()
await ws.send(json.dumps({
    "id": 1, "type": "lovelace/config/save",
    "url_path": "office-panel", "config": config_dict
}))
result = json.loads(await ws.recv())
```

### Browser Login
```javascript
// Shadow DOM walk for credentials
const inputs = [];
function walk(el, d = 0) {
  if (d > 15 || !el) return;
  if (el.tagName === 'INPUT' && (el.type === 'text' || el.type === 'password'))
    inputs.push(el);
  for (const c of el.children || []) walk(c, d + 1);
  if (el.shadowRoot)
    for (const c of el.shadowRoot.children || []) walk(c, d + 1);
}
walk(document.body);
inputs[0].value = 'office_panel';
inputs[0].dispatchEvent(new InputEvent('input', { bubbles: true, composed: true }));
inputs[1].value = 'YOUR_PASSWORD';
inputs[1].dispatchEvent(new InputEvent('input', { bubbles: true, composed: true }));
// Then: page.mouse.click(640, 560) for login button
```

### Dashboard Structure
- Root: `type: vertical-stack` (not horizontal-stack)
- Panel view: `type: panel`
- Card wrapper: `ha-card { background: #000; border: none; height: 100vh }`
- Root flex: `#root { display: flex; flex-direction: column; height: 100%; padding: 12px 20px; gap: 10px }`

### Scene Buttons
- Use `custom_fields` with HTML `<span>` for emoji (not `icon` field)
- Single custom_field with full HTML layout for control
- `tap_action: call-service` with `scene.turn_on`

### Thermostat
- Use native `type: thermostat` card
- Theme via CSS variables: `--state-climate-cool-color`, etc.

### Light Cards
- Toggle via `tap_action: toggle`
- Brightness via JS template: `states['light.xxx'].attributes.brightness`

---

## Lessons Learned (Consolidated)

1. **Use native HA cards first** — thermostat card > custom button-card
2. **CSS custom properties at root** — define once, reference with `var()`
3. **button-card defaults suffice** — no explicit `grid_template_areas` needed for simple layouts
4. **`<ha-icon>` over emoji in JS** — consistent MDI rendering
5. **horizontal-stack flex via card_mod** — `:host { flex: 1 }` on children
6. **Screenshot to verify** — YAML structure ≠ rendered layout
7. **Pull live config when files diverge** — WebSocket `lovelace/config`
8. **button-card `icon` is MDI-only** — use `custom_fields` HTML for emoji
9. **custom_fields need grid areas** — won't render without `grid: grid-template-areas`
10. **No custom HTML elements in markdown** — `<ha-label>` produces `[object Object]`
11. **vertical-stack is correct root** — horizontal-stack fights flex overrides
12. **YAML duplicate keys overwrite silently** — merge into single block
13. **Grid areas unreliable for custom_fields** — single custom_field with full HTML is better
14. **JS templates can't use CSS vars** — hardcode colors in JS string context

---

## Action Plan

### Phase 1: Foundation (Do First)
- [ ] Pull current live config from HA to understand what's actually deployed
- [ ] Verify sidebar collapse works (JS module + restart)
- [ ] Confirm WebSocket deploy pipeline still works

### Phase 2: Layout Structure
- [ ] Build correct root layout: vertical-stack with proper sections
- [ ] Top bar: room name + device count + security status + weather + settings
- [ ] Scenes row: 4 large buttons with colored backgrounds
- [ ] Main content: horizontal split (lights grid left, thermostat right)
- [ ] Music bar: full-width bottom

### Phase 3: Component Details
- [ ] Scene buttons: large, rounded, colored, with emoji icons
- [ ] Light cards: 2x2 grid, toggle switches, brightness sliders
- [ ] Thermostat: tall card, circular dial, +/- controls
- [ ] Music bar: album art, song info, playback controls

### Phase 4: Verification
- [ ] Deploy each section, screenshot, compare to mockup
- [ ] Iterate on visual differences
- [ ] Final polish: colors, spacing, typography

### Phase 5: Cleanup
- [ ] Update PROGRESS.md with final state
- [ ] Clean up obsolete YAML files
- [ ] Document final entity mapping

---

## Rules for This Project

1. **Screenshot before claiming done.** YAML ≠ rendered result.
2. **One section at a time.** Deploy, verify, move on. Don't rewrite everything at once.
3. **Match the mockup pixel-for-pixel where possible.** Colors, sizes, spacing.
4. **Use native cards first.** Custom button-card only when native can't do it.
5. **No guessing entity IDs.** Check live config.
6. **No restyling without user approval.** Stick to the design spec.
7. **Update this file after every deployment.** Keep it authoritative.
