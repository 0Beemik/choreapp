import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { adminOverrideService } from '../../../services';
import { User } from '../../../models/User';

interface PointsAdjustmentProps {
  user: User;
}

const PointsAdjustment: React.FC<PointsAdjustmentProps> = ({ user }) => {
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');

  const handleAdjust = () => {
    const numericAmount = parseInt(amount, 10);
    if (isNaN(numericAmount) || !reason) {
      Alert.alert('Validation Error', 'Please enter a valid amount and reason.');
      return;
    }

    adminOverrideService.adjustUserPoints(user.id, {
      amount: numericAmount,
      reason,
      category: numericAmount > 0 ? 'bonus' : 'penalty',
    });

    setAmount('');
    setReason('');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Adjust Points for {user.name}</Text>
      <TextInput
        style={styles.input}
        placeholder="Amount (+/-)"
        value={amount}
        onChangeText={setAmount}
        keyboardType="number-pad"
      />
      <TextInput
        style={styles.input}
        placeholder="Reason"
        value={reason}
        onChangeText={setReason}
      />
      <Button title="Adjust Points" onPress={handleAdjust} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 8,
    marginBottom: 10,
    borderRadius: 5,
  },
});

export default PointsAdjustment;
