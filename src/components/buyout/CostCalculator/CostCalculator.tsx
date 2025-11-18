import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ChoreAssignment } from '../../../models/ChoreAssignment';
import { User } from '../../../models/User';
import { Family } from '../../../models/Family';
import { buyoutService, BuyoutCalculation } from '../../../services';

interface CostCalculatorProps {
  assignment: ChoreAssignment;
  user: User;
  family: Family;
}

const CostCalculator: React.FC<CostCalculatorProps> = ({ assignment, user, family }) => {
  const [calculation, setCalculation] = useState<BuyoutCalculation | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function calculate() {
      try {
        const result = await buyoutService.calculateBuyoutCost(user.id, assignment.id);
        setCalculation(result);
        setError(null);
      } catch (err) {
        setError((err as Error).message);
      }
    }
    calculate();
  }, [user.id, assignment.id]);

  if (error) {
    return <Text style={styles.error}>Error calculating cost: {error}</Text>;
  }

  if (!calculation) {
    return <Text>Calculating cost...</Text>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Buyout Cost</Text>
      <Text>Base cost: {calculation.baseCost} points</Text>
      <Text>Buyout cost: {calculation.adjustedCost} points</Text>
      <Text>Your balance: {calculation.userBalance} points</Text>
      {calculation.canAfford ? (
        <Text style={styles.success}>Remaining after buyout: {calculation.remainingBalance} points</Text>
      ) : (
        <Text style={styles.error}>You can't afford this buyout.</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  success: {
    color: 'green',
    marginTop: 5,
    fontWeight: 'bold',
  },
  error: {
    color: 'red',
    marginTop: 5,
  },
});

export default CostCalculator;
