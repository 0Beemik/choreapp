import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, Modal, StyleSheet } from 'react-native';
import { User } from '../../../models/User';

interface PointAdjustmentModalProps {
  user: User | null;
  visible: boolean;
  onClose: () => void;
  onSave: (userId: string, amount: number, reason: string) => void;
}

export const PointAdjustmentModal: React.FC<PointAdjustmentModalProps> = ({ user, visible, onClose, onSave }) => {
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (!visible) {
      setAmount('');
      setReason('');
    }
  }, [visible]);

  const handleSave = () => {
    if (user) {
      onSave(user.id, parseInt(amount, 10), reason);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <Text style={styles.title}>Adjust Points for {user.name}</Text>
        <TextInput
          style={styles.input}
          placeholder="Amount (e.g., 50 or -25)"
          value={amount}
          onChangeText={setAmount}
          keyboardType="number-pad"
        />
        <TextInput
          style={styles.input}
          placeholder="Reason for adjustment"
          value={reason}
          onChangeText={setReason}
        />
        <View style={styles.buttons}>
          <Button title="Save" onPress={handleSave} />
          <Button title="Cancel" onPress={onClose} color="red" />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 15,
    borderRadius: 5,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
});
