// The web build has no AdMob; every call is a no-op so the app still runs in a browser.
export const adsReady = () => false;
export const onAdsReady = (_listener: () => void) => () => {};
export const initAds = async () => {};
export const showInterstitialAtBreak = async () => {};
export const showRewarded = async () => false;
