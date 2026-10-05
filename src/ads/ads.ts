import mobileAds, {
  AdEventType,
  AdsConsent,
  InterstitialAd,
  MaxAdContentRating,
  RewardedAd,
  RewardedAdEventType,
  TestIds,
  type RequestOptions,
} from 'react-native-google-mobile-ads';
import { AD_KEYWORDS, CHILD_DIRECTED, PACING, configuredUnits } from './config';

const real = configuredUnits();
export const UNITS = {
  banner: (!__DEV__ && real.banner) || TestIds.ADAPTIVE_BANNER,
  // The test unit for interstitials that serves video, so the full-motion path gets exercised.
  interstitial: (!__DEV__ && real.interstitial) || TestIds.INTERSTITIAL_VIDEO || TestIds.INTERSTITIAL,
  rewarded: (!__DEV__ && real.rewarded) || TestIds.REWARDED,
};

export const REQUEST_OPTIONS: RequestOptions = {
  requestNonPersonalizedAdsOnly: true,
  keywords: AD_KEYWORDS,
};

let ready = false;
let sessionStart = Date.now();
let lastInterstitialAt = 0;
let interstitial: InterstitialAd | null = null;
let interstitialLoaded = false;

const readyListeners = new Set<() => void>();

export function adsReady(): boolean {
  return ready;
}

export function onAdsReady(listener: () => void): () => void {
  readyListeners.add(listener);
  return () => {
    readyListeners.delete(listener);
  };
}

/** Consent first, then configuration, then initialize — the order Google requires. */
export async function initAds(): Promise<void> {
  try {
    const consent = await AdsConsent.gatherConsent({ tagForUnderAgeOfConsent: CHILD_DIRECTED });
    if (!consent.canRequestAds) return;
    await mobileAds().setRequestConfiguration({
      maxAdContentRating: MaxAdContentRating.G,
      tagForChildDirectedTreatment: CHILD_DIRECTED,
      tagForUnderAgeOfConsent: CHILD_DIRECTED,
    });
    await mobileAds().initialize();
    ready = true;
    sessionStart = Date.now();
    readyListeners.forEach((l) => l());
    preloadInterstitial();
  } catch (e) {
    // Ads must never stop a family from using the app.
    console.warn('Ads unavailable', e);
  }
}

function preloadInterstitial() {
  if (!ready || interstitial) return;
  const ad = InterstitialAd.createForAdRequest(UNITS.interstitial, REQUEST_OPTIONS);
  interstitial = ad;
  interstitialLoaded = false;
  ad.addAdEventListener(AdEventType.LOADED, () => {
    interstitialLoaded = true;
  });
  ad.addAdEventListener(AdEventType.ERROR, () => {
    interstitial = null;
    interstitialLoaded = false;
  });
  ad.load();
}

/**
 * Shows a full-screen (often video) ad at a natural break — only ever when a parent
 * leaves the parent area, never in the middle of a kid's chore flow. Resolves once the
 * ad is closed, or immediately if pacing says not now.
 */
export function showInterstitialAtBreak(): Promise<void> {
  const now = Date.now();
  const tooSoon = now - lastInterstitialAt < PACING.interstitialGapMs || now - sessionStart < PACING.sessionGraceMs;
  const ad = interstitial;
  if (!ready || !ad || !interstitialLoaded || tooSoon) {
    preloadInterstitial();
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    const done = () => {
      interstitial = null;
      interstitialLoaded = false;
      preloadInterstitial();
      resolve();
    };
    ad.addAdEventListener(AdEventType.CLOSED, done);
    ad.addAdEventListener(AdEventType.ERROR, done);
    lastInterstitialAt = now;
    Promise.resolve(ad.show()).catch(done);
  });
}

/** Opt-in rewarded video. Resolves true only if the viewer earned the reward. */
export function showRewarded(): Promise<boolean> {
  if (!ready) return Promise.resolve(false);
  return new Promise((resolve) => {
    let earned = false;
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      resolve(earned);
    };
    const ad = RewardedAd.createForAdRequest(UNITS.rewarded, REQUEST_OPTIONS);
    ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
      Promise.resolve(ad.show()).catch(finish);
    });
    ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
      earned = true;
    });
    ad.addAdEventListener(AdEventType.CLOSED, finish);
    ad.addAdEventListener(AdEventType.ERROR, finish);
    ad.load();
    setTimeout(finish, 20_000); // never leave a parent waiting on a slow ad network
  });
}
