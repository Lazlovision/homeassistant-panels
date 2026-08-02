# Dashboard Status Summary

> Cross-reference: See `AGENTS.md` §10 (Troubleshooting) for links to this file.

## Date: 2026-08-02

## Current Issue

**Buttons on the Crestron TSS-770 panel are not clickable.** Users report a "blue flash" appears when touching anywhere on the screen, and button interactions do not register.

## What We Know

### Dashboard Configuration

- **Mode**: YAML mode (configured in `dashboards-config-snippet.yaml`)
- **File**: `dashboards/office.yaml` on HA's filesystem
- **Path**: `/office-panel`
- **Panel**: Crestron TSS-770 at 10.10.10.100

### Push Mechanism Problem

The `push_clean_v6.py` script uses `lovelace/config/save` WebSocket command, which:

- Returns success (`{"success": true}`)
- **Does not actually update YAML-mode dashboards**
- The view ID on HA remains unchanged after push

**Verified**: HA serves view ID `office_view_v6_clean_v6_88_1785605641` even after pushes claiming newer IDs.

### Versions Tested

| Attempt | Result |
|---------|--------|
| Commit 97bcf56 (known working) | Buttons still not clickable |
| Screensaver code removed (1727 lines) | Buttons still not clickable |
| Multiple re-pushes with view ID rotation | Panel reloads but buttons remain broken |

### Blue Flash Behavior

- Occurs on ANY touch, regardless of location
- Persists across power cycles
- Not caused by browser caching (panel restart doesn't fix)
- Likely the screensaver overlay becoming visible and blocking interactions

## Root Cause Analysis

### Theory 1: Screensaver Overlay Interference

The screensaver code (lines 231-432 in 97bcf56) creates a full-screen overlay that:

- Starts hidden with `display: none`
- Becomes visible after 5 seconds of inactivity
- Has `pointer-events: none` when hidden, `auto` when visible
- May be blocking touch events even when "hidden"

### Theory 2: YAML Mode Push Failure

The push mechanism doesn't actually deploy changes to HA's filesystem. The panel may be running stale code from before the screensaver was added.

## Remaining Questions

1. When did the buttons stop working? What was the last known good state?
2. Is the panel actually running the code we think it is?
3. Can we verify the file HA is serving matches our local file?
4. Is there a way to push files directly to HA's config directory?

## Next Steps

1. **Verify HA filesystem**: Check if `dashboards/office.yaml` on HA matches our local file
2. **Direct file push**: Find a way to copy files to HA's config directory (SSH, SMB, Docker volume)
3. **Minimal test**: Push a version with no screensaver code to confirm buttons work
4. **Alternative deploy**: Use HA's file editor or another mechanism to update the dashboard

## Key Files

- `office_v6.yaml` - Lead file (all edits go here)
- `office.yaml` - Mirror copy (push script writes both)
- `scratch/push_clean_v6.py` - Push script (has YAML mode issue)
- `dashboards-config-snippet.yaml` - HA configuration showing YAML mode


## Resolution (2026-08-02)

### Root Causes Identified

1. **Screensaver overlay blocking touches** - `event.stopPropagation()` consumed all taps
2. **Wrong HA endpoint** - push script was updating `office-panel` but HA was also serving from default endpoint
3. **WebView RAM cache** - old JavaScript stayed running until power cycle

### Fixes Applied

1. **Removed screensaver code** - commit `6ed68b5`
2. **Fixed push script** - added second save to `url_path: None` to update both HA endpoints
3. **Power cycled panel** - cleared WebView RAM and forced fresh config fetch

### Current State

- ✅ Buttons clickable
- ✅ No blue flash
- ✅ HA serving view ID `1785702426` with no screensaver code
- ✅ Push script updates both endpoints