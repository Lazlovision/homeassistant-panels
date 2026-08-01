================================================================================
CRESTRON HOME ASSISTANT DASHBOARDS — Deployment Guide
================================================================================

Panel: Crestron TSS-770-W-S (7" touch, 1280×800 WXGA)
Dashboards: Bedroom, Office, Living Room (one per panel)
Stack: Home Assistant + Lovelace YAML + button-card + card-mod + Kiosk Mode

================================================================================
STEP 1 — Install Required Add-Ons (HACS)
================================================================================

All three dashboards use custom cards. Install these from HACS before deploying:

  1. button-card
     → HACS Store → Frontend → "button-card" → Download
     Provides all card layouts, nested tap zones, and template rendering.

  2. card-mod
     → HACS Store → Frontend → "card-mod" → Download
     Provides CSS variable theming (day/night mode, glassmorphism).

  3. Kiosk Mode
     → HACS Store → Integrations → "Kiosk Mode" → Download
     Hides the HA header/sidebar for clean panel display.

After installing all three: restart Home Assistant and refresh your browser.


================================================================================
STEP 2 — Copy Dashboard Files to HA Config Directory
================================================================================

Your HA config directory is typically at:
  - Docker: /config/
  - HassOS: /usr/share/hassio/homeassistant/
  - Windows: %USERPROFILE%\AppData\Local\.homeassistant\

Create a "dashboards/" folder inside your config dir if it doesn't exist:

    <config>/dashboards/bedroom.yaml
    <config>/dashboards/office.yaml
    <config>/dashboards/livingroom.yaml

Copy each .yaml file from this folder into that location.


================================================================================
STEP 3 — Register Dashboards in configuration.yaml
================================================================================

Open your configuration.yaml and add a dashboards block:

    dashboards:
      dashboards/bedroom.yaml:
        title: Bedroom
        icon: mdi:bed-outline
        show_in_sidebar: true
        require_admin: false
      dashboards/office.yaml:
        title: Office
        icon: mdi:desk-lamp
        show_in_sidebar: true
        require_admin: false
      dashboards/livingroom.yaml:
        title: Living Room
        icon: mdi:sofa-outline
        show_in_sidebar: true
        require_admin: false

Then restart Home Assistant. After restart, check Settings → System → Logs
for any YAML parsing errors.


================================================================================
STEP 4 — Verify Entity IDs
================================================================================

Each dashboard references specific entity IDs. If your Mitsubishi AC or Crestron
lights use different IDs, find them and update the YAML files accordingly.

Finding entity IDs:

  Method A — Developer Tools → States:
    1. Go to http://<ha-host>:8123/developer-tools/state
    2. Search for your climate entities (e.g., "climate.air_conditioner_")
    3. Note the exact entity_id shown on the left

  Method B — UI Cards:
    1. Add any entity to a test dashboard via the "+" button
    2. Edit the card → switch to YAML mode
    3. The entity_id will be listed

Entity IDs used in each dashboard:

  Bedroom (bedroom.yaml):
    climate.air_conditioner_bedroom_climate
    light.bedroom_main
    light.bedroom_accent

  Office (office.yaml):
    climate.air_conditioner_office_climate
    light.office_main
    light.office_task

  Living Room (livingroom.yaml):
    climate.air_conditioner_living_room_climate
    light.living_room_main
    light.living_room_accent


================================================================================
STEP 5 — Find Your Dashboard URLs
================================================================================

After registering, each dashboard gets a URL. Find them:

  1. Open Home Assistant in your browser
  2. Click the three-dot menu (top right) → Dashboard settings
  3. Note the path for each dashboard (e.g., "bedroom", "office")

Default paths based on our config:
  - Bedroom:     http://<ha-host>:8123/lovelace-bedroom
  - Office:      http://<ha-host>:8123/lovelace-office
  - Living Room: http://<ha-host>:8123/lovelace-livingroom

Append ?kiosk to hide the HA chrome:
  - http://<ha-host>:8123/lovelace-bedroom?kiosk


================================================================================
STEP 6 — Build Kiosk URLs for Crestron Panels
================================================================================

To embed the dashboard on a Crestron TP panel without login prompts, use
long-lived access token authentication in the URL:

  Format:
    https://<username>:<long-lived-token>@<ha-host>/<dashboard-path>?kiosk

  Example:
    https://admin:dvsdwadwdawd@192.168.1.50/lovelace-bedroom?kiosk

Creating a long-lived access token:

  1. Log into Home Assistant as admin
  2. Click your profile (top right) → "Create Token"
  3. Give it a label (e.g., "Crestron Bedroom Panel")
  4. Copy the token immediately — you won't see it again
  5. Use this same token for all three panels (or make separate ones)

Programming into Crestron:

  For TSS-770-W-S, use the panel's web browser module or a SIMPL+ command
  to navigate to the URL. Example using a Web Browser Control:

    NavigateTo("https://admin:dvsdwadwdawd@192.168.1.50/lovelace-bedroom?kiosk")

  Set the browser to fullscreen and disable gestures/navigation if possible.


================================================================================
STEP 7 — Kiosk Mode Configuration
================================================================================

Each YAML file has `kiosk_mode: { kiosk: true }` at the top, which tells the
Kiosk Mode add-on to hide headers when loaded with ?kiosk in the URL.

Optional — auto-kiosk specific users (no ?kiosk needed):

  In configuration.yaml, add:

    frontend:
      kiosk_mode_filter:
        - filter_type: url
          url_match: /lovelace-bedroom
        - filter_type: user
          user_agent: Crestron

  Or set admin-level auto-kiosk per dashboard in the YAML:

    kiosk_mode:
      kiosk: true
      admin_settings:
        kiosk: false     # admins see the full UI even with ?kiosk


================================================================================
TROUBLESHOOTING
================================================================================

YAML Parse Errors on HA Restart:
  - Check indentation (2 spaces, no tabs)
  - Ensure all template expressions [[[ ... ]]] are properly closed
  - Look at Settings → System → Logs for exact line numbers

Dashboard Shows "Card Not Found":
  - button-card or card-mod not installed from HACS
  - Browser cache stale — hard refresh (Ctrl+Shift+R) after install

Climate Card Shows No Temperature:
  - Verify entity_id matches your Mitsubishi AC integration
  - Check Developer Tools → States that the entity has a "temperature" attribute

Lights Don't Toggle:
  - Verify light entity IDs exist in Developer Tools → States
  - If Crestron lights appear as switch. instead of light., update:
    * Change entity from light.xxx to switch.xxx
    * Change tap_action to call-service with switch.turn_on/switch.turn_off

Touch Targets Feel Too Small on TSS-770:
  - The panels are calibrated for 56px minimum tap targets
  - If modes or lights still feel small, increase the pill padding in the
    modes custom_fields HTML (search for "padding:12px")

Day/Night Theme Not Switching:
  - Verify sun.sun entity exists and reports above_horizon/below_horizon
  - Check Developer Tools → States → sun.sun


================================================================================
FONT NOTES
================================================================================

The dashboards use two Google Fonts loaded via the browser:
  - "Space Grotesk" — headings, large numbers (temperatures)
  - "Outfit" — body text, labels

These are system font fallbacks in most modern browsers. If you want to
guarantee exact rendering, add this to your HA UI template overrides:

    <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Outfit:wght@300;400;500;600&display=swap" rel="stylesheet">


================================================================================
FILES IN THIS FOLDER
================================================================================

  bedroom.yaml                  — Bedroom touch panel dashboard
  office.yaml                   — Office touch panel dashboard
  livingroom.yaml               — Living room touch panel dashboard
  dashboards-config-snippet.yaml — configuration.yaml registration block (ref)
  example yaml.txt              — Original WIP file (reference only)
  README.txt                    — This deployment guide
