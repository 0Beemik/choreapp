import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet, Text } from 'react-native';

interface PinEntryProps {
  onPinSubmit: (pin: string) => void;
  error?: string;
}

export const PinEntry: React.FC<PinEntryProps> = ({ onPinSubmit, error }) => {
  const [pin, setPin] = useState('');

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enter Admin PIN</Text>
      <TextInput
        style={styles.input}
        value={pin}
        onChangeText={setPin}
        keyboardType="number-pad"
        maxLength={4}
        secureTextEntry
        placeholder="****"
      />
      {error && <Text style={styles.error}>{error}</Text>}
      <Button title="Submit" onPress={() => onPinSubmit(pin)} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    textAlign: 'center',
    fontSize: 24,
    letterSpacing: 10,
    marginBottom: 20,
  },
  error: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 10,
  },
});