---
name: Atmospheric Intelligence
colors:
  surface: '#131316'
  surface-dim: '#131316'
  surface-bright: '#39393c'
  surface-container-lowest: '#0e0e11'
  surface-container-low: '#1b1b1e'
  surface-container: '#1f1f22'
  surface-container-high: '#2a2a2d'
  surface-container-highest: '#353438'
  on-surface: '#e4e1e6'
  on-surface-variant: '#bcc8cf'
  inverse-surface: '#e4e1e6'
  inverse-on-surface: '#303033'
  outline: '#879299'
  outline-variant: '#3d484e'
  surface-tint: '#64d3ff'
  primary: '#64d3ff'
  on-primary: '#003546'
  primary-container: '#00b0df'
  on-primary-container: '#003e51'
  inverse-primary: '#006783'
  secondary: '#8adb52'
  on-secondary: '#173800'
  secondary-container: '#56a31d'
  on-secondary-container: '#133000'
  tertiary: '#ffb86f'
  on-tertiary: '#4a2800'
  tertiary-container: '#e48f29'
  on-tertiary-container: '#563000'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#bde9ff'
  primary-fixed-dim: '#64d3ff'
  on-primary-fixed: '#001f2a'
  on-primary-fixed-variant: '#004d64'
  secondary-fixed: '#a5f86b'
  secondary-fixed-dim: '#8adb52'
  on-secondary-fixed: '#0a2000'
  on-secondary-fixed-variant: '#245100'
  tertiary-fixed: '#ffdcbe'
  tertiary-fixed-dim: '#ffb86f'
  on-tertiary-fixed: '#2c1600'
  on-tertiary-fixed-variant: '#693c00'
  background: '#131316'
  on-background: '#e4e1e6'
  surface-variant: '#353438'
  crestron-blue: '#004A80'
  surface-glass: rgba(255, 255, 255, 0.1)
  surface-dark-glass: rgba(0, 0, 0, 0.4)
  text-muted: '#A1A1A6'
typography:
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 48px
    fontWeight: '600'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '500'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.5'
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-caps:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '700'
    lineHeight: '1'
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  gutter: 16px
  margin-mobile: 20px
  margin-desktop: 40px
  card-padding: 24px
---

## Brand & Style

This design system centers on a sophisticated, "dark mode" aesthetic that translates luxury home automation into a digital experience. The brand personality is calm, reassuring, and invisible—technology that serves the resident without demanding attention. 

The visual style is a blend of **Glassmorphism** and **Corporate Modern**. It uses deep, near-black backgrounds as a canvas for semi-transparent, frosted-glass interface elements. This creates a sense of depth and physical presence, mimicking high-end hardware finishes. The goal is to evoke a "Sanctuary" feeling through high-contrast typography, ample negative space, and smooth, functional transitions.

## Colors

The palette is anchored by a deep obsidian (`#151518`) background. Interactive elements utilize a vibrant **Action Cyan** (`#00B0DF`) for primary highlights and a **System Green** (`#68B631`) for positive status feedback (e.g., "Armed" or "Secure").

The "Glass" effect is critical:
- **Surface Glass:** Use a light white alpha for secondary containers to create a frosted overlay effect against dark backgrounds.
- **Surface Dark Glass:** Use a black alpha for inner card elements to provide contrast while maintaining transparency.
- **Accents:** Use the Crestron Blue sparingly for high-level brand moments or subtle link styling.

## Typography

The system utilizes **Hanken Grotesk** as a contemporary substitute for Mark Pro, offering a clean, geometric, and professional feel. 

Typography follows a strict hierarchy:
- **Display Headlines:** Large, bold, and tightly tracked for maximum impact on hero sections.
- **Section Headers:** Medium weight with generous line height to maintain readability against dark backgrounds.
- **Labels:** Uppercase with increased letter spacing for small UI controls (e.g., "ACTIONS", "CONTROLS").
- **Contrast:** Always use pure white (#FFFFFF) for primary text and a muted gray (#A1A1A6) for secondary information to maintain visual order.

## Layout & Spacing

The layout utilizes a **Fixed Grid** philosophy, particularly for the dashboard experience. 
- **Grid:** A 12-column grid for desktop and a 2-column or 4-column grid for mobile/tablets. 
- **Rhythm:** An 8px base unit drives all spacing. 
- **Margins:** Generous outer margins (40px on desktop) keep the content centered and "premium."
- **Dashboard Logic:** On mobile, controls are arranged in a dense, tactile grid (2x2 or 2xN) of semi-transparent cards to facilitate easy thumb reach.

## Elevation & Depth

Hierarchy is established through **Glassmorphism** and tonal layering rather than traditional drop shadows.

- **Level 0 (Background):** Solid `#151518`.
- **Level 1 (Main Containers):** Semi-transparent frosted glass (`rgba(255, 255, 255, 0.05)`) with a high-intensity backdrop blur (20px-30px).
- **Level 2 (Active States/Interactive Cards):** Slightly higher opacity glass or a subtle 1px inner border (stroke) to catch the "light."
- **Lighting:** Avoid heavy ambient shadows. Instead, use a very soft, large-radius shadow (`rgba(0,0,0,0.5)`) only on floating elements like modals or popovers to distinguish them from the main glass surface.

## Shapes

The shape language is consistently **Rounded**. 
- Standard UI cards and buttons use a `1rem` (16px) corner radius.
- Large containers and section wraps use `1.5rem` (24px).
- Small chips or toggle switches use a full pill-shape.
The roundedness is intentional to soften the high-tech aesthetic, making the system feel more approachable and "human."

## Components

### Cards
Cards are the primary building block. They must feature a backdrop-filter blur and a semi-transparent background. Tiles for lights or switches should have a distinct "on" state where the background becomes more opaque or tinted with the primary action color.

### Buttons
- **Primary:** Solid `#00B0DF` with white text. High roundedness.
- **Secondary/Ghost:** A subtle 1px white border with a transparent background.
- **Quick Action:** Square-ish cards with a centered icon and label, using the `surface-glass` style.

### Inputs & Controls
- **Sliders:** Minimalist, thin tracks with a circular handle. The active track should use a gradient or the primary action color.
- **Checkboxes/Radios:** Circular to match the overall rounded theme.

### Lists
Lists should be separated by thin, low-opacity horizontal rules rather than boxed containers to maintain an airy feel.

### Status Indicators
Use small, glowing pips (dots) next to text labels to indicate active status (e.g., a green dot for "Secure").