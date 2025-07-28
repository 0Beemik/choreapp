import React from 'react';
import { View } from 'react-native';
import {
  ProgressContainer,
  ProgressBar,
  ProgressText,
} from './ProgressIndicator.styles';

export interface ProgressIndicatorProps {
  total: number;
  completed: number;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  total,
  completed,
}) => {
  const progress = total > 0 ? (completed / total) * 100 : 0;

  return (
    <View>
      <ProgressText>{`${completed} / ${total} chores completed`}</ProgressText>
      <ProgressContainer>
        <ProgressBar progress={progress} testID="progress-bar" />
      </ProgressContainer>
    </View>
  );
};
