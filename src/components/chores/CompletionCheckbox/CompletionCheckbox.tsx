import React from 'react';
import { CheckboxContainer, CheckboxInner } from './CompletionCheckbox.styles';
import { TouchableOpacity } from 'react-native';

export interface CompletionCheckboxProps {
  checked: boolean;
  onPress: () => void;
  disabled?: boolean;
}

export const CompletionCheckbox: React.FC<CompletionCheckboxProps> = ({
  checked,
  onPress,
  disabled,
}) => {
  return (
    <TouchableOpacity onPress={onPress} disabled={disabled} accessibilityRole="checkbox" accessibilityState={{ checked }}>
      <CheckboxContainer checked={checked} disabled={disabled}>
        {checked && <CheckboxInner />}
      </CheckboxContainer>
    </TouchableOpacity>
  );
};
