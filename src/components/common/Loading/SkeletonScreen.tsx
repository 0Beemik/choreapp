import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated';

const SkeletonPiece: React.FC<{ style: View['props']['style'] }> = ({ style }) => {
  const shimmerValue = useSharedValue(0.5);

  React.useEffect(() => {
    shimmerValue.value = withRepeat(
      withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [shimmerValue]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: shimmerValue.value,
  }));

  return <Animated.View style={[styles.skeleton, style, animatedStyle]} testID="skeleton-piece" />;
};

export const SkeletonScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <SkeletonPiece style={{ width: '80%', height: 40, marginBottom: 20 }} />
      <SkeletonPiece style={{ width: '100%', height: 100, marginBottom: 10 }} />
      <SkeletonPiece style={{ width: '100%', height: 100, marginBottom: 10 }} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f0f0f0',
  },
  skeleton: {
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
  },
});