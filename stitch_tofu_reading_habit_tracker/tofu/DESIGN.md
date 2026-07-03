---
name: Tofu
colors:
  surface: '#fbf9f4'
  surface-dim: '#dbdad5'
  surface-bright: '#fbf9f4'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f3ee'
  surface-container: '#f0eee9'
  surface-container-high: '#eae8e3'
  surface-container-highest: '#e4e2dd'
  on-surface: '#1b1c19'
  on-surface-variant: '#404945'
  inverse-surface: '#30312e'
  inverse-on-surface: '#f2f1ec'
  outline: '#707974'
  outline-variant: '#c0c9c3'
  surface-tint: '#376757'
  primary: '#144637'
  on-primary: '#ffffff'
  primary-container: '#2e5e4e'
  on-primary-container: '#a3d5c1'
  inverse-primary: '#9fd1bd'
  secondary: '#576158'
  on-secondary: '#ffffff'
  secondary-container: '#d8e2d7'
  on-secondary-container: '#5b655c'
  tertiary: '#5c3407'
  on-tertiary: '#ffffff'
  tertiary-container: '#774b1d'
  on-tertiary-container: '#fbbe85'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#baeed9'
  primary-fixed-dim: '#9fd1bd'
  on-primary-fixed: '#002117'
  on-primary-fixed-variant: '#1e4f40'
  secondary-fixed: '#dbe5da'
  secondary-fixed-dim: '#bfc9bf'
  on-secondary-fixed: '#151e17'
  on-secondary-fixed-variant: '#404941'
  tertiary-fixed: '#ffdcbf'
  tertiary-fixed-dim: '#f7ba82'
  on-tertiary-fixed: '#2d1600'
  on-tertiary-fixed-variant: '#663d10'
  background: '#fbf9f4'
  on-background: '#1b1c19'
  surface-variant: '#e4e2dd'
typography:
  display-lg:
    fontFamily: Literata
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Literata
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 34px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Literata
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  title-sm:
    fontFamily: Literata
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-lg:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.04em
  numeric-xl:
    fontFamily: Hanken Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.04em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  container-padding: 20px
  stack-sm: 12px
  stack-md: 24px
  stack-lg: 40px
  gutter: 16px
---

## Brand & Style

The design system is built for a reading habit tracker that treats intellectual growth with the same discipline and vitality as physical fitness. The brand personality is "Warm Editorial"—blending the sophisticated, quiet atmosphere of a physical library with the energetic, progress-oriented feedback loops of a modern fitness application.

The visual style leans into **Minimalism** with a **Tactile** edge. It prioritizes focus through generous white space and high-quality typography, while using soft shadows and layered surfaces to provide a sense of physical presence. The emotional response should be one of "Calm Productivity"—lowering the barrier to entry for reading while making the achievement of daily goals feel rewarding and substantial.

## Colors

The palette is grounded in organic, earthy tones to reduce eye strain during long sessions. 

- **Primary (#2E5E4E):** A deep forest green used for primary actions, progress rings, and active states. It represents growth and focus.
- **Secondary (#D9E3D8):** A muted sage used for "track" backgrounds and secondary buttons.
- **Tertiary (#E8AD76):** A soft terracotta used sparingly for "streak" highlights or special milestones to provide warmth.
- **Background (#F7F5F0):** A soft cream (off-white) that serves as the base, providing a more "paper-like" feel than pure white.
- **Text (#1A1A1A):** Warm charcoal ensures high legibility without the harshness of pure black.

## Typography

This design system uses a dual-font strategy. **Literata** (Serif) is reserved for book titles, major headings, and editorial moments, evoking the feeling of a printed page. **Hanken Grotesk** (Sans-Serif) handles all functional UI tasks: navigation, labels, data points, and body copy.

Large numeric displays (like "Minutes Read") should use Hanken Grotesk with tight letter spacing to mirror the aesthetic of high-end activity trackers. Maintain a clear hierarchy where the Serif font always denotes "Content" and the Sans-Serif font always denotes "Interface."

## Layout & Spacing

The layout follows a **Fluid Grid** model optimized for mobile devices. It utilizes a 4-column structure for phone screens with a standard 20px horizontal margin to give content "room to breathe."

- **Vertical Rhythm:** Use 8px increments. Components are separated by 24px (stack-md) to maintain an airy, calm feel.
- **Touch Targets:** All interactive elements maintain a minimum height of 48px.
- **Safe Areas:** Adhere strictly to iOS/Android safe area insets for bottom tab bars and top navigation headers.

## Elevation & Depth

Depth is achieved through **Ambient Shadows** and **Tonal Layers**. Instead of harsh black shadows, this design system uses soft, diffused shadows tinted with the primary forest green (at very low opacity) to maintain warmth.

- **Level 0 (Base):** Soft Cream (#F7F5F0).
- **Level 1 (Cards):** White (#FFFFFF) with a 12% blur shadow (0px 4px 20px rgba(46, 94, 78, 0.08)).
- **Level 2 (Overlays/Modals):** White (#FFFFFF) with a 20% blur shadow.
- **Interactions:** Buttons should feel tactile; a subtle "press" effect (reducing shadow and scale slightly to 0.98) is preferred over simple color changes.

## Shapes

The shape language is consistently **Rounded**, promoting a friendly and non-intimidating user experience. 

- **Standard Cards:** 16px (rounded-lg) corner radius.
- **Buttons & Inputs:** 12px (default) corner radius.
- **Book Covers:** Use a subtle 4px radius on the right side and 2px on the left to mimic a book spine/edge, but keep the overall container within the 16px rounded card rules.
- **Progress Rings:** Use rounded caps for all stroke-based indicators.

## Components

### Buttons
Primary buttons use the Forest Green background with White text. Secondary buttons use a Sage tint (#D9E3D8) with Forest Green text. Large, full-width buttons are preferred for primary "Start Reading" actions.

### Progress Indicators
- **Rings:** Used for daily goals. The stroke width should be 8px-12px with rounded ends. Use a track color of 10% opacity Primary Green.
- **Slim Bars:** Used for "Chapter Progress" within a card. These should be 4px height with fully rounded ends.

### Cards
Cards are the primary container. They must always have the 16px radius and a soft shadow. Book cards feature a prominent cover image on the left or top, with titles in Literata.

### Bottom Tab Navigation
A clean, persistent bar with a 0.5px top border (Sage). Use labeled icons. The active state is indicated by a Primary Green icon; the inactive state uses Warm Charcoal at 40% opacity.

### Input Fields
Soft cream background with a 1px Sage border. On focus, the border thickens to 2px Primary Green. Labels are always Hanken Grotesk Bold 12px, positioned above the field.

### Chips
Used for genres or reading status (e.g., "Currently Reading"). Small, pill-shaped elements with a Sage background and Forest Green text.