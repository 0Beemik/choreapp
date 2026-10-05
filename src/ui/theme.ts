export const colors = {
  bg: '#FFF8EE',
  surface: '#FFFFFF',
  surfaceAlt: '#FFF1DC',
  text: '#2B2340',
  textMuted: '#6E6787',
  primary: '#6C5CE7',
  primaryText: '#FFFFFF',
  success: '#2EAD6B',
  successSoft: '#DFF6E9',
  warning: '#F2994A',
  warningSoft: '#FDEBD9',
  danger: '#E5484D',
  dangerSoft: '#FDE2E2',
  border: '#EADFCF',
  gold: '#F5B700',
} as const;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

export const radius = { sm: 8, md: 14, lg: 20, pill: 999 } as const;

export const font = {
  small: 13,
  body: 16,
  large: 19,
  title: 24,
  hero: 32,
} as const;

/** Kids this age or younger get the big, picture-first layout. */
export const LITTLE_KID_MAX_AGE = 6;
