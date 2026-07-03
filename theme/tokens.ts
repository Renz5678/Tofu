/**
 * Tofu Design Tokens — single source of truth
 * Sourced from stitch_tofu_reading_habit_tracker/tofu/DESIGN.md and mockup HTML files
 */

// ─────────────────────────────────────────────
// Colors (Material Design 3 color scheme)
// ─────────────────────────────────────────────
export const Colors = {
  // Primary brand — slate blue
  primary: '#2d3a47',
  onPrimary: '#ffffff',
  primaryContainer: '#404e5d',
  onPrimaryContainer: '#d8e3f0',
  inversePrimary: '#a5b5c9',
  primaryFixed: '#d0e4ff',
  primaryFixedDim: '#a8c8ec',
  onPrimaryFixed: '#001d32',
  onPrimaryFixedVariant: '#344758',

  // Secondary — muted sage
  secondary: '#576158',
  onSecondary: '#ffffff',
  secondaryContainer: '#d8e2d7',
  onSecondaryContainer: '#5b655c',
  secondaryFixed: '#dbe5da',
  secondaryFixedDim: '#bfc9bf',
  onSecondaryFixed: '#151e17',
  onSecondaryFixedVariant: '#404941',

  // Tertiary — soft terracotta (streak/milestone highlights)
  tertiary: '#5c3407',
  onTertiary: '#ffffff',
  tertiaryContainer: '#774b1d',
  onTertiaryContainer: '#fbbe85',
  tertiaryFixed: '#ffdcbf',
  tertiaryFixedDim: '#f7ba82',
  onTertiaryFixed: '#2d1600',
  onTertiaryFixedVariant: '#663d10',

  // Error
  error: '#ba1a1a',
  onError: '#ffffff',
  errorContainer: '#ffdad6',
  onErrorContainer: '#93000a',

  // Background / Surface
  background: '#fbf9f4',         // soft cream
  onBackground: '#1b1c19',
  surface: '#fbf9f4',
  onSurface: '#1b1c19',
  surfaceDim: '#dbdad5',
  surfaceBright: '#fbf9f4',
  surfaceTint: '#4c5d70',

  // Surface containers (elevation layers)
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow: '#f5f3ee',
  surfaceContainer: '#f0eee9',
  surfaceContainerHigh: '#eae8e3',
  surfaceContainerHighest: '#e4e2dd',

  // On-surface / variants
  onSurfaceVariant: '#404945',
  surfaceVariant: '#e4e2dd',
  inverseSurface: '#30312e',
  inverseOnSurface: '#f2f1ec',

  // Borders / outlines
  outline: '#707974',
  outlineVariant: '#c0c9c3',

  // Convenience aliases for usage in components
  cardBackground: '#ffffff',
  tabBarBackground: '#ffffff',
  tabBarBorder: '#c0c9c3',
  activeTab: '#2d3a47',
  inactiveTab: '#1b1c19',
  chipActive: '#d8e2d7',
  chipActiveText: '#5b655c',
  chipInactive: '#f0eee9',
  chipInactiveText: '#404945',
} as const;

// ─────────────────────────────────────────────
// Typography
// Fonts: Literata (serif/display) + Hanken Grotesk (sans-serif/UI)
// ─────────────────────────────────────────────
export const Typography = {
  fonts: {
    serif: 'Literata_700Bold',
    serifSemiBold: 'Literata_600SemiBold',
    serifRegular: 'Literata_400Regular',
    sans: 'HankenGrotesk_400Regular',
    sansMedium: 'HankenGrotesk_500Medium',
    sansSemiBold: 'HankenGrotesk_600SemiBold',
    sansBold: 'HankenGrotesk_700Bold',
  },

  // Scale — matches DESIGN.md exactly
  styles: {
    displayLg: {
      fontFamily: 'Literata_700Bold',
      fontSize: 32,
      lineHeight: 40,
      letterSpacing: -0.64, // -0.02em at 32px
      fontWeight: '700' as const,
    },
    displayLgMobile: {
      fontFamily: 'Literata_700Bold',
      fontSize: 28,
      lineHeight: 34,
      letterSpacing: -0.56, // -0.02em at 28px
      fontWeight: '700' as const,
    },
    headlineMd: {
      fontFamily: 'Literata_600SemiBold',
      fontSize: 24,
      lineHeight: 32,
      fontWeight: '600' as const,
    },
    titleSm: {
      fontFamily: 'Literata_600SemiBold',
      fontSize: 18,
      lineHeight: 24,
      fontWeight: '600' as const,
    },
    bodyMd: {
      fontFamily: 'HankenGrotesk_400Regular',
      fontSize: 16,
      lineHeight: 24,
      fontWeight: '400' as const,
    },
    labelLg: {
      fontFamily: 'HankenGrotesk_600SemiBold',
      fontSize: 14,
      lineHeight: 20,
      letterSpacing: 0.14, // 0.01em at 14px
      fontWeight: '600' as const,
    },
    labelSm: {
      fontFamily: 'HankenGrotesk_500Medium',
      fontSize: 12,
      lineHeight: 16,
      letterSpacing: 0.48, // 0.04em at 12px
      fontWeight: '500' as const,
    },
    numericXl: {
      fontFamily: 'HankenGrotesk_700Bold',
      fontSize: 48,
      lineHeight: 48,
      letterSpacing: -1.92, // -0.04em at 48px
      fontWeight: '700' as const,
    },
  },
} as const;

// ─────────────────────────────────────────────
// Spacing — 8px base grid
// ─────────────────────────────────────────────
export const Spacing = {
  base: 8,           // 8px
  stackSm: 12,       // 12px
  gutter: 16,        // 16px
  stackMd: 24,       // 24px
  containerPadding: 20, // 20px
  stackLg: 40,       // 40px
} as const;

// ─────────────────────────────────────────────
// Border radius
// ─────────────────────────────────────────────
export const Radius = {
  sm: 4,      // 0.25rem — book cover spine edge
  md: 8,      // 0.5rem  — default / inputs
  lg: 12,     // 0.75rem — buttons/inputs (named md in mockup but 12px)
  xl: 16,     // 1rem    — standard cards
  xxl: 24,    // 1.5rem  — rounded-xl
  full: 9999, // pill shapes
} as const;

// ─────────────────────────────────────────────
// Shadows — tinted with primary green at low opacity
// ─────────────────────────────────────────────
export const Shadows = {
  card: {
    shadowColor: '#2d3a47',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 3,
  },
  overlay: {
    shadowColor: '#2d3a47',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 6,
  },
  button: {
    shadowColor: '#2d3a47',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
} as const;

// ─────────────────────────────────────────────
// Tab bar config (icon names from @expo/vector-icons MaterialIcons)
// ─────────────────────────────────────────────
export const TabConfig = [
  { name: 'dashboard', label: 'Home',    icon: 'home' },
  { name: 'library',   label: 'Library', icon: 'import-contacts' },
  { name: 'search',    label: 'Search',  icon: 'search' },
  { name: 'stats',     label: 'Stats',   icon: 'leaderboard' },
  { name: 'profile',   label: 'Profile', icon: 'person' },
] as const;
