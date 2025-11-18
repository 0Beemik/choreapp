import React from 'react';
import { StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

export interface BlurOverlayProps {
  visible: { value: number }; // Shared value from parent
  testID?: string;
}

export const BlurOverlay: React.FC<BlurOverlayProps> = ({ visible, testID }) => {
  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(visible.value, { duration: 300 }),
      display: visible.value > 0 ? 'flex' : 'none',
    };
  });

  return (
    <AnimatedBlurView
      testID={testID}
      tint="light"
      intensity={50}
      style={[StyleSheet.absoluteFill, animatedStyle]}
    />
  );
};
