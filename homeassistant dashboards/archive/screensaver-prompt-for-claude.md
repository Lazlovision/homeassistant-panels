# Screensaver Implementation — Prompt for Claude Opus 4.6

**Copy everything below this line and paste it to Claude.**

---

## TASK

Add a full-screen dim screensaver overlay to a Home Assistant dashboard on a Crestron TSS-770 touch panel (1280x800, Chromium-based WebView). After 5 seconds of idle (no touch), an elegant overlay fades in showing: current time (large), room temperature, and outside weather with icon. Tapping anywhere dismisses it. Day/night themes based on `sun.sun` state.

## CRITICAL CONSTRAINTS

- **JavaScript MUST be ES5**: `var` only, `function()` only, NO arrow functions, NO `const`/`let`, NO `?.`, NO `??`, NO template literal tag functions. The WebView is Chromium v87+ on Android 8.1.
- **All edits go in ONE file**: `F:/Homeassistant/homeassistant dashboards/office_v6.yaml`
- **After editing, push immediately** using the push script (instructions below).
- **DO NOT read the entire YAML file** — it's 1812 lines. Use the exact line numbers and anchors provided below.

## FILE ANCHORS (office_v6.yaml)

The dashboard uses a `custom_fields: header_row:` JavaScript template that starts at line 163 and returns HTML at line 962-963.

**Three injection points:**

1. **CSS injection** — Line 233-248: The viewport pinning IIFE already injects a `<style>` element into `<head>`. Append screensaver CSS to that same style element (add to the `style.textContent` string).

2. **JavaScript functions** — Line 320-323: There is a blank line between the viewport pinning IIFE closing `})();` (line ~320) and the Mitsubishi popup handler (line ~323). Insert screensaver JS functions here.

3. **HTML overlay** — Line 961-962: The header HTML ends with `</div>\n                `;` followed by `]]]` on line 963. Append the screensaver overlay HTML before the closing `` `; ``.

## WHAT TO BUILD

### 1. CSS (Append to existing style.textContent at line ~233-248)

Add this CSS to the end of the `style.textContent` string inside the viewport pinning IIFE:

```css
#screensaver_overlay{position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:100000;display:flex;align-items:center;justify-content:center;flex-direction:column;opacity:0;transition:opacity 0.3s ease;cursor:pointer;touch-action:manipulation;pointer-events:auto}
#screensaver_content{text-align:center;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;-webkit-user-select:none;user-select:none}
#screensaver_time{font-size:120px;font-weight:200;letter-spacing:-0.03em;line-height:1;margin-bottom:20px}
#screensaver_temp{font-size:48px;font-weight:300;letter-spacing:-0.02em;margin-bottom:16px}
#screensaver_weather{display:flex;align-items:center;justify-content:center;gap:10px;font-size:24px;font-weight:300}
[data-screensaver-theme="night"] #screensaver_overlay{background:rgba(9,9,12,0.88);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px)}
[data-screensaver-theme="night"] #screensaver_time{color:rgba(255,255,255,0.28)}
[data-screensaver-theme="night"] #screensaver_temp{color:rgba(255,255,255,0.22)}
[data-screensaver-theme="night"] #screensaver_weather{color:rgba(255,255,255,0.18)}
[data-screensaver-theme="night"] #screensaver_weather ha-icon{color:rgba(255,255,255,0.22)}
[data-screensaver-theme="day"] #screensaver_overlay{background:rgba(242,242,247,0.92);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px)}
[data-screensaver-theme="day"] #screensaver_time{color:rgba(28,28,30,0.35)}
[data-screensaver-theme="day"] #screensaver_temp{color:rgba(28,28,30,0.28)}
[data-screensaver-theme="day"] #screensaver_weather{color:rgba(28,28,30,0.25)}
[data-screensaver-theme="day"] #screensaver_weather ha-icon{color:rgba(28,28,30,0.28)}
```

### 2. JavaScript Functions (Insert at line 320-323, between viewport pinning and Mitsubishi popup)

```javascript

                // Screensaver: idle overlay with time, temp, weather
                (function() {
                  window._ssIdle = 0;
                  window._ssVisible = false;

                  window._ssReset = function() {
                    window._ssIdle = 0;
                    if (window._ssVisible) window._ssHide();
                  };

                  window._ssShow = function() {
                    if (window._ssVisible) return;
                    window._ssVisible = true;
                    var ov = document.getElementById('screensaver_overlay');
                    if (!ov) return;
                    ov.style.display = 'flex';
                    void ov.offsetWidth;
                    ov.style.opacity = '1';
                  };

                  window._ssHide = function() {
                    if (!window._ssVisible) return;
                    var ov = document.getElementById('screensaver_overlay');
                    if (!ov) return;
                    ov.style.opacity = '0';
                    setTimeout(function() {
                      ov.style.display = 'none';
                      window._ssVisible = false;
                    }, 300);
                  };

                  // Set theme
                  var isNight = states['sun.sun'] ? states['sun.sun'].state === 'below_horizon' : false;
                  document.documentElement.setAttribute('data-screensaver-theme', isNight ? 'night' : 'day');

                  // Attach idle listeners (capture phase so they fire first)
                  document.addEventListener('touchstart', function(e) {
                    // Don't reset idle if tapping the screensaver itself
                    if (e.target && e.target.id === 'screensaver_overlay') return;
                    window._ssReset();
                  }, true);
                  document.addEventListener('mousedown', function(e) {
                    if (e.target && e.target.id === 'screensaver_overlay') return;
                    window._ssReset();
                  }, true);

                  // Start idle counter + data updater
                  window._ssInterval = setInterval(function() {
                    window._ssIdle++;
                    if (window._ssIdle >= 5 && !window._ssVisible) {
                      window._ssShow();
                    }

                    // Update time
                    var timeEl = document.getElementById('screensaver_time');
                    if (timeEl) {
                      var now = new Date();
                      timeEl.innerText = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
                    }

                    // Update room temp
                    var tempEl = document.getElementById('screensaver_temp');
                    if (tempEl) {
                      var climate = states['climate.air_conditioner_office_climate'];
                      var curTemp = (climate && climate.attributes && climate.attributes.current_temperature)
                        ? Math.round(parseFloat(climate.attributes.current_temperature)) + '\u00b0C'
                        : '--\u00b0C';
                      tempEl.innerText = curTemp;
                    }

                    // Update weather
                    var weatherEl = document.getElementById('screensaver_weather_text');
                    var weatherIcon = document.getElementById('screensaver_weather_icon');
                    if (weatherEl && weatherIcon) {
                      var w = states['weather.forecast_home'];
                      var st = (w && w.state) || 'partlycloudy';
                      var wTemp = (w && w.attributes && w.attributes.temperature)
                        ? Math.round(w.attributes.temperature) + '\u00b0C outside'
                        : '--\u00b0C outside';
                      weatherEl.innerText = wTemp;
                      var iconMap = {
                        'sunny': 'mdi:weather-sunny',
                        'clear-night': 'mdi:weather-night',
                        'partlycloudy': 'mdi:weather-partly-cloudy',
                        'cloudy': 'mdi:weather-cloudy',
                        'rainy': 'mdi:weather-rainy',
                        'snowy': 'mdi:weather-snowy',
                        'snowy-rainy': 'mdi:weather-snowy-rainy',
                        'windy': 'mdi:weather-windy',
                        'fog': 'mdi:weather-fog',
                        'partlycloudy': 'mdi:weather-partly-cloudy',
                        'lightning': 'mdi:weather-lightning',
                        'lightning-rainy': 'mdi:weather-lightning-rainy',
                        'hazy': 'mdi:weather-hazy'
                      };
                      weatherIcon.setAttribute('icon', iconMap[st] || 'mdi:weather-partly-cloudy');
                    }
                  }, 1000);
                })();
```

### 3. HTML Overlay (Append before the closing backtick-semicolon at line 961-962)

The header HTML currently ends like this (line 961-963):
```
                </div>
                `;
              ]]]
```

Append the screensaver HTML so it becomes:
```
                </div>
                <div id="screensaver_overlay" ontouchstart="event.stopPropagation();" ontouchend="event.stopPropagation();window._ssHide();">
                  <div id="screensaver_content">
                    <div id="screensaver_time">--:--</div>
                    <div id="screensaver_temp">--°C</div>
                    <div id="screensaver_weather">
                      <ha-icon id="screensaver_weather_icon" icon="mdi:weather-partly-cloudy" style="width:28px;height:28px;--mdc-icon-size:28px;"></ha-icon>
                      <span id="screensaver_weather_text">--°C outside</span>
                    </div>
                  </div>
                </div>
                `;
              ]]]
```

**IMPORTANT:** The `ontouchstart="event.stopPropagation();"` on the screensaver overlay prevents the idle-reset listener from firing when tapping the screensaver (otherwise tapping to dismiss would immediately restart the idle timer).

## EDIT STRATEGY

You need to make 3 surgical edits to `F:/Homeassistant/homeassistant dashboards/office_v6.yaml`:

1. **Edit the CSS string** at line ~233-248: Find the `style.textContent =` line inside the viewport pinning IIFE. Append the screensaver CSS to the existing CSS string.

2. **Insert JS functions** between lines 320-323: Add the screensaver IIFE between the viewport pinning closing `})();` and the Mitsubishi popup handler.

3. **Append HTML** at lines 961-962: Insert the screensaver overlay div before the closing `` `; ``.

## AFTER EDITING — PUSH IMMEDIATELY

```powershell
cd "F:/Homeassistant/homeassistant dashboards/scratch"
python push_clean_v6.py
```

The script reads credentials from `F:/Homeassistant/secrets.json` automatically. It pushes the YAML to two HA endpoints (`url_path:office-panel` and `url_path:None`) to ensure the panel receives the update.

## VERIFICATION

The dashboard will render normally after push (screensaver won't be visible in a screenshot since it requires 5 seconds of idle). The screensaver will activate on the physical Crestron panel after 5 seconds of no touch input.

## EXISTING PATTERNS TO AVOID BREAKING

- The Mitsubishi popup handler at line ~323 uses `window.openMitsubishiPopup` — do NOT modify it.
- The weather popup handler uses `window.openWeatherPopup` — do NOT modify it.
- The viewport pinning uses `queryDeep()` and `MutationObserver` — do NOT modify it.
- All existing JS uses `var`, `function()`, and ES5 null checks — follow this pattern exactly.

## NOTES

- The `\u00b0` unicode escape is used for the degree symbol (°) because YAML template strings can mangle literal degree symbols.
- The screensaver uses `z-index: 100000` (higher than the Mitsubishi popup's `99999`) so it overlays everything.
- The `setInterval` for the screensaver is intentional and acceptable — it runs once per second updating text content only. This is different from the full-screen overlay bug that happened before (which injected DOM elements every second).
- The screensaver theme is set once at dashboard load based on `sun.sun`. It won't auto-switch mid-session.
