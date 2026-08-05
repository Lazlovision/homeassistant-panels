# AGENTS.md — Home Assistant Crestron Panel Project

> This file MUST be read at the start of every session and after every context compaction.
> It is the single entry point for any AI agent working on this project.

---

## ⚠️ MANDATORY PRE-FLIGHT

Complete these steps **before writing any code**:

1. **Read this entire file** — you are here
2. **Read `crestron_viewport_guide.md`** — viewport specs, shadow DOM architecture, pinning pattern, WebView quirks
3. **Read `LOVELACE_REFERENCE.md`** — CSS/typography standards, zero-flash optimizations
4. **Check `scratch/` for existing scripts** — NEVER write new push or screenshot code
5. **Check `office_v6.yaml` for existing patterns** — reuse existing JS/CSS before writing new
6. **Read `Design/DESIGN.md`** — design tokens, colors, typography spec

**Golden rule: Read existing code and docs before writing anything new.**

---

## 1. Project Overview

This repository manages a **Home Assistant Lovelace dashboard** deployed to a **Crestron TSS-770** (7" touch panel, Android 8.1, Chromium-based WebView, 1280x800 viewport). The dashboard controls office climate, lighting, scenes, and media playback.

**Target device:** Crestron TSS-770 at `10.10.10.100`
**HA instance:** `http://10.10.10.100:8123`
**Panel URL:** `/office-panel`
**HA version:** 2026.7.3

---

## 2. File Hierarchy

### Lead File (ALL edits go here)

```
homeassistant dashboards/
├── office_v6.yaml              ← LEAD FILE. All YAML edits land here.
├── office.yaml                 ← Mirror copy. push_clean_v6.py writes both.
├── rendering_test.yaml         ← Calibration test pattern (do not edit)
├── AGENTS.md                   ← This file
├── crestron_viewport_guide.md  ← Viewport specs, shadow DOM, calibration
├── LOVELACE_REFERENCE.md       ← CSS/typography standards
├── status_summary.md           ← Troubleshooting history
│
├── scratch/                    ← Active utility scripts
│   ├── push_clean_v6.py        ← USE THIS to deploy to panel
│   └── office_ac_entities.json
│
├── Design/                     ← Design system
│   └── DESIGN.md               ← Colors, typography, component specs
│
├── archive/                    ← Old files (do not edit, do not reference)
├── PROGRESS.md                 ← Historical session log (reference only)
├── PROJECT_STATE.md            ← Project state (may be outdated)
└── office_snapshots/           ← Version history (reference only)
```

### Root Level (`F:/Homeassistant/`)

```
F:/Homeassistant/
├── secrets.json                ← HA + panel credentials
├── take_snap.js                ← Chrome headless screenshot (production)
├── take_test_snap.js           ← Chrome headless screenshot (test dashboard)
└── .gitignore / package.json
```

---

## 3. Deploy Workflow (MANDATORY)

**NEVER write your own WebSocket push code.** Always use the existing script.

### Step 1: Edit `office_v6.yaml`

Make changes directly to the file. The push script handles encoding and view ID rotation.

### Step 2: Push via `scratch/push_clean_v6.py`

```powershell
cd "F:/Homeassistant/homeassistant dashboards/scratch"
python push_clean_v6.py
```

This script:
- Reads `office_v6.yaml` as the lead file
- Rotates the view ID (timestamp-based) to force cache invalidation
- Pushes to **both** HA endpoints (`url_path: 'office-panel'` AND `url_path: None`)
- Uses `ensure_ascii=False` to preserve special characters (°, bullets, etc.)
- Writes both `office_v6.yaml` and `office.yaml` **only after successful push**
- Requires `websockets` Python package (`pip install websockets`)

**CRITICAL:** HA serves dashboards from two endpoints. If only one is updated, the panel may continue serving stale cached config.

**If the panel doesn't reload after push:** Power cycle the Crestron panel to clear WebView RAM cache. JavaScript timers and DOM elements persist in memory until the browser session ends.

### Step 3: Verify with Screenshot

```powershell
cd "F:/Homeassistant"
node take_test_snap.js
```

Screenshot saves to `F:/Homeassistant/test_dash_snap.png`.

### Step 4: Physical Panel Verification

For layout/spacing/font/color verification, request a photo of the physical Crestron panel. Chrome screenshots do NOT match the panel pixel-for-pixel (different GPU rasterizer, font engine, WebView wrapper).

---

## 4. Screenshot Workflow (MANDATORY)

**NEVER write your own screenshot code.** Always use the existing scripts.

| Script | Purpose | Output |
|---|---|---|
| `take_snap.js` | Production dashboard screenshot | `F:/Homeassistant/dash_snap.png` |
| `take_test_snap.js` | Test/dashboard screenshot | `F:/Homeassistant/test_dash_snap.png` |

Both scripts:
- Launch headless Chrome at 1280x800 (`C:\Program Files\Google\Chrome\Application\chrome.exe`)
- Auto-login via shadow DOM walk + credential injection
- Navigate to `/office-panel`
- Wait 8s for layout to settle, then capture PNG
- Use portable temp paths, 30s timeout, and auto-cleanup
- Require `ws` Node.js package (`npm install ws`)

---

## 5. Git Conventions

- **Branch:** `main`
- **Remote:** `https://github.com/Lazlovision/homeassistant-panels.git`
- **Tag before risky changes:** `git tag -a pre_<description> -m "..."`
- **Commit after each logical change** with descriptive messages
- **Push after committing** unless explicitly told not to

---

## 6. Critical Knowledge

### 6.1 Dashboard Architecture

The dashboard uses a **`type: panel`** view with a single root `vertical-stack` card that fills the entire viewport. Inside:

```
vertical-stack (root, fills 100vh)
├── horizontal-stack (main content, flex: 1)
│   ├── vertical-stack (left column: header, scenes, lights)
│   │   ├── button-card (header row with weather/PM2.5 pills + JS)
│   │   ├── horizontal-stack (3 scene buttons: DAY/NIGHT/SLEEP)
│   │   └── vertical-stack (light cards with brightness sliders)
│   └── button-card (right column: HVAC card with SVG dial)
└── button-card (media bar, 80px fixed height)
```

The YAML has `kiosk_mode: { kiosk: true, hide_header: true, hide_sidebar: true }` at the top level.

### 6.2 JavaScript Template Compatibility

The Crestron WebView (Chromium v87+) throws syntax errors on modern JS inside `[[[ ]]]` button-card templates:

```javascript
// ✅ GOOD — explicit ES5 null checks
(states['x'] ? states['x'].state : 'off')
(s && s.attributes && s.attributes.brightness) ? s.attributes.brightness : 0

// ❌ BAD — optional chaining / nullish coalescing
states['x']?.state ?? 'off'
s.attributes?.brightness ?? 0
```

**Also avoid:** `const`/`let` in some contexts, `async/await` in templates, arrow functions in inline handlers. Use `var`, `function()`, and plain callbacks.

### 6.3 Touch Event Handling

**NEVER use `ontouchstart` to fire service calls.** On the Crestron WebView, `ontouchstart` fires before the touch gesture completes, causing unintended triple-fire when combined with `onclick` and `ontouchend`. Use `ontouchend` for touch interactions (with `event.stopPropagation()`). If both `onclick` and `ontouchend` are used on the same element, always include a debounce guard (see §6.8).

**Rule:** Use `ontouchend` with debounce guards for touch-interactive elements. Always include `event.stopPropagation()` to prevent event bubbling to parent cards. The `ontouchstart` event should only be used for visual press feedback (e.g., `scale(0.85)`) — never for service calls.

**Backdrop-filter quirk:** Elements with `backdrop-filter: blur()` create a GPU compositing layer on the Crestron WebView that **blocks touch events from bubbling to `document`**. If a full-screen overlay uses blur, bind touch/click handlers directly to the overlay element itself — never rely on `document.addEventListener('touchstart', ...)`.

### 6.4 State Access: `states` vs `window.hass` (`window._getHass()`)

Two ways to access Home Assistant state in JS templates:

```javascript
// `states` — snapshot at template render time (static)
var temp = states['climate.air_conditioner_office_climate'].attributes.current_temperature;

// `window._getHass()` — live runtime object (for event handlers)
// CRITICAL: NEVER cache `window._hass` globally! Always call window._getHass() dynamically at event time!
var h = window._getHass();
if (h) {
  h.callService('climate', 'set_temperature', { entity_id: 'climate.air_conditioner_office_climate', temperature: 22 });
}
```

Use `states` for rendering. Use `window._getHass()` for service calls in event handlers. Never save `window._hass = ...` on global window.

### 6.5 Card Reactivity: `triggers_update`

Button-cards only re-render when their own entity changes. To react to other entities, list them:

```yaml
triggers_update:
  - climate.air_conditioner_office_climate
  - sensor.air_conditioner_office_outside_air_temp
  - sun.sun
```

### 6.6 Pointer Events Pattern

Cards set `pointer-events: 'none'` at the card level and `pointer-events: 'auto'` on interactive `custom_fields` to prevent accidental card taps from interfering with custom UI:

```yaml
styles:
  card:
    - pointer-events: 'none'
custom_fields:
  hvac_panel:
    - pointer-events: 'auto'
```

### 6.7 Day/Night Theme Switching

All JS templates determine theme at render time:

```javascript
var isNight = states['sun.sun'] ? states['sun.sun'].state === 'below_horizon' : false;
var bgColor = isNight ? 'rgba(26, 26, 36, 0.95)' : '#FFFFFF';
var textColor = isNight ? '#FFFFFF' : '#1C1C1E';
```

The root `card_mod` also uses Jinja templates for theme-aware CSS variables. See `office_v6.yaml` lines 1-80 for the full variable set.

### 6.8 Debouncing Pattern

Rapid touch controls use window-level debounce flags to prevent double service calls:

```javascript
if (window._climDB) return;
window._climDB = true;
setTimeout(function() { window._climDB = false; }, 400);
```

Different controls use different flag names (`_climDB`, `_modeDB`, `_fanDB`, `_ppDB`, etc.).

### 6.9 Popup Overlay Pattern

Custom modals are created as `div` elements appended to `document.body` with `z-index: 99999`:

```javascript
var modal = document.createElement('div');
modal.id = 'custom_popup_id';
modal.style.cssText = 'position:fixed; top:0; left:0; width:100vw; height:100vh; z-index:99999; ...';
modal.ontouchend = function(ev) { if (ev.target === modal) modal.remove(); };
document.body.appendChild(modal);
```

Existing popups: `window.openMitsubishiPopup`, `window.openWeatherPopup`, `window.openBlueairPopup`.

### 6.10 Viewport Pinning

The three-pronged pattern (global CSS injection + recursive shadow DOM traversal + MutationObserver) pins the layout to 100vh. See `crestron_viewport_guide.md` §8 for the full pattern. **Do not re-derive from scratch.**

### 6.11 Dialog Theme Injection

A self-contained IIFE injects theme CSS variables into HA's more-info dialog shadow roots on `hass-more-info`, `click`, and `touchend` events. Guards against double-attachment with `window._haDialogThemeListenerAttached`.

### 6.12 Font Rendering

Google Fonts (Hanken Grotesk / Inter) render ~5% wider under Android FreeType than Windows Chrome. Compact pill paddings by 3-5% on the panel. Use `max-width` constraints to prevent overflow.

### 6.13 UTF-8 Encoding

When pushing YAML via WebSocket, `ensure_ascii=False` in JSON serialization is required to preserve degree symbols (°), bullets, and other special characters.
### 6.14 Full-Screen Overlays (Screensaver Pattern)

Full-screen overlays appended to `document.body` have specific requirements on the Crestron WebView:

**Touch and Mouse handlers:** Bind `touchend` and `mouseup` directly to the overlay element. **NEVER use `onclick`, `touchstart`, or `mousedown` for dismiss handlers.** 
- Crestron's native app wrapper dispatches physical touches with `event.isTrusted === false` — **NEVER filter on `event.isTrusted`**.
- Chromium WebView dispatches synthetic `click` events on DOM text updates (e.g. clock minute changes). Listening to `touchend` and `mouseup` prevents synthetic clock ticks from auto-dismissing the screensaver.
- Add a 1.5-second showTime guard (`if (window._ssShowTime && Date.now() - window._ssShowTime < 1500) return;`) to filter layout/render mutation events when the overlay first appears.
- Set `pointer-events: none` on inner text/icon column wrappers (`leftCol` and `rightCol`) so clicks or taps anywhere on the screen land directly on `overlay`.

**Global Window State:** Store all state flags on `window` (`window._ssIsVisible`, `window._ssIsDismissing`, `window._ssIdleTimer`, `window._ssUpdateTimer`) rather than closure-scoped variables to ensure document-level activity listeners and overlay dismiss handlers share identical state.

**MutationObserver Isolation:** Filter out mutations inside `#screensaver_overlay` in the global `MutationObserver` callback to prevent continuous layout thrashing and main-thread starvation.

**Timers:** Use `setInterval` (30s) for periodic updates. Always `clearInterval` and set timer handles to `null` on hide/dismiss.

**State access:** For periodic updates, always grab fresh state from `window.hass` inside the render function. Capturing `states` in a closure at init time freezes the data.

**Version guard:** Use `window._ssInitialized` + `window._ssVersion` to prevent duplicate initialization. Bump the version number on every code change to force re-initialization.

**Sleep wake recovery:** Listen for `visibilitychange` to handle wake cycles. If already initialized (`window._ssInitialized`), ignore spurious visibility events.

**Popup awareness:** Check for open popups before showing. Existing popup IDs: `custom_mitsubishi_popup_overlay`, `custom_weather_popup_overlay`, `custom_blueair_popup_overlay`.

---

## 7. Secrets

Credentials are in `F:/Homeassistant/secrets.json`:

```json
{
  "HA_IP": "10.10.10.100",
  "HA_PORT": "8123",
  "HA_TOKEN": "long-lived access token",
  "PLEX_TOKEN": "for media metadata",
  "PANEL_USER": "office_panel",
  "PANEL_PASS": "..."
}
```

- Push script uses: `HA_IP`, `HA_TOKEN`
- Screenshot scripts use: `HA_IP`, `PANEL_USER`, `PANEL_PASS`
- Media bar uses: `PLEX_TOKEN` (hardcoded in YAML as `YOUR_PLEX_TOKEN`)

Never hardcode credentials. The push script reads `secrets.json` automatically.

---

## 8. Anti-Patterns (DO NOT DO)

| Anti-Pattern | Correct Approach |
|---|---|
| Writing new WebSocket push code | Use `scratch/push_clean_v6.py` — check `scratch/` first |
| Writing new screenshot code | Use `take_snap.js` or `take_test_snap.js` — check root `F:/Homeassistant/` first |
| Solving a problem from scratch | Check existing code and docs first — the solution likely already exists |
| Editing `office.yaml` directly | Edit `office_v6.yaml` (lead file) |
| Using `ontouchstart` for service calls | Use `ontouchend` with debounce guard; `ontouchstart` only for visual feedback |
| Using `?.` or `??` in JS templates | Use explicit ES5 null checks: `(x && x.attr) ? x.attr : default` |
| Using `const`/`let`/`async`/arrow fns in templates | Use `var`, `function()`, plain callbacks |
| Binding touch handlers to `document` for blurred overlays | Bind directly to the overlay element — `backdrop-filter` blocks bubbling |
| Editing files in `archive/` | Work only with active files |
| Recursive `setTimeout(arguments.callee, N)` for periodic updates | Use `setInterval` — recursive setTimeout dies on Crestron WebView |
| Pinning layout via `setTimeout` at one shadow DOM depth | Use recursive `queryDeep`, global CSS injection, and `MutationObserver` (crestron_viewport_guide.md §8) |
| Forgetting `triggers_update` for cross-entity reactivity | List all entities whose changes should trigger re-render |
| Forgetting `event.stopPropagation()` on nested touch handlers | Always stop propagation to prevent parent card taps |
| Using `ontouchstart` to fire service calls in button-card | Use `ontouchend` + debounce, `ontouchstart` only for press animation |
| Calling `h.callService` without checking `h` exists | Always: `var h = window.hass || (document.querySelector('home-assistant')&&document.querySelector('home-assistant').hass); if(h){...}` |
| Creating popups without removing old ones | Always check and remove: `var old = document.getElementById(id); if(old) old.remove();` |

---

## 9. Quick Reference Commands

```powershell
# Push dashboard to panel
cd "F:/Homeassistant/homeassistant dashboards/scratch"
python push_clean_v6.py

# Take production screenshot
cd "F:/Homeassistant"
node take_snap.js

# Take test dashboard screenshot
cd "F:/Homeassistant"
node take_test_snap.js

# Check git status
cd "F:/Homeassistant/homeassistant dashboards"
git status --short

# Tag before risky change
git tag -a pre_<description> -m "Backup before <change>"

# Revert to tag
git reset --hard <tag_name>
```

---

## 10. Troubleshooting

- **Buttons not clickable after push:** See `status_summary.md` — likely WebView RAM cache. Power cycle the panel.
- **Layout shifted after refresh:** Viewport pinning issue. See `crestron_viewport_guide.md` §8.
- **Colors/fonts look wrong in screenshots:** Expected. Chrome ≠ Crestron WebView. See `crestron_viewport_guide.md` §5.
- **Push script fails:** Check `secrets.json` has valid `HA_TOKEN`. Check HA is reachable at `ws://10.10.10.100:8123`.
- **Text overflow on panel:** Android FreeType renders fonts 3-5% wider. Reduce padding or font size slightly.
- **Screensaver doesn't dismiss on touch:** Check that touch handlers are bound to the overlay element, not `document`. `backdrop-filter: blur()` blocks bubbling. Also verify `mousedown` listener is present (Crestron may send mouse events).
- **Popup not themed correctly:** Check dialog theme injection is firing. See §6.11.
- **Card not updating when entity changes:** Check `triggers_update` lists the entity. See §6.5.
- **Panel not reflecting pushed changes:** The `push_clean_v6.py` script auto-increments the view ID with a timestamp each push, which normally forces the Crestron WebView to reload. If the panel still shows the old dashboard after a push, wait ~10 seconds then try again. As a last resort, unplug/replug the panel (WebView caches aggressively).
---

## 11. When in Doubt

1. Read `crestron_viewport_guide.md` for viewport/architecture details
2. Read `LOVELACE_REFERENCE.md` for CSS/typography standards
3. Read `Design/DESIGN.md` for design tokens and component specs
4. Check `office_v6.yaml` for existing patterns before writing new code
5. Check `archive/` if you need to recover an old file
6. Ask the user before destructive operations or creating new scripts
