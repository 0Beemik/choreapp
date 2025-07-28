import React, { useState } from 'react';
import { User } from '../../../models/User';
import { AvatarContainer, AvatarImage, AvatarText, Badge } from './Avatar.styles';

export interface AvatarProps {
  user?: User;
  size?: 'small' | 'medium' | 'large';
  onPress?: () => void;
  showBadge?: boolean;
  disabled?: boolean;
}

export const Avatar: React.FC<AvatarProps> = ({
  user,
  size = 'medium',
  onPress,
  showBadge = false,
  disabled,
}) => {
  const [hasError, setHasError] = useState(false);

  const renderContent = () => {
    if (user?.avatarPath && !hasError) {
      return (
        <AvatarImage
          source={{ uri: user.avatarPath }}
          size={size}
          onError={() => setHasError(true)}
          testID="avatar-image"
        />
      );
    }
    if (user?.name) {
      return <AvatarText size={size}>{user.name.charAt(0).toUpperCase()}</AvatarText>;
    }
    return null;
  };

  return (
    <AvatarContainer
      size={size}
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={user ? `Avatar for ${user.name}` : 'Avatar'}
      accessibilityRole="button"
    >
      {renderContent()}
      {showBadge && <Badge size={size} testID="avatar-badge" />}
    </AvatarContainer>
  );
};