# Crestron Touch Panel Viewport & Snapshot Calibration Guide

> [!IMPORTANT]
> **CRITICAL REFERENCE DOCUMENT**
> This document details the exact viewport specifications, headless snapshot rendering pipeline, image caching rules, browser engine characteristics, and empirical calibration test results for Crestron TSS-770 and TS-1070 panels.

---

## 1. Crestron Touch Panel Viewport Specifications

| Parameter | Specification | Notes |
| :--- | :--- | :--- |
| **Target Viewport** | **`1280 x 800`** | Unified target resolution for CH5 & Crestron "General Web" app |
| **TSS-770 (7" Panel)** | `1280 x 800` @ `1x` | Native hardware display resolution |
| **TS-1070 (10.1" Panel)** | `1920 x 1200` native | Hardware applies internal **`1.5x` DPI scale factor** mapping `1280x800` |
| **Header Safety Margin** | Max `1220px` width | Top header pills must fit within `1220px` to prevent right-edge clipping |

---

## 2. Headless Screenshot Capture

The actual screenshot scripts are at `F:/Homeassistant/take_snap.js` (production) and `F:/Homeassistant/take_test_snap.js` (test). They:

- Launch headless Chrome at `--window-size=1280,800 --force-device-scale-factor=1`
- Auto-login via shadow DOM walk (finds `INPUT[type=text]` and `INPUT[type=password]` recursively through shadow roots)
- Navigate to `/office-panel`
- Wait 8s for CSS/kiosk mode to settle
- Force layout recalculation via `window.dispatchEvent(new Event('resize'))`
- Set device metrics override to 1280x800
- Capture PNG screenshot
- Use portable temp paths, 30s timeout, and auto-cleanup

**Do not write new screenshot code.** Use these scripts directly.

### Image Caching Rules

> [!CAUTION]
> **DO NOT reuse static image filenames when displaying previews in chat!**
> Electron's markdown renderer caches `file:///` URIs permanently by string. Overwriting a static file on disk will NOT update what is rendered in the chat window.

* **Rule**: When generating a preview image for chat display, copy the file to a **new unique filename** (e.g. `preview_snap_vN.png` or `live_snap_[timestamp].png`).
* **Rule**: Simultaneously copy the bytes to `live_dashboard_preview.png` and `dashboard_preview.png` for side-panel IDE viewers.

---

## 3. Key CSS Layout Patterns

### Viewport Pinning (Root Card)
The root `vertical-stack` card uses `card_mod` to pin the entire layout:

```css
:host {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
  max-height: 100vh !important;
  min-height: 100vh !important;
  overflow: hidden !important;
  z-index: 1 !important;
  transform: translateZ(0) !important;
}
ha-card {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  height: 100% !important;
  position: absolute !important;
  top: 0 !important;
  left: 0 !important;
  width: 100% !important;
  max-height: 100vh !important;
  min-height: 100vh !important;
  overflow: hidden !important;
}
#root {
  display: flex !important;
  flex-direction: column !important;
  position: absolute !important;
  top: 0 !important;
  left: 0 !important;
  width: 100% !important;
  height: 100% !important;
  padding: 22px 28px 14px 28px !important;
  box-sizing: border-box !important;
  justify-content: space-between !important;
  gap: 14px !important;
}
```

### Header Bar (Inline Styles, No Classes)
The header row uses inline styles in a `custom_fields` JS template — no CSS classes. Key constraints:
- `max-width: 100%` with `box-sizing: border-box` on the container
- Pill elements use `padding: 6px 12px`, `gap: 8px`, `border-radius: 28px`
- Content must fit within `1220px` to avoid right-edge clipping

### Thermostat Card (Right Column)
The HVAC card stretches to fill the right column with `flex: 1.3`:

```css
:host {
  flex: 1.3 !important;
  min-width: 0 !important;
  display: flex !important;
  flex-direction: column !important;
  height: 100% !important;
  min-height: 100% !important;
}
ha-card {
  height: 100% !important;
  min-height: 100% !important;
  display: flex !important;
  flex-direction: column !important;
  justify-content: space-between !important;
}
```

### Media Bar (Bottom, 80px Fixed)
```css
:host {
  flex: 0 0 80px !important;
  height: 80px !important;
  min-height: 80px !important;
  max-height: 80px !important;
}
```

---

## 4. Chromium vs Embedded Crestron WebView Architecture

> [!WARNING]
> **Headless Desktop Chrome screenshots verify logic & structure — physical photo is ground truth for layout.**
> Crestron 70-Series panels (TS-1070, TSS-770) run **Android OS 8.1** with an embedded **Chromium System WebView** wrapped in Crestron's CH5 application container.

### 4.1 Subpixel & Border-Radius Rendering
* Android WebView subpixel antialiasing differs from Windows DirectWrite rasterization.
* **Impact**: Rounded corners and gradients may show slight curvature or color boundary variations between Windows Chrome and the Crestron panel.

### 4.2 Flexbox Layout & Bottom Anchoring
* `margin-top: auto` and `flex: 1` height stretching require explicit `display: flex; flex-direction: column; height: 100%` on **all ancestor elements** (`hui-card`, `:host`, `ha-card`).
* **Impact**: If any parent container defaults to `display: block` or `height: auto`, internal elements (like `FAN SPEED` buttons) won't anchor to the bottom.

### 4.3 Shadow DOM Specificity & `card_mod`
* `card_mod` injects CSS into LitElement shadow roots (`#shadow-root`) asynchronously.
* **Best Practice**: Prefer native `styles:` blocks inside `custom:button-card` over external `card_mod` where possible. Use `card_mod` primarily for parent element overrides (`:host`, `#root`, `hui-card`).

### 4.4 Font Rendering & FreeType Kerning
* Bold Google Fonts (Hanken Grotesk / Inter) render ~5% wider under Android FreeType than Windows Chrome.
* **Impact**: Text like `PM2.5 0 AUTO` takes ~240px in Windows Chrome but ~255px on the Crestron panel.
* **Mitigation**: Compact top pill paddings (`6px 12px` and `gap: 8px`) ensure content fits within `1220px` without edge clipping.

### 4.5 JavaScript Execution & ES5 Compatibility
* Embedded webviews can throw syntax errors on optional chaining (`?.`) or nullish coalescing (`??`) inside JS template strings.
* **Rule**: Always write explicit standard ES5 null checks (`(states['x'] ? states['x'].state : 'off')`).
* **Also avoid** in templates: `const`/`let` in some contexts, `async/await`, arrow functions in inline handlers.

---

## 5. Empirical Calibration Test Results (TSS-770 Panel vs Chrome Headless)

Physical TSS-770 panel photos were systematically compared against Chrome headless screenshots across two test patterns:

### 5.1 Raw CSS/HTML (White Calibration Pattern)

| Test Metric | Chrome Headless | TSS-770 Panel Photo | Calibration Result |
| :--- | :--- | :--- | :--- |
| **Overscan** | `1280x800` | All 4 red corner brackets visible at exact edges | **0% Overscan (1:1 Fit)** |
| **Resolution** | `1280x800` | Grid lines align pixel-perfect | **1280x800 Confirmed** |
| **1px Lines** | Rendered sharp | Rendered sharp | **Identical** |
| **Font Sizing (10–28px)** | Baseline | Matches Chrome | **Identical** |
| **Border Radius** | Smooth | Smooth | **Identical** |

### 5.2 Button-Card Shadow DOM & Layout Deltas

| Layout Pattern | Chrome Behavior | TSS-770 Panel Behavior | Key Finding |
| :--- | :--- | :--- | :--- |
| **`margin-top: auto` Anchoring** | Anchors to bottom | Stacks directly below top content | **Fails inside button-card shadow DOM unless parent has explicit flex height** |
| **Pill Text Width** | Baseline | ~3–5% wider | **Android FreeType font kerning is slightly wider** |
| **CSS Grid Columns** | Equal width | Equal width | **100% Supported** |
| **Flex Gap (`gap: 14px`)** | 14px gap | Matches Chrome | **Supported** |

### 5.3 Critical Mitigations & Best Practices

1. **Bottom Anchoring**: Use `justify-content: space-between` on parent flex containers paired with `height: 100% !important` on all ancestor `:host` and `ha-card` elements instead of relying solely on `margin-top: auto`.
2. **Font Width Safety**: Keep top header pill padding compact (`6px 12px`) with `gap: 8px` to absorb the 3-5% Android font kerning increase on 1280px panels.
3. **Color Accuracy**: Camera backlight bloom and white balance shift photos towards blue. Trust physical human eye verification for color tuning rather than camera photos.

---

## 6. Verification & Workflow Rules

1. **Chrome Screenshots (`take_snap.js`)**: Use for rapid validation of card structure, entity states, YAML syntax, and HA service calls.
2. **Physical Panel Photos**: Use for final verification of spacing, vertical column stretching, and edge alignment.
3. **Version Control**: Maintain all clean dashboard definitions committed to GitHub: [https://github.com/Lazlovision/homeassistant-panels](https://github.com/Lazlovision/homeassistant-panels).

---

## 7. Viewport Pinning Pattern (Critical — Read Before Any Layout Fix)

> [!CRITICAL]
> **DO NOT use `setTimeout` to pin viewport layout.** It produces 50/50 behavior on the Crestron panel.
> Use the three-pronged pattern below. This is the only approach that achieves 100% deterministic layout pinning.

### Why `setTimeout` Fails

Home Assistant's card layout system re-renders shadow DOM cards asynchronously and unpredictably after initial load. A `setTimeout` fires at a fixed delay, but HA may re-render before, during, or after that delay — overwriting any inline styles you set. This produces the classic 50/50 behavior where the layout is correct on some refreshes and broken on others.

### The Three-Pronged Pattern

**1. Global CSS Injection** — Inject a `<style>` element into `<head>` that constrains the entire element chain from root down:

```css
html, body, home-assistant, ha-panel-lovelace, ha-lovelace, ha-lovelace-main, hui-root, hui-panel-view, hui-view, hui-card {
  margin: 0 !important; padding: 0 !important;
  width: 100vw !important; height: 100vh !important;
  max-height: 100vh !important; min-height: 100vh !important;
  overflow: hidden !important; box-sizing: border-box !important;
}
```

**2. Recursive Shadow DOM Traversal** — `#root` elements live inside `hui-vertical-stack-card` and `hui-horizontal-stack-card` shadow roots, nested multiple levels deep. You cannot reach them with a single `querySelector`. Use recursive traversal:

```javascript
function queryDeep(selector, root) {
  root = root || document;
  try {
    var found = root.querySelector(selector);
    if (found) return found;
    var elements = root.querySelectorAll('*');
    for (var i = 0; i < elements.length; i++) {
      if (elements[i].shadowRoot) {
        found = queryDeep(selector, elements[i].shadowRoot);
        if (found) return found;
      }
    }
  } catch(e) {}
  return null;
}
```

Then find cards with: `queryDeep('hui-vertical-stack-card')` and `queryDeep('hui-horizontal-stack-card')`.

**3. MutationObserver** — Instead of `setTimeout`, watch for DOM changes and re-apply pinning reactively:

```javascript
var observer = new MutationObserver(function() {
  pinViewport();
});
observer.observe(document.body, { childList: true, subtree: true });
```

This re-applies pinning whenever HA re-renders any card, making it deterministic regardless of timing.

### What Each Stack's `#root` Contains

- **Vertical stack `#root`**: `children[0]` = main content area (horizontal stack), `children[1]` = media bar (80px, pinned to bottom)
- **Horizontal stack `#root`**: `children[0]` = left column, `children[1]` = right column

### Reference

Working implementation is in `office_v6.yaml` in the header card's `custom_fields: header_row` JS template (search for "Viewport & Media Bar Pinning"). Use that code as the template — don't re-derive from scratch.
