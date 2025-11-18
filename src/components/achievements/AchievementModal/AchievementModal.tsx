import React from 'react';
import { View, Text, Modal, StyleSheet, Button } from 'react-native';
import { UserBadge } from '../../../models/UserBadge';
import { Badge } from '../../../models/Badge';

interface AchievementModalProps {
  badge: Badge;
  userBadge: UserBadge;
  onClose: () => void;
  onShare?: () => void;
}

const AchievementModal: React.FC<AchievementModalProps> = ({
  badge,
  userBadge,
  onClose,
  onShare,
}) => {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={true}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <Text style={styles.modalText}>{badge.name}</Text>
          <Text>{badge.description}</Text>
          <Text>Earned on: {userBadge.earnedAt.toLocaleDateString()}</Text>
          {onShare && <Button title="Share" onPress={onShare} />}
          <Button title="Close" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalText: {
    marginBottom: 15,
    textAlign: 'center',
    fontWeight: 'bold',
  },
});

export default AchievementModal;
