---
name: Auror Reading System
colors:
  surface: '#fcf8ff'
  surface-dim: '#dbd8e4'
  surface-bright: '#fcf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f2fe'
  surface-container: '#efecf8'
  surface-container-high: '#e9e6f3'
  surface-container-highest: '#e4e1ed'
  on-surface: '#1b1b23'
  on-surface-variant: '#464554'
  inverse-surface: '#303038'
  inverse-on-surface: '#f2effb'
  outline: '#767586'
  outline-variant: '#c7c4d7'
  surface-tint: '#494bd6'
  primary: '#4648d4'
  on-primary: '#ffffff'
  primary-container: '#6063ee'
  on-primary-container: '#fffbff'
  inverse-primary: '#c0c1ff'
  secondary: '#6b38d4'
  on-secondary: '#ffffff'
  secondary-container: '#8455ef'
  on-secondary-container: '#fffbff'
  tertiary: '#904900'
  on-tertiary: '#ffffff'
  tertiary-container: '#b55d00'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e1e0ff'
  primary-fixed-dim: '#c0c1ff'
  on-primary-fixed: '#07006c'
  on-primary-fixed-variant: '#2f2ebe'
  secondary-fixed: '#e9ddff'
  secondary-fixed-dim: '#d0bcff'
  on-secondary-fixed: '#23005c'
  on-secondary-fixed-variant: '#5516be'
  tertiary-fixed: '#ffdcc5'
  tertiary-fixed-dim: '#ffb783'
  on-tertiary-fixed: '#301400'
  on-tertiary-fixed-variant: '#703700'
  background: '#fcf8ff'
  on-background: '#1b1b23'
  surface-variant: '#e4e1ed'
typography:
  display-lg:
    fontFamily: Geist
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Geist
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
  title-md:
    fontFamily: Geist
    fontSize: 20px
    fontWeight: '500'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 32px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 28px
  label-md:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  container-max: 1440px
  sidebar-width: 280px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 40px
---

## Brand & Style

This design system is built on the intersection of high-performance technology and the quiet comfort of a personal library. It employs a **"Techy + Cozy"** aesthetic—a blend of hyper-clean minimalism with soft, atmospheric touches.

The personality is **Sophisticated**, characterized by generous whitespace and precise typography; **Welcoming**, through the use of soft rounded forms and organic gradients; and **High-Performance**, utilizing subtle glows and glassmorphism to suggest a responsive, modern engine. The emotional goal is to reduce cognitive load, allowing the user to enter a state of "deep flow" reading.

## Colors

The palette utilizes a core of **Indigo (#6366F1)** and **Purple (#8B5CF6)** to provide a sense of intelligence and creativity. 

### Light Mode
The background layers use soft, cool grays (Slate 50/100) to prevent eye strain. Surfaces are pure white to maintain a crisp, premium feel. Accents are applied through "glowing" gradients that transition from Indigo to Purple.

### Dark Mode
The dark mode moves away from pure black, utilizing a deep Navy/Slate foundation (#0F172A) to maintain depth. Surfaces use a slightly lighter Slate (#1E293B). Glowing elements use lower opacity and higher blur to simulate a soft neon ambient light, evoking a "night-reading" atmosphere.

## Typography

Typography is the cornerstone of this reading experience. We use **Geist** for UI elements, headings, and labels to lean into the "techy" side of the brand—its precise, geometric nature provides a sense of high-performance. 

For the core reading experience and long-form body text, **Inter** is utilized for its exceptional legibility and neutral character. Paragraph spacing is intentionally generous (set to 1.6x - 1.8x the font size) to prevent "wall of text" fatigue. Display headers use tighter letter-spacing and heavier weights to provide a sophisticated, editorial contrast to the airy body text.

## Layout & Spacing

This design system employs a **Card-based Dashboard** layout built on a 12-column fluid grid. 

- **Sidebar:** A sticky navigation bar on the left (280px) remains persistent for high-performance switching between libraries and settings. It uses a glassmorphic background effect.
- **Main Canvas:** Content is organized into cards with a consistent 24px gutter.
- **Reading View:** When in "Focus Mode," the layout shifts to a single, centered column (max-width 720px) to maximize immersion.
- **Breakpoints:**
  - *Mobile (<768px):* Sidebar transforms into a bottom navigation bar or a hidden drawer. Margins reduce to 16px.
  - *Desktop (>1024px):* 12-column grid with 40px outer margins.

## Elevation & Depth

Hierarchy is established through **Glassmorphism** and **Ambient Shadows**.

1.  **Base Layer:** The neutral background (Slate 50).
2.  **Surface Layer (Cards):** Soft white surfaces with a 1px subtle stroke (#E2E8F0) and a very soft, diffused shadow (0px 10px 25px rgba(0, 0, 0, 0.03)).
3.  **Accent Layer (Floating UI):** Elements like "Now Reading" widgets use a backdrop-blur (12px) and a semi-transparent fill.
4.  **Glowing Accents:** Active states and primary buttons utilize a "bloom" effect—a soft outer glow colored by the primary Indigo (#6366F1) to suggest the interface is powered by light.

## Shapes

The shape language is consistently **Rounded (12px-16px)**. 

Standard components (Buttons, Inputs) use a 12px radius, while larger structural elements like Cards and Dashboard Sections use 16px. This high degree of roundedness removes the "sharpness" of technology, contributing to the "cozy" aspect of the brand. Interactive elements should feel like smooth, tumbled stones—tactile and friendly.

## Components

### Buttons
- **Primary:** Gradient fill (Indigo to Purple) with a soft shadow and a subtle white inner-glow on hover.
- **Ghost:** Transparent background with a 1px border. On hover, the background fills with a 5% opacity version of the primary color.

### Cards
- Standard cards feature a 1px "soft-touch" border and 16px rounded corners.
- In Dark Mode, cards utilize a subtle linear gradient fill (top-left to bottom-right) to give a sense of volume.

### Input Fields
- Inputs are minimalist, using a subtle background fill rather than a heavy border. On focus, the border glows with the primary Indigo color and the background shifts to pure white/dark slate.

### Reading Progress
- A custom "Glow-bar" component. The progress bar is a gradient that emits a soft light onto the surface below it.

### Sidebar Navigation
- Vertical items with high-contrast active states. Icons should be "Duotone" style, using the primary and secondary colors.

### The "Focus" Chip
- A specialized floating action element that toggles "Focus Mode," featuring high-intensity glassmorphism and a pulsing ambient glow to signify its importance.