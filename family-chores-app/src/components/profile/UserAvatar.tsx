import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import Avatar from 'react-native-avataaars';
import { AvatarConfig, DEFAULT_AVATAR_CONFIG } from '../../types/avatar';
import { AvatarPicker } from './AvatarPicker';

interface UserAvatarProps {
  config?: AvatarConfig;
  size?: number;
  editable?: boolean;
  onConfigChange?: (config: AvatarConfig) => void;
  initials?: string; // Fallback if no avatar config
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  config,
  size = 80,
  editable = false,
  onConfigChange,
  initials,
}) => {
  const [pickerVisible, setPickerVisible] = useState(false);

  const handleSave = (newConfig: AvatarConfig) => {
    if (onConfigChange) {
      onConfigChange(newConfig);
    }
    setPickerVisible(false);
  };

  const renderAvatar = () => {
    if (config) {
      return <Avatar size={size} {...config} />;
    }

    // Fallback to initials
    if (initials) {
      return (
        <View
          style={[
            styles.initialsContainer,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
            },
          ]}
        >
          <Text style={[styles.initialsText, { fontSize: size / 2.5 }]}>
            {initials}
          </Text>
        </View>
      );
    }

    // Default avatar
    return <Avatar size={size} {...DEFAULT_AVATAR_CONFIG} />;
  };

  if (!editable) {
    return <View>{renderAvatar()}</View>;
  }

  return (
    <View>
      <TouchableOpacity onPress={() => setPickerVisible(true)}>
        {renderAvatar()}
        <View style={styles.editBadge}>
          <Text style={styles.editText}>✏️</Text>
        </View>
      </TouchableOpacity>

      <AvatarPicker
        visible={pickerVisible}
        initialConfig={config || DEFAULT_AVATAR_CONFIG}
        onSave={handleSave}
        onCancel={() => setPickerVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  initialsContainer: {
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsText: {
    color: '#fff',
    fontWeight: '600',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  editText: {
    fontSize: 12,
  },
});
