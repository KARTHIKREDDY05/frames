---
name: Frames Neo-Scrapbook
colors:
  surface: '#fff9ef'
  surface-dim: '#dfd9d1'
  surface-bright: '#fff9ef'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f9f3ea'
  surface-container: '#f3ede4'
  surface-container-high: '#ede7de'
  surface-container-highest: '#e7e2d9'
  on-surface: '#1d1b16'
  on-surface-variant: '#464835'
  inverse-surface: '#32302a'
  inverse-on-surface: '#f6f0e7'
  outline: '#767963'
  outline-variant: '#c6c9af'
  surface-tint: '#566500'
  primary: '#566500'
  on-primary: '#ffffff'
  primary-container: '#e2ff52'
  on-primary-container: '#647500'
  inverse-primary: '#b8d325'
  secondary: '#5c5d6e'
  on-secondary: '#ffffff'
  secondary-container: '#e1e1f5'
  on-secondary-container: '#626374'
  tertiary: '#5d5e5f'
  on-tertiary: '#ffffff'
  tertiary-container: '#f2f1f1'
  on-tertiary-container: '#6c6e6e'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d3f043'
  primary-fixed-dim: '#b8d325'
  on-primary-fixed: '#181e00'
  on-primary-fixed-variant: '#404c00'
  secondary-fixed: '#e1e1f5'
  secondary-fixed-dim: '#c5c5d8'
  on-secondary-fixed: '#191b29'
  on-secondary-fixed-variant: '#444655'
  tertiary-fixed: '#e2e2e2'
  tertiary-fixed-dim: '#c6c6c6'
  on-tertiary-fixed: '#1a1c1c'
  on-tertiary-fixed-variant: '#454747'
  background: '#fff9ef'
  on-background: '#1d1b16'
  surface-variant: '#e7e2d9'
  electric-ink: '#000000'
  paper-cream: '#F6F0E7'
  acid-yellow: '#E2FF52'
  soft-lavender: '#E6E6FA'
  y2k-silver: '#D1D1D1'
typography:
  display-lg:
    fontFamily: Bricolage Grotesque
    fontSize: 56px
    fontWeight: '800'
    lineHeight: 52px
    letterSpacing: -0.04em
  headline-lg:
    fontFamily: Bricolage Grotesque
    fontSize: 32px
    fontWeight: '800'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Bricolage Grotesque
    fontSize: 28px
    fontWeight: '800'
    lineHeight: 32px
    letterSpacing: -0.02em
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '500'
    lineHeight: 26px
    letterSpacing: -0.01em
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '500'
    lineHeight: 24px
  metadata-stamped:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.1em
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 10px
    fontWeight: '700'
    lineHeight: 12px
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 32px
  border-thin: 1px
  stack-tight: 8px
  stack-loose: 32px
---

## Brand & Style
The design system is defined by a **Neo-Brutalist Digital Scrapbook** aesthetic, tailored for a Gen-Z audience that values raw authenticity mixed with high-energy digital culture. It breaks the "clean" corporate mold by introducing intentional friction: sharp contrasts, irregular textures, and a kinetic, "stamped" layout language.

The personality is **Raw, Kinetic, and Premium**. It feels like a high-end fashion zine or a DIY physical scrapbook translated into a sleek, tech-forward mobile interface. We use "Paper Cream" to maintain a tactile, physical foundation, then disrupt it with "Electric Ink" and "Acid Yellow" to inject energy and urgency.

## Colors
The palette is a high-contrast interplay between organic textures and synthetic highlights. 

- **Primary (Acid Yellow):** Used exclusively for high-energy highlights, active states, and "look at me" moments. It should feel vibrantly digital.
- **Neutral (Paper Cream & Electric Ink):** The "Paper Cream" acts as the canvas, while "Electric Ink" provides the structural skeleton through thin 1px borders and sharp typography.
- **Secondary Accents:** "Soft Lavender" and "Y2K Silver" are used for secondary UI elements like tags, background surfaces for metadata, and "tech" accents that prevent the design from feeling too flatly retro.

## Typography
Typography is the core of the "Digital Scrapbook" vibe. 

- **Headlines:** Use **Bricolage Grotesque** with extremely tight tracking and heavy weights. Headlines should feel "loud" and slightly quirky.
- **Body:** **Hanken Grotesk** provides a clean, contemporary balance to the louder display type, ensuring long-form captions remain readable.
- **Metadata/Coded:** **JetBrains Mono** is used for all timestamps, technical data, and "stamped" dates. This font should always be in uppercase with increased letter spacing to mimic a physical ink stamp or code block.

## Layout & Spacing
The layout follows a **Fluid Grid** with a Neo-Brutalist lean. We prioritize tight, intentional grouping of elements followed by large "breathing rooms" of Paper Cream.

- **Grid:** Use a 4px base unit. Elements should often be "tilted" by 1-2 degrees (especially images/cards) to break the digital perfection.
- **Borders:** A 1px Electric Ink border is the primary separator. Avoid using shadows for separation; use these thin borders instead.
- **Reflow:** On mobile, margins are kept tight (16px) to maximize the "full-bleed" feel of scrapbook imagery. On desktop, content is contained in a 12-column grid but allows for overlapping "sticker" elements that break the column lines.

## Elevation & Depth
In this design system, depth is achieved through **Hard Shadows** and **Collage Layering** rather than blurs.

- **Shadows:** Use "Hard Shadows"—solid black shapes offset by 4px or 8px with 0px blur. This creates a "cut-out" physical effect.
- **Layering:** Elements should feel like they are "taped" or "stamped" onto the surface. Use 1px borders for all containers. 
- **Overlays:** Introduce "Washi Tape" textures or "Sticker" overlays (semi-transparent Soft Lavender or Acid Yellow shapes) to imply a stacked physical depth. No glassmorphism or soft glows.

## Shapes
The shape language is primarily **Sharp and Geometric**. We use a `0.25rem` (4px) radius to keep the "tech-forward" feel while avoiding the coldness of 90-degree corners.

- **Images:** Polaroid frames should use "slightly irregular" edges (achieved via SVG masks) to simulate torn paper or physical film.
- **Interactive:** Buttons and inputs use the standard 4px radius. 
- **Accents:** Use perfectly sharp corners for "sticker" elements or "tape" strips to provide a visual contrast against the slightly softened primary containers.

## Components

### Buttons
- **Primary:** Acid Yellow fill with 1px Electric Ink border and a 4px hard black shadow. Text in `label-caps`.
- **Secondary:** Soft Lavender fill, 1px border, no shadow.
- **Ghost:** Paper Cream background with a 1px dashed border.

### Polaroid Cards
The signature component. A White Paper background with 1px borders. The photo inside should have a subtle `-1deg` tilt. Metadata (dates/location) is "stamped" on the bottom margin using `metadata-stamped` JetBrains Mono.

### Inputs & Fields
Flat Paper Cream background with a 1px Electric Ink border. On focus, the background shifts to a very pale Soft Lavender, and the border thickness doubles to 2px. Labels sit inside the border in the top-left, using `label-caps`.

### Chips & Tags
Small, sharp-edged rectangles in Y2K Silver or Soft Lavender. Text is monospaced. They should look like "Dymo" embossed labels or printed stickers.

### Tape & Stickers
Visual accents used to "hold" items in place. Rectangular overlays with 60% opacity in Soft Lavender or Acid Yellow, typically placed at corners of images or cards.