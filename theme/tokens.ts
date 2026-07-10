/**
 * Tofu Design Tokens — single source of truth
 * Sourced from stitch_tofu_reading_habit_tracker/tofu/DESIGN.md and mockup HTML files
 */

// ─────────────────────────────────────────────
// Colors (Material Design 3 color scheme)
// ─────────────────────────────────────────────
export const LightColors = {
  // Primary brand — Midnight Lagoon
  primary: '#2d3a47',
  onPrimary: '#ffffff',
  primaryContainer: '#e1e5e9',
  onPrimaryContainer: '#1c252d',
  inversePrimary: '#a5b5c9',
  
  // Secondary
  secondary: '#8c867b',
  onSecondary: '#ffffff',
  secondaryContainer: '#f4f0ea',
  onSecondaryContainer: '#3d3932',
  
  // Error
  error: '#ba1a1a',
  onError: '#ffffff',
  errorContainer: '#ffdad6',
  onErrorContainer: '#93000a',

  // Background / Surface (Minimalist Apple-style)
  background: '#ffffff',
  onBackground: '#1a1a1a',
  surface: '#ffffff',
  onSurface: '#1a1a1a',
  
  // Surface containers
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow: '#f5f5f7',
  surfaceContainer: '#ebebeb',
  surfaceContainerHigh: '#e0e0e0',
  surfaceContainerHighest: '#d6d6d6',

  // Variants
  onSurfaceVariant: '#6e6e73',
  outline: '#d2d2d7',
  outlineVariant: '#e5e5ea',

  // Aliases
  tabBarBackground: '#ffffff',
  tabBarBorder: '#e5e5ea',
  activeTab: '#2d3a47',
  inactiveTab: '#8e8e93',
} as const;

export const DarkColors = {
  // Primary brand — Lighter Midnight Lagoon for contrast
  primary: '#4c647a',
  onPrimary: '#ffffff',
  primaryContainer: '#1f2831',
  onPrimaryContainer: '#a8c8ec',
  inversePrimary: '#2d3a47',
  
  // Secondary
  secondary: '#b4afa9',
  onSecondary: '#3d3932',
  secondaryContainer: '#403d38',
  onSecondaryContainer: '#f4f0ea',
  
  // Error
  error: '#ffb4ab',
  onError: '#690005',
  errorContainer: '#93000a',
  onErrorContainer: '#ffdad6',

  // Background / Surface (Minimalist Dark)
  background: '#000000',
  onBackground: '#ffffff',
  surface: '#0a0a0a',
  onSurface: '#ffffff',
  
  // Surface containers
  surfaceContainerLowest: '#000000',
  surfaceContainerLow: '#1c1c1e',
  surfaceContainer: '#2c2c2e',
  surfaceContainerHigh: '#3a3a3c',
  surfaceContainerHighest: '#48484a',

  // Variants
  onSurfaceVariant: '#ebebf5',
  outline: '#38383a',
  outlineVariant: '#2c2c2e',

  // Aliases
  tabBarBackground: '#1c1c1e',
  tabBarBorder: '#38383a',
  activeTab: '#4c647a',
  inactiveTab: '#8e8e93',
} as const;

export type AppColors = Record<keyof typeof LightColors, string>;

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
  xs: 4,      // Tiny chips, inner badges
  sm: 6,      // Buttons, small inputs
  md: 10,     // Cards, panels
  lg: 14,     // Modals, drawers, large cards
  xl: 18,     // Hero blocks, feature sections
  xxl: 24,    // rounded-2xl
  full: 9999, // pill shapes
} as const;

// ─────────────────────────────────────────────
// Shadows — tinted with primary green at low opacity
// ─────────────────────────────────────────────
export const Shadows = {
  card: {
    shadowColor: '#2d3a47',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  overlay: {
    shadowColor: '#2d3a47',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.09,
    shadowRadius: 24,
    elevation: 6,
  },
  button: {
    shadowColor: '#2d3a47',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
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
