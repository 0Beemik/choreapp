import React from 'react';
import { View, StyleSheet, Modal, ActivityIndicator } from 'react-native';

export interface LoadingOverlayProps {
  visible: boolean;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ visible }) => {
  return (
    <Modal transparent visible={visible} testID="loading-overlay">
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#fff" testID="activity-indicator" />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
});
