
import React from 'react';
import { View, useWindowDimensions, StyleSheet } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';

const adUnitId = TestIds.BANNER;

const AdView = () => {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  return (
    <View style={isLandscape ? styles.adContainerLandscape : styles.adContainerPortrait}>
      <BannerAd
        unitId={adUnitId}
        size={isLandscape ? BannerAdSize.MEDIUM_RECTANGLE : BannerAdSize.BANNER}
        requestOptions={{
          requestNonPersonalizedAdsOnly: true,
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  adContainerPortrait: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  adContainerLandscape: {
    position: 'absolute',
    bottom: 10,
    right: 10,
  },
});

export default AdView;
