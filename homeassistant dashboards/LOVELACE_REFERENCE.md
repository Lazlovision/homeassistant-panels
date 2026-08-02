# Home Assistant Lovelace Reference & Standards Manual
**Baseline Version:** `v7.0` (Distance Legibility & Zero-Flash Optimizations — Locked 2026-07-31)

> Cross-reference: See `AGENTS.md` §6 for critical knowledge and `crestron_viewport_guide.md` §7 for the full viewport pinning pattern.

---

## 1. Core Architecture & Crestron TSS-770 Design Standards

### Viewport Pinning & WebKit Teardown Shielding
To prevent Crestron's embedded WebKit browser from shifting layouts upwards during cold startups or page refreshes:
1. **Immune Root Container Locking**:
   - The root `:host` vertical-stack **MUST** specify:
     ```css
     position: fixed !important;
     top: 0 !important;
     left: 0 !important;
     width: 100vw !important;
     height: 100vh !important;
     z-index: 1 !important;
     transform: translateZ(0) !important;
     ```
   - Full three-pronged pattern (CSS injection + recursive shadow DOM + MutationObserver) is in `crestron_viewport_guide.md` §7.

2. **SPA Soft Refresh**:
   - Page touch targets (such as tapping "Office") must execute `window.dispatchEvent(new CustomEvent('location-changed'))` instead of hard browser reloads (`window.location.reload(true)`).

---

## 2. 3-Meter Distance Legibility Typography Standards

Every element on the 1280x800 display follows strict font size floors for distance readability (~3 meters away):

| Interface Element | Font Size | Weight | Line Height / Letter Spacing |
| :--- | :--- | :--- | :--- |
| **Room Title ("Office")** | `38px` | `800` | `1.1` / `-0.02em` |
| **Thermostat Room Temp** | `90px` | `700` | `1.0` / `-0.03em` |
| **Set Point Target Readout** | `48px` | `800` | `1.0` |
| **Card / Light Titles** | `26px` | `800` | `-0.01em` |
| **Header Outdoor Temp** | `22px` | `800` | `-0.01em` |
| **Dimmer / State Readouts** | `22px` | `800` | — |
| **Air Quality PM2.5 Readout** | `20px` | `800` | — |
| **Media Track Title** | `20px` | `800` | `1.2` |
| **Scene Button Titles** | `18px` | `900` | `0.1em` |
| **Header Secondary Temps** | `18px` | `700` | — |
| **HVAC & Fan Mode Buttons** | `17px` | `800` | — |
| **Media Subtitle / Show** | `16px` | `700` | `1.2` |
| **Volume Percentage** | `16px` | `800` | — |
| **HVAC Active Status Badge** | `15px` | `800` | `0.05em` |
| **Section Titles & Sub-labels** | `14px` | `800` | `0.12em` |
| **Purifier Mode Badge** | `14px` | `800` | `0.04em` |
| **Media Elapsed / Dur Timestamps** | `14px` | `800` | — |

---

## 3. Zero-Flash Layout & Performance Optimizations

1. **Card Host Flex Centering**:
   - To eliminate grid re-render jumps (such as setpoint text shifting left briefly on update), host cards MUST specify `display: flex !important; justify-content: center !important; align-items: center !important; text-align: center !important;` on both `styles.card` and `styles.custom_fields.<field>`.
2. **0ms Optimistic DOM Updates**:
   - Touch controls for rapid interaction (setpoint `+`/`-` buttons) immediately update the local DOM element (`document.getElementById('sp_val_disp').innerText = newTemp + '°'`) before calling Home Assistant services over WebSocket.
3. **GPU Hardware Acceleration**:
   - Embedded WebKit layout repaints are offloaded to hardware GPU using `transform: translateZ(0) !important;` on host cards and sliders.

---

## 4. Day/Night Theme Switching

All UI elements switch between day and night themes based on `sun.sun` state. This is done at two levels:

### 4.1 Jinja-Level (YAML `card_mod`)
```yaml
card_mod:
  style: |
    :host {
      background: {{ '#09090C' if is_state('sun.sun', 'below_horizon') else '#F2F2F7' }} !important;
      --primary-text-color: {{ '#FFFFFF' if is_state('sun.sun', 'below_horizon') else '#1C1C1E' }} !important;
    }
```

### 4.2 JavaScript-Level (button-card `[[[ ]]]` templates)
```javascript
var isNight = states['sun.sun'] ? states['sun.sun'].state === 'below_horizon' : false;
var bgColor = isNight ? 'rgba(26, 26, 36, 0.95)' : '#FFFFFF';
var textColor = isNight ? '#FFFFFF' : '#1C1C1E';
var subColor = isNight ? '#9E9EA8' : '#6E6E73';
```

### 4.3 Design Tokens

| Token | Night Value | Day Value |
| :--- | :--- | :--- |
| Background | `#09090C` | `#F2F2F7` |
| Card Background | `rgba(26, 26, 36, 0.95)` | `#FFFFFF` |
| Primary Text | `#FFFFFF` | `#1C1C1E` |
| Secondary Text | `#9E9EA8` | `#6E6E73` |
| Card Border | `rgba(255, 255, 255, 0.06)` | `rgba(0, 0, 0, 0.08)` |
| Box Shadow | `none` | `0 4px 14px rgba(0,0,0,0.05)` |
| Pill Background | `rgba(255, 255, 255, 0.09)` | `#FFFFFF` |

See `Design/DESIGN.md` for the full design system.
