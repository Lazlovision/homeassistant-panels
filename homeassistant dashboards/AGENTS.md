# AGENTS.md — Home Assistant Crestron Panel Project

> **Read this file at the start of every session.** It contains the project conventions, tooling, and workflows required to work on this codebase.

---

## 1. Project Overview

This repository manages a **Home Assistant Lovelace dashboard** deployed to a **Crestron TSS-770** (7" touch panel, Android 8.1, Chromium WebView v87+, 1280x800 viewport). The dashboard controls office climate, lighting, scenes, and media playback.

**Target device:** Crestron TSS-770 at `10.10.10.100`
**HA instance:** `http://10.10.10.100:8123`
**Panel URL:** `/office-panel`

---

## 2. File Hierarchy — What Matters

### Lead File (ALL edits go here)

```
homeassistant dashboards/
├── office_v6.yaml          ← LEAD FILE. All YAML edits land here.
├── office.yaml             ← Mirror copy. push_clean_v6.py writes both.
├── rendering_test.yaml     ← Calibration test pattern (do not edit)
├── crestron_viewport_guide.md  ← CRITICAL: viewport specs, calibration results
├── LOVELACE_REFERENCE.md   ← Standards manual (viewport pinning, typography)
├── AGENTS.md               ← This file
│
├── scratch/                ← Active utility scripts
│   ├── push_clean_v6.py    ← USE THIS to deploy to panel
│   ├── build_clean_v6_yaml.py
│   └── build_perfect_v6_stretch.py
│
├── archive/                ← Old files (do not edit, do not reference)
│   ├── dashboards/         ← Stale YAML versions
│   ├── scratch/            ← One-off diagnostic scripts
│   └── root/               ← Old root-level scripts
│
├── Design/                 ← Mockups (reference only)
└── office_snapshots/       ← Version history (reference only)
```

### Root Level (`F:/Homeassistant/`)

```
F:/Homeassistant/
├── secrets.json            ← HA credentials (HA_IP, PANEL_USER, PANEL_PASS, HA_TOKEN)
├── take_snap.js            ← Chrome headless screenshot (production dashboard)
├── take_test_snap.js       ← Chrome headless screenshot (test dashboard)
├── .gitignore
└── package.json / package-lock.json
```

---

## 3. Deploy Workflow (MANDATORY)

**NEVER write your own WebSocket push code.** Always use the existing scripts.

### Step 1: Edit `office_v6.yaml`

Make changes directly to the file. The push script handles encoding and view ID rotation.

### Step 2: Push via `scratch/push_clean_v6.py`

```powershell
cd "F:/Homeassistant/homeassistant dashboards/scratch"
python push_clean_v6.py
```

This script:
- Reads `office_v6.yaml` as the lead file
- Rotates the view ID to force cache invalidation
- Writes both `office_v6.yaml` and `office.yaml`
- Pushes to HA via WebSocket (`lovelace/config/save`)
- Fires `lovelace_updated` events for the panel to refresh

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
| `take_snap.js` | Production dashboard screenshot | `dash_snap.png` |
| `take_test_snap.js` | Test/dashboard screenshot | `test_dash_snap.png` |

Both scripts:
- Launch headless Chrome at 1280x800
- Auto-login via the HA login form
- Navigate to `/office-panel`
- Wait for layout to settle
- Capture PNG screenshot

---

## 5. Git Conventions

- **Branch:** `main`
- **Remote:** `https://github.com/Lazlovision/homeassistant-panels.git`
- **Tag before risky changes:** `git tag -a pre_<description> -m "..."`
- **Commit after each logical change** with descriptive messages
- **Push after committing** unless explicitly told not to

---

## 6. Critical Knowledge

### Viewport Pinning (from LOVELACE_REFERENCE.md)

The root `:host` vertical-stack MUST specify:
```css
position: fixed !important;
top: 0 !important;
left: 0 !important;
width: 100vw !important;
height: 100vh !important;
z-index: 1 !important;
transform: translateZ(0) !important;
```

### Touch Event Handling (CALIBRATION FINDING)

**NEVER use both `onclick` AND `ontouchend` on the same element.** On the Crestron WebView, a single touch fires `ontouchend` first, then `onclick` ~200ms later, causing double-fire bugs.

**Rule:** Use `ontouchend` only for touch-interactive elements. The WebView synthesizes touch events for all interactions.

### Font Rendering

Google Fonts (Hanken Grotesk / Inter) render ~5% wider under Android FreeType than Windows Chrome. Compact pill paddings by 3-5% on the panel. Use `max-width` constraints to prevent overflow.

### JavaScript Template Compatibility

Embedded WebView throws syntax errors on optional chaining (`?.`) or nullish coalescing (`??`) inside JS template strings. Always use explicit ES5 null checks:
```javascript
// GOOD
(states['x'] ? states['x'].state : 'off')
// BAD
states['x']?.state ?? 'off'
```

### Button-Card Shadow DOM

`margin-top: auto` does NOT work inside `custom:button-card` shadow DOM on the Crestron WebView. Use `justify-content: space-between` on the parent flex container instead.

### UTF-8 Encoding

When pushing YAML via WebSocket, ensure `ensure_ascii=False` in JSON serialization to preserve degree symbols (°), bullets (*), and other special characters.

---

## 7. Secrets

Credentials are in `F:/Homeassistant/secrets.json`:
```json
{
  "HA_IP": "10.10.10.100",
  "PANEL_USER": "office_panel",
  "PANEL_PASS": "...",
  "HA_TOKEN": "..."
}
```

The push script reads this file automatically. Never hardcode credentials.

---

## 8. Anti-Patterns (DO NOT DO)

| Anti-Pattern | Correct Approach |
|---|---|
| Writing new WebSocket push code | Use `scratch/push_clean_v6.py` |
| Writing new screenshot code | Use `take_snap.js` or `take_test_snap.js` |
| Editing `office.yaml` directly | Edit `office_v6.yaml` (lead file) |
| Using `onclick` + `ontouchend` together | Use `ontouchend` only |
| Using `?.` or `??` in JS templates | Use explicit `? :` null checks |
| Using `margin-top: auto` in button-card | Use `justify-content: space-between` |
| Trusting Chrome screenshots for layout | Verify on physical panel |
| Editing files in `archive/` | Work only with active files |

---

## 9. Quick Reference Commands

```powershell
# Push dashboard to panel
cd "F:/Homeassistant/homeassistant dashboards/scratch"
python push_clean_v6.py

# Take screenshot
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

## 10. When in Doubt

1. Read `crestron_viewport_guide.md` for viewport/architecture details
2. Read `LOVELACE_REFERENCE.md` for CSS/typography standards
3. Check `archive/` if you need to recover an old file
4. Ask the user before destructive operations or creating new scripts
