import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import { Family, FamilySettings } from '../../../models';
import { VacationMode } from './VacationMode';

interface FamilySettingsPanelProps {
  family: Family;
  onSettingsUpdate: (settings: Partial<FamilySettings>) => void;
  onActivateVacationMode: (startDate: Date, endDate: Date) => void;
}

export const FamilySettingsPanel: React.FC<FamilySettingsPanelProps> = ({
  family,
  onSettingsUpdate,
  onActivateVacationMode,
}) => {
  const [pointsPerChore, setPointsPerChore] = useState('');
  const [buyoutCostPercentage, setBuyoutCostPercentage] = useState('');
  const [maxBuyoutsPerMonth, setMaxBuyoutsPerMonth] = useState('');

  useEffect(() => {
    if (family) {
      setPointsPerChore(String(family.settings.pointsPerChore));
      setBuyoutCostPercentage(String(family.settings.buyoutCostPercentage));
      setMaxBuyoutsPerMonth(String(family.settings.maxBuyoutsPerMonth));
    }
  }, [family]);

  const handleSave = () => {
    const settings: Partial<FamilySettings> = {
      pointsPerChore: parseInt(pointsPerChore, 10),
      buyoutCostPercentage: parseInt(buyoutCostPercentage, 10),
      maxBuyoutsPerMonth: parseInt(maxBuyoutsPerMonth, 10),
    };
    onSettingsUpdate(settings);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Family Settings</Text>
      <Text style={styles.label}>Points Per Chore</Text>
      <TextInput
        style={styles.input}
        value={pointsPerChore}
        onChangeText={setPointsPerChore}
        keyboardType="number-pad"
      />
      <Text style={styles.label}>Buyout Cost (% of points)</Text>
      <TextInput
        style={styles.input}
        value={buyoutCostPercentage}
        onChangeText={setBuyoutCostPercentage}
        keyboardType="number-pad"
      />
      <Text style={styles.label}>Max Buyouts Per Month</Text>
      <TextInput
        style={styles.input}
        value={maxBuyoutsPerMonth}
        onChangeText={setMaxBuyoutsPerMonth}
        keyboardType="number-pad"
      />
      <Button title="Save Settings" onPress={handleSave} />

      <VacationMode onActivate={onActivateVacationMode} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 15,
    borderRadius: 5,
  },
});