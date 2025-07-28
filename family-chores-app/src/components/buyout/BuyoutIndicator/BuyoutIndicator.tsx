import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { User } from '../../../models/User';
import { ChoreAssignment } from '../../../models/ChoreAssignment';
import { buyoutService } from '../../../services/BuyoutService';
import { familyService } from '../../../services/FamilyService';
import { Family } from '../../../models/Family';

interface BuyoutIndicatorProps {
  user: User;
  assignment: ChoreAssignment;
}

export const BuyoutIndicator: React.FC<BuyoutIndicatorProps> = ({ user, assignment }) => {
  const [cost, setCost] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBuyoutCost = async () => {
      try {
        const family = await familyService.getFamilyById(user.familyId);
        if (family) {
          const calculation = await buyoutService.calculateBuyoutCost(user, assignment, family);
          setCost(calculation.adjustedCost);
        }
      } catch (error) {
        
        setCost(null);
      } finally {
        setLoading(false);
      }
    };

    fetchBuyoutCost();
  }, [user, assignment]);

  if (loading) {
    return <ActivityIndicator testID="loading-indicator" />;
  }

  if (cost === null) {
    return <Text>Buyout not available</Text>;
  }

  return (
    <View>
      <Text>Buyout Cost: {cost} points</Text>
    </View>
  );
};