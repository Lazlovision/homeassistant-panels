# Crestron Touch Panel Viewport & Snapshot Calibration Guide

> [!IMPORTANT]
> **CRITICAL REFERENCE DOCUMENT**
> This document details the exact viewport specifications, headless snapshot rendering pipeline, image caching rules, and CSS layout parameters required for the Crestron TSS-770 and TS-1070 panels.

---

## 1. Crestron Touch Panel Viewport Specifications

| Parameter | Specification | Notes |
| :--- | :--- | :--- |
| **Target Viewport** | **`1280 x 800`** | Unified target resolution for CH5 & Crestron "General Web" app |
| **TSS-770 (7" Panel)** | `1280 x 800` @ `1x` | Native hardware display resolution |
| **TS-1070 (10.1" Panel)** | `1920 x 1200` native | Hardware applies internal **`1.5x` DPI scale factor** mapping `1280x800` |
| **Header Safety Margin** | Max `1220px` width | Top header pills must fit within `1220px` to prevent right-edge clipping |

---

## 2. Headless Screenshot Capture Setup (`take_snap.js`)

To ensure generated screenshot previews match the physical Crestron display 1:1:

```javascript
// Window Bounds
const windowFlags = [
  '--headless=new',
  '--remote-debugging-port=9222',
  '--window-size=1280,800',
  '--force-device-scale-factor=1',
  '--user-data-dir=' + tmpDir
];

// Async CSS & Kiosk Mode Settlement
await new Promise(r => setTimeout(r, 8000));

// Force Layout Recalculation
ws.send(JSON.stringify({
  id: 3,
  method: 'Runtime.evaluate',
  params: { expression: "window.dispatchEvent(new Event('resize'))", returnByValue: true }
}));

// Set Device Metrics & Capture
ws.send(JSON.stringify({
  id: 4,
  method: 'Emulation.setDeviceMetricsOverride',
  params: { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false }
}));
ws.send(JSON.stringify({ id: 5, method: 'Page.captureScreenshot', params: { format: 'png' } }));
```

---

## 3. Electron Chat UI Image Caching Rules

> [!CAUTION]
> **DO NOT reuse static image filenames when displaying previews in chat!**
> Electron's markdown renderer caches `file:///` URIs permanently by string. Overwriting a static file on disk will NOT update what is rendered in the chat window.

* **Rule**: When generating a preview image for chat display, copy the file to a **new unique filename** (e.g. `preview_snap_vN.png` or `live_snap_[timestamp].png`).
* **Rule**: Simultaneously copy the bytes to `live_dashboard_preview.png` and `dashboard_preview.png` for side-panel IDE viewers.

---

## 4. Key CSS Layout Rules

### Top Header Bar
```css
/* Must prevent horizontal overflow on 1280px width */
.header-pill {
  padding: 8px 14px !important;
  gap: 8px !important;
  border-radius: 24px !important;
}
.header-container {
  max-width: 100% !important;
  box-sizing: border-box !important;
}
```

### Right Thermostat Card
```css
/* Enforces full column height stretching and bottom anchoring */
:host {
  flex: 1.3 !important;
  min-width: 0 !important;
  display: flex !important;
  flex-direction: column !important;
  height: 100% !important;
}
ha-card {
  height: 100% !important;
  display: flex !important;
  flex-direction: column !important;
}
.hvac-panel-container {
  display: flex !important;
  flex-direction: column !important;
  justify-content: space-between !important;
  height: 100% !important;
}
```
