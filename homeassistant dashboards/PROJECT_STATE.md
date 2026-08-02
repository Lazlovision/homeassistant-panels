# Office Dashboard — Project State

> Single source of truth. Updated after every meaningful change.
> Last updated: 2026-08-02

---

## What We're Building

A Home Assistant dashboard for a Crestron TSS-770 office panel: climate control, lighting, scenes, media playback, weather, and air quality monitoring.

**Design system:** Dark/light auto-switching based on `sun.sun`. See `Design/DESIGN.md` for full spec.

---

## Environment

| Item | Value |
|------|-------|
| HA URL | `http://10.10.10.100:8123` |
| HA Version | 2026.4.4 |
| Panel | Crestron TSS-770 at `10.10.10.100` (1280x800, Android 8.1, WebView v87+) |
| Dashboard URL | `/office-panel` |
| Deploy | `scratch/push_clean_v6.py` (WebSocket `lovelace/config/save`) |
| Credentials | `F:/Homeassistant/secrets.json` |

---

## Available Entities

### Lights (2)
- `light.office_main_lights` — Office main overhead lights
- `light.nanoleaf_light_panels_51_c8_ca_2` — Nanoleaf wall panel

### Climate (1)
- `climate.air_conditioner_office_climate` — Office Mitsubishi AC unit

### Sensors (4)
- `sensor.air_conditioner_office_outside_air_temp` — Outside temperature
- `sensor.air_conditioner_living_room_input_power` — AC power consumption
- `sensor.office_air_purifier_pm_2_5` — PM2.5 air quality
- `weather.forecast_home` — Weather/forecast

### Selects/Switches/Binary Sensors (AC controls)
- `select.air_conditioner_office_vertical_vane` — Vane position
- `binary_sensor.air_conditioner_office_i_see_sensor` — i-SEE occupancy
- `switch.air_conditioner_office_night_mode` — Night mode toggle

### Air Purifier
- `fan.office_air_purifier_fan` — Blueair fan (auto/night/off/speeds)
- `sensor.office_air_purifier_pm_1`, `sensor.office_air_purifier_pm_10` — PM readings
- `sensor.office_air_purifier_filter_life` — Filter health %
- `switch.office_air_purifier_child_lock` — Child lock
- `light.office_air_purifier_led_light` — LED display

### Media Player
- `media_player.the_moon` — Plex media player (with fallback to `media_player.living_room_speaker`)

---

## File Inventory

| File | Purpose | Status |
|------|---------|--------|
| `office_v6.yaml` | Current dashboard | **ACTIVE** — deployed to HA |
| `office.yaml` | Mirror copy (push script writes both) | Auto-synced |
| `AGENTS.md` | AI agent entry point | **PRIMARY DOC** |
| `crestron_viewport_guide.md` | Viewport specs, shadow DOM, calibration | **CRITICAL REF** |
| `LOVELACE_REFERENCE.md` | CSS/typography standards | Reference |
| `status_summary.md` | Troubleshooting history | Reference |
| `Design/DESIGN.md` | Design system (colors, typography, components) | Reference |
| `scratch/push_clean_v6.py` | Deploy script | **ACTIVE** |
| `archive/` | Old files | Do not edit |

---

## Current Dashboard Architecture

**Root:** `type: vertical-stack` with `card_mod` viewport pinning
**View:** `type: panel` with `kiosk_mode`

### Layout Structure
```
vertical-stack (root, fills 100vh)
├── horizontal-stack (main content, flex: 1)
│   ├── vertical-stack (left column)
│   │   ├── button-card (header: "Office" + weather pill + PM2.5 pill)
│   │   ├── horizontal-stack (scenes: DAY / NIGHT / SLEEP)
│   │   └── vertical-stack (lights: Ceiling Lights + Nanoleaf)
│   └── button-card (right column: HVAC card with SVG dial)
└── button-card (media bar, 80px fixed height)
```

### Key Features
- **Header bar:** Room name (tap for page reload), weather pill (tap for popup), PM2.5 pill (tap for popup)
- **Scene buttons:** DAY (lights on, AC cool 21.5°), NIGHT (Nanoleaf on, AC auto 21.5°), SLEEP (all off, AC 22.5°)
- **Light cards:** Toggle + brightness slider with live percentage readout
- **HVAC card:** SVG arc dial showing current temp, +/- buttons, mode selection (cool/heat/auto/dry/fan/off), fan speed, outside temp
- **Mitsubishi AC popup:** Detailed controls (vane, mode, fan, i-SEE, night mode, power)
- **Weather popup:** 5-day forecast, humidity, wind, pressure, UV, sunrise/sunset, dew point
- **Blueair popup:** PM1/PM2.5/PM10, filter health, fan modes, LED toggle, child lock
- **Media bar:** Play/pause, skip, seek slider, volume slider, Plex metadata
- **Dialog theme injection:** More-info dialogs themed to match day/night

---

## Known Working Patterns

See `AGENTS.md` §6 for the full catalog of working patterns.

---

## Known Issues & Resolutions

See `status_summary.md` for the troubleshooting history.

### Resolved Issues
1. **Screensaver overlay blocking touches** — `event.stopPropagation()` consumed all taps. Removed screensaver code (commit `6ed68b5`).
2. **Wrong HA endpoint** — push script was updating `office-panel` but HA also served from default endpoint. Fixed: push to both endpoints.
3. **WebView RAM cache** — old JavaScript stayed running until power cycle. Fix: power cycle panel after push.

---

## Rules for This Project

1. **Screenshot before claiming done.** YAML ≠ rendered result.
2. **Read AGENTS.md first.** It has all critical knowledge.
3. **Reuse existing patterns.** Check `office_v6.yaml` before writing new code.
4. **Use ES5 JavaScript in templates.** No `?.`, `??`, `const`, `let`, `async/await`, or arrow functions.
5. **Use `ontouchend` only.** Never `onclick` on touch targets.
6. **Always `event.stopPropagation()`.** Prevent parent card tap interference.
7. **Test on physical panel.** Chrome screenshots ≠ Crestron WebView.
