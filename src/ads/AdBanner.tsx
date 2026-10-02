import { useState, useSyncExternalStore } from 'react';
import { View } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { adsReady, onAdsReady, REQUEST_OPTIONS, UNITS } from './ads';

/** Anchored adaptive banner. Collapses to nothing if ads are off or nothing fills. */
export function AdBanner() {
  const [failed, setFailed] = useState(false);
  const ready = useSyncExternalStore(onAdsReady, adsReady);
  if (!ready || failed) return null;
  return (
    <View style={{ alignItems: 'center' }} testID="ad-banner">
      <BannerAd
        unitId={UNITS.banner}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={REQUEST_OPTIONS}
        onAdFailedToLoad={() => setFailed(true)}
      />
    </View>
  );
}
