import React from 'react';
import { View, Text } from 'react-native';
import FamilySettingsPanel from './FamilySettings';

const SystemSettingsPanel: React.FC = () => {
  return (
    <View>
      <Text>System Settings</Text>
      <FamilySettingsPanel />
    </View>
  );
};

export default SystemSettingsPanel;
