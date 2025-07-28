import React from 'react';
import { View, Text } from 'react-native';
import AllowanceSettingsPanel from './AllowanceSettings';

const PointsManagementPanel: React.FC = () => {
  return (
    <View>
      <Text>Points Management</Text>
      <AllowanceSettingsPanel />
    </View>
  );
};

export default PointsManagementPanel;
