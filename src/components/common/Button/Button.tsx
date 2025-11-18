import React from 'react';
import { ButtonContainer, ButtonText } from './Button.styles';
import { ActivityIndicator } from 'react-native';

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  accessibilityLabel?: string;
  testID?: string;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  accessibilityLabel,
  testID,
}) => {
  return (
    <ButtonContainer
      onPress={onPress}
      variant={variant}
      size={size}
      disabled={disabled || loading}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      testID={testID}
    >
      {loading ? (
        <ActivityIndicator color="#fff" testID="loading-indicator" />
      ) : (
        <ButtonText size={size}>{title}</ButtonText>
      )}
    </ButtonContainer>
  );
};
