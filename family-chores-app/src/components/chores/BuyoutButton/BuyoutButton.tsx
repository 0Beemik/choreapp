import React from 'react';
import { Button } from '../../common/Button/Button';

export interface BuyoutButtonProps {
  onPress: () => void;
  disabled?: boolean;
  canAfford: boolean;
}

export const BuyoutButton: React.FC<BuyoutButtonProps> = ({
  onPress,
  disabled,
  canAfford,
}) => {
  return (
    <Button
      title="Buyout"
      onPress={onPress}
      disabled={disabled || !canAfford}
      variant="secondary"
      size="small"
    />
  );
};
