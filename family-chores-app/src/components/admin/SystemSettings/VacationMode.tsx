import React, { useState } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
// In a real app, you would use a date picker component.
// For simplicity, we'll use text inputs.
import { TextInput } from 'react-native-gesture-handler';

interface VacationModeProps {
  onActivate: (startDate: Date, endDate: Date) => void;
}

export const VacationMode: React.FC<VacationModeProps> = ({ onActivate }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleActivate = () => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
      onActivate(start, end);
    } else {
      // Handle invalid date format
      
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Vacation Mode</Text>
      <TextInput
        style={styles.input}
        placeholder="Start Date (YYYY-MM-DD)"
        value={startDate}
        onChangeText={setStartDate}
      />
      <TextInput
        style={styles.input}
        placeholder="End Date (YYYY-MM-DD)"
        value={endDate}
        onChangeText={setEndDate}
      />
      <Button title="Activate Vacation Mode" onPress={handleActivate} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 30,
    padding: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 15,
    borderRadius: 5,
  },
});