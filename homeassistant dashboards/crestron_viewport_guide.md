# Crestron Touch Panel Viewport & Snapshot Calibration Guide

> [!IMPORTANT]
> **CRITICAL REFERENCE DOCUMENT**
> This document details the exact viewport specifications, headless snapshot rendering pipeline, image caching rules, browser engine characteristics, empirical calibration test results, and HA shadow DOM architecture for Crestron TSS-770 and TS-1070 panels.

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
> Crestron 70-Series panels (TS-1070, TSS-770) run **Android OS 8.1** with an embedded **Chromium-based WebView** wrapped in Crestron's CH5 application container.

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

## 7. HA Shadow DOM Architecture

> [!IMPORTANT]
> Understanding HA's shadow DOM hierarchy is essential for viewport pinning, card_mod CSS injection, and any DOM manipulation.

### 7.1 Full Element Chain (Panel View)

```
document
└── home-assistant (LitElement, shadow DOM)
    └── home-assistant-main (LitElement, shadow DOM)
        └── ha-drawer (LitElement, shadow DOM)
            └── partial-panel-resolver (NO shadow DOM — light DOM children)
                └── ha-panel-lovelace (LitElement, shadow DOM)
                    └── hui-root (LitElement, shadow DOM)
                        └── hui-view-container (LitElement, shadow DOM — renders <slot>)
                            └── hui-view (NO shadow DOM — createRenderRoot returns this)
                                └── hui-panel-view (LitElement, shadow DOM) [for type: panel views]
                                    └── hui-card (NO shadow DOM — wrapper)
                                        └── hui-vertical-stack-card (LitElement, shadow DOM)
                                            └── #root (div, inside shadow DOM)
                                                └── children cards...
                                                    └── custom:button-card (has its own shadow DOM)
```

### 7.2 Shadow DOM Boundaries

| Element | Has Shadow DOM? | Notes |
| :--- | :--- | :--- |
| `home-assistant` | ✅ Yes | Root app element |
| `home-assistant-main` | ✅ Yes | Contains ha-drawer |
| `ha-drawer` | ✅ Yes | Sidebar + content |
| `partial-panel-resolver` | ❌ No | Light DOM children only |
| `ha-panel-lovelace` | ✅ Yes | Contains hui-root |
| `hui-root` | ✅ Yes | Contains header + view container |
| `hui-view-container` | ✅ Yes | Renders `<slot>` — very thin |
| `hui-view` | ❌ No | `createRenderRoot returns this` — light DOM children |
| `hui-panel-view` | ✅ Yes | Panel-type views only |
| `hui-card` | ❌ No | Wrapper — no shadow DOM |
| `hui-vertical-stack-card` | ✅ Yes | `#root` div inside shadow |
| `hui-horizontal-stack-card` | ✅ Yes | `#root` div inside shadow |
| `custom:button-card` | ✅ Yes | Custom card shadow DOM |

### 7.3 What `#root` Inside Stack Cards Contains

`#root` is a `<div id="root">` rendered inside `hui-stack-card`'s `render()` method:

- **Vertical stack `#root`**: `display: flex; flex-direction: column; flex: 1; min-height: 0; gap: var(--vertical-stack-card-gap, 8px)`
- **Horizontal stack `#root`**: `display: flex; flex: 1; min-height: 0; gap: var(--horizontal-stack-card-gap, 8px)`
  - Also: `#root > hui-card { display: contents; }` and `#root > hui-card > * { flex: 1 1 0; min-width: 0; }`

### 7.4 card_mod CSS Injection Mechanics

card_mod v4 works by:

1. **Patching HA elements** — Monkey-patches `connectedCallback` / `update` methods of HA's Lit elements
2. **Finding shadow roots** — Traverses the element chain to find the appropriate shadow root
3. **Injecting `<style>` tags** — Creates `<style>` elements and appends them to the shadow root

**card_mod `$` selector syntax:**
- `element$` — Enter shadow root of `element`
- `element1 $ element2` — From element1's shadow root, find element2
- Chain: `ha-markdown$ .content` — Enter ha-markdown's shadow root, then find `.content`

### 7.5 What Triggers Card Re-renders

Cards re-render when Lit's reactive properties change:

1. **`hass` property change** — HA sends state updates every second via WebSocket. When `hass` object reference changes, all cards re-render.
2. **`config` property change** — When dashboard config is pushed/updated
3. **`preview` property change** — Edit mode toggle
4. **`layout` property change** — Panel mode changes

**Why `setTimeout` fails for layout pinning:**
HA's `hass` property updates arrive on an unpredictable schedule. Each update triggers Lit's `update()` → `render()` cycle, which creates new shadow DOM content and destroys any manual inline styles. `setTimeout` fires at a fixed time, but HA may re-render before, during, or after — producing 50/50 behavior.

### 7.6 Panel View Special Handling

Panel views (`type: panel`) use `hui-panel-view` instead of the default view:
- Only supports ONE card (shows warning if more)
- Sets `card.layout = "panel"` which triggers `ispanel` attribute on stack cards
- The `ispanel` attribute restores card styling (border-radius, shadow) normally hidden in panel mode

---

## 8. Viewport Pinning Pattern (Critical — Read Before Any Layout Fix)

> [!CAUTION]
> **DO NOT use `setTimeout` alone to pin viewport layout.** It produces 50/50 behavior on the Crestron panel.
> Use the three-pronged pattern below. This is the only approach that achieves 100% deterministic layout pinning.

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
// Observe document.body — catches all DOM mutations including shadow DOM host additions
if (!window._crestronViewportObserverAttached) {
  window._crestronViewportObserverAttached = true;
  var observer = new MutationObserver(function() {
    pinViewport();
  });
  observer.observe(document.body, { childList: true, subtree: true });
}
```

This re-applies pinning whenever HA adds/removes cards, making it deterministic regardless of timing.

### MutationObserver Target Selection

The current implementation observes `document.body` with `{ childList: true, subtree: true }`. This is intentionally broad to catch all card additions across the HA DOM tree. A more targeted approach would observe `hui-view` (light DOM, no shadow root), but `document.body` has proven more reliable on the Crestron WebView because it catches mutations at every level including HA's own internal component swaps.

**Note:** MutationObserver **cannot cross shadow boundaries**. It catches host element additions (e.g., when HA adds a new `hui-card` wrapper) but not changes inside existing shadow roots. The `pinViewport()` function then traverses shadow roots manually via `queryDeep`.

### Full Shadow DOM Hierarchy

Traced from HA frontend source (`home-assistant/frontend` on GitHub):

```
document
└── home-assistant (shadow DOM)
    └── home-assistant-main (shadow DOM)
        └── ha-drawer (shadow DOM)
            └── partial-panel-resolver (NO shadow DOM — light DOM)
                └── ha-panel-lovelace (shadow DOM)
                    └── hui-root (shadow DOM)
                        └── hui-view-container (shadow DOM)
                            └── hui-view (NO shadow DOM — light DOM, createRenderRoot returns this)
                                └── hui-panel-view (shadow DOM, for type: panel views)
                                    └── hui-card (NO shadow DOM — light DOM, wrapper only)
                                        └── hui-vertical-stack-card (shadow DOM)
                                            └── #root (div, flex-direction: column)
                                                ├── hui-card → hui-horizontal-stack-card (shadow DOM)
                                                │   └── #root (div, display: contents on children)
                                                │       ├── hui-card → hui-vertical-stack-card (left column)
                                                │       └── hui-card → custom:button-card (right column / HVAC)
                                                └── hui-card → custom:button-card (media bar, 80px)
```

**Key insight:** `hui-card`, `hui-view`, and `hui-section` are **light DOM** (no shadow root). Everything else is shadow DOM. This means `queryDeep` must traverse through shadow roots of intermediate elements but can use direct `querySelector` on light DOM elements.

### card_mod v4 Mechanics

`card_mod` (by thomasloven) patches HA element lifecycle methods (`connectedCallback`, `update`) to inject `<style>` tags into shadow roots. It uses `$` syntax for shadow boundary traversal (e.g., `$ ha-card` reaches into the card's shadow root).

**Important:** `card_mod` supports `prepend: true` for cards that re-render after initial style injection. Without it, styles may be lost on re-render.

### Re-render Triggers (Why setTimeout Fails)

HA sends `hass` property updates via WebSocket **every second** to all connected cards. Each update triggers Lit's reactive update cycle:

1. `hass` property setter fires → marks element dirty
2. Lit's `update()` runs → calls `render()` → creates new template
3. Template is diffed against existing DOM
4. **Manual inline styles set via `style.cssText` are lost** if the element is re-rendered

This is why `setTimeout` produces 50/50 behavior: your pinning fires at a fixed delay, but HA's re-render cycle can overwrite it before, during, or after. The `MutationObserver` pattern works because it re-applies pinning **reactively** whenever the DOM changes.

### MutationObserver Limitations

**MutationObserver cannot cross shadow boundaries.** It observes light DOM mutations only. When HA adds/removes card wrappers (`hui-card`), the observer fires and `pinViewport()` traverses into their shadow roots via `queryDeep`. This combination (observer for timing + queryDeep for depth) is what makes the pattern deterministic.

### Reference

Working implementation is in `office_v6.yaml` in the header card's `custom_fields: header_row` JS template (search for "Viewport & Media Bar Pinning"). Use that code as the template — don't re-derive from scratch.

**Source references:**
- `ha-panel-lovelace.ts` — https://github.com/home-assistant/frontend/blob/dev/src/panels/lovelace/ha-panel-lovelace.ts
- `hui-root.ts` — https://github.com/home-assistant/frontend/blob/dev/src/panels/lovelace/hui-root.ts
- `hui-view.ts` — https://github.com/home-assistant/frontend/blob/dev/src/panels/lovelace/views/hui-view.ts
- `hui-stack-card.ts` — https://github.com/home-assistant/frontend/blob/dev/src/panels/lovelace/cards/hui-stack-card.ts
- `card-mod` — https://github.com/thomasloven/lovelace-card-mod
