---
name: Frames Kinetic Minimal
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
  on-surface-variant: '#4e4544'
  inverse-surface: '#32302a'
  inverse-on-surface: '#f6f0e7'
  outline: '#807573'
  outline-variant: '#d1c3c2'
  surface-tint: '#675c5a'
  primary: '#1e1716'
  on-primary: '#ffffff'
  primary-container: '#342b2a'
  on-primary-container: '#9f9290'
  inverse-primary: '#d2c3c1'
  secondary: '#695d46'
  on-secondary: '#ffffff'
  secondary-container: '#efdec1'
  on-secondary-container: '#6d614a'
  tertiary: '#191914'
  on-tertiary: '#ffffff'
  tertiary-container: '#2e2d29'
  on-tertiary-container: '#97948e'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#efdfdd'
  primary-fixed-dim: '#d2c3c1'
  on-primary-fixed: '#221a19'
  on-primary-fixed-variant: '#4f4443'
  secondary-fixed: '#f2e0c4'
  secondary-fixed-dim: '#d5c5a9'
  on-secondary-fixed: '#231a09'
  on-secondary-fixed-variant: '#504530'
  tertiary-fixed: '#e6e2db'
  tertiary-fixed-dim: '#cac6bf'
  on-tertiary-fixed: '#1c1c17'
  on-tertiary-fixed-variant: '#484742'
  background: '#fff9ef'
  on-background: '#1d1b16'
  surface-variant: '#e7e2d9'
  charcoal-black: '#1A1616'
  paper-white: '#FFFFFF'
  muted-gold: '#C5B496'
typography:
  headline-xl:
    fontFamily: Hanken Grotesk
    fontSize: 48px
    fontWeight: '600'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
  button:
    fontFamily: Hanken Grotesk
    fontSize: 15px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-max: 1200px
  gutter: 24px
  margin-mobile: 20px
  margin-desktop: 40px
  stack-sm: 12px
  stack-md: 24px
  stack-lg: 48px
---

## Brand & Style

The design system is defined by a "Kinetic Minimalist" aesthetic. It targets a sophisticated audience that values clarity, precision, and a premium digital experience. The mood is calm yet authoritative, utilizing generous whitespace to allow content to breathe and "frame" the user's focus.

The visual language balances the warmth of the original beige foundations with the cold precision of deep charcoal and modern grotesque typography. Every element is intentional; there is no decoration for the sake of decoration. High-quality motion and subtle transitions should be used to provide a tactile feel to digital interactions, reinforcing the premium nature of the product.

## Colors

The palette is rooted in an elevated earth-tone spectrum. The primary color is a deep, warm charcoal (`#342B2A`), used for maximum contrast in typography and high-priority actions. The background remains a soft, hospitable beige (`#F6F0E7`), which reduces eye strain compared to pure white while maintaining a "gallery" feel.

Secondary colors are used sparingly for subtle UI highlights and disabled states, ensuring that the primary brand color and the content remain the focal points. Use `charcoal-black` for deep shadows and pure black text overrides, and `paper-white` exclusively for card backgrounds and input fills to create a tiered visual stack.

## Typography

This design system utilizes **Hanken Grotesk** as its primary typeface to provide a clean, sharp, and contemporary feel. Headlines use tighter letter-spacing and heavier weights to command attention. 

To introduce a technical, precise "frame" element, **JetBrains Mono** is used for small labels, metadata, and captions. This contrast between the humanist grotesque and the monospaced font creates an "architectural" look that feels engineered and premium.

## Layout & Spacing

The layout follows a fluid 12-column grid for desktop and a single-column stack for mobile. A strict 8px base unit governs all dimensions. 

- **Mobile:** Focus on vertical rhythm with `stack-md` between logical groups and `margin-mobile` safe zones.
- **Desktop:** Elements are centered within a `container-max` to ensure readability on ultrawide displays.
- **Whitespace:** Use "generous negative space" as a functional tool. If a section feels crowded, default to the next higher `stack` unit rather than adding borders.

## Elevation & Depth

Hierarchy is established through **Tonal Layering** rather than heavy shadows. 

1. **Base:** The canvas (`#F6F0E7`).
2. **Surface:** Cards and inputs (`#FFFFFF`) with a very soft, low-opacity ambient shadow (Blur: 20px, Y: 4px, Color: `rgba(52, 43, 42, 0.04)`).
3. **Interactive:** Buttons and active states use a slight vertical lift on hover.

Avoid heavy blurs or frosted glass. The goal is "physical paper on a wooden desk" — clean, flat, and tactile. Use subtle 1px borders in `tertiary_color_hex` to define boundaries where tonal contrast is insufficient.

## Shapes

The shape language is "Softly Geometric." A `0.5rem` (8px) base radius is applied to buttons, input fields, and cards to soften the minimalism and make the UI feel approachable. 

For large containers or "frames" (like image carousels), use `rounded-xl` (24px) to create a distinct, modern silhouette. Interactive components like chips or tags should use the `pill-shaped` utility to differentiate them from functional inputs.

## Components

### Buttons
- **Primary:** Solid `#342B2A` fill with white text. High-contrast, sharp, and commanding.
- **Secondary:** Transparent background with a 1.5px border of the primary color.
- **Tertiary:** Text-only with an underline on hover, using the `label-sm` monospaced font for a "meta" feel.

### Input Fields
Inputs are high-priority. They feature a `paper-white` background, a 1px border in `#E5E1DA`, and 16px of internal padding. On focus, the border shifts to the primary charcoal color with a subtle 2px outer glow. Labels should use `label-sm` and sit just above the field.

### Cards
Cards are used to group related content. They should have no border, a white fill, and the standard `rounded-lg` corner radius. Use them to "frame" data points against the beige background.

### Chips & Tags
Small, pill-shaped elements with a light grey or beige background. They should use `label-sm` typography to keep information dense and professional.

### Mobile Navigation
A bottom-docked navigation bar is preferred for reachability, using icons paired with monospaced labels for maximum clarity.