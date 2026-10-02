import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Kids use this app directly (the chore board), so it falls under Google Play's Families
 * policy and COPPA. Every request is tagged child-directed and capped at G-rated content,
 * which means contextual (non-personalized) ads only. Do not flip this without legal advice.
 */
export const CHILD_DIRECTED = true;

/** Contextual hints so advertisers like cleaning/household/family brands can find us. */
export const AD_KEYWORDS = ['family', 'household', 'cleaning', 'home', 'parenting'];

export const PACING = {
  /** Minimum gap between full-screen video ads. */
  interstitialGapMs: 5 * 60 * 1000,
  /** No full-screen ad until the app has been open this long in a session. */
  sessionGraceMs: 60 * 1000,
  /** Opt-in "watch a video for a family bonus" limit. */
  rewardedPerDay: 1,
  rewardedBonusPoints: 5,
};

type Units = { banner: string; interstitial: string; rewarded: string };

/**
 * Production unit IDs come from app.json → expo.extra.adUnits.{android,ios}. Until they are
 * filled in (or in development) Google's official test units are used, which never pay out.
 */
export function configuredUnits(): Partial<Units> {
  const all = (Constants.expoConfig?.extra as { adUnits?: Record<string, Partial<Units>> } | undefined)?.adUnits;
  const units = all?.[Platform.OS] ?? {};
  return Object.fromEntries(Object.entries(units).filter(([, v]) => typeof v === 'string' && v.startsWith('ca-app-pub-')));
}
