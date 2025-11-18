import React from 'react';
import { View } from 'react-native';

export const BlurView = React.forwardRef((props, ref) => (
  <View {...props} ref={ref} testID={props.testID} />
));
BlurView.displayName = 'BlurView';