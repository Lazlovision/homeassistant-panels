# Office Dashboard Revision Log

## v00 - Baseline (2026-06-26)
- Starting point: Gemini's version with native thermostat card
- Issues: sidebar visible, only 1 light card, content doesn't fill viewport, large empty space below
- Screenshot: v00_baseline.jpg

## v01 - Structural fix: viewport filling, 2 light cards, compact layout
- File: office_v01.yaml

## v01 - Structural fix: viewport filling, 2 light cards, compact layout
- File: office_v01.yaml

## v01 - Structural layout fix (2026-06-28)
- Wrote config directly to .storage/lovelace.office_panel
- Layout: top bar -> 4 scenes -> lights (left) + HVAC (right)
- Thermostat card with mode/fan button grids working
- Issues: sidebar visible, only 1 light card, content doesn't fill viewport, light card design wrong
- Screenshot: v01_rendered.jpg
- File: office_v01.yaml

## v02 - Two-column layout with 2 light cards (2026-06-28)
- Restructured as 2-column horizontal-stack (left: top bar + scenes + lights, right: HVAC)
- Added Task Light card below Main Lights
- Cleaned up CSS (no card_mod wrapper needed)
- Thermostat card inline with mode/fan buttons
- Scenes reference: scene.office_arrive, scene.office_movie, scene.office_leave, scene.office_sleep
- Still need: kiosk_mode to hide sidebar, viewport filling, scenes created
- File: office_v02.yaml
