import React, { useCallback } from 'react';
import { FlatList } from 'react-native';
import { Chore } from '../../../models/Chore';
import { ChoreAssignment } from '../../../models/ChoreAssignment';
import { ChoreCard } from '../ChoreCard/ChoreCard';

export type ChoreAction = {
  type: 'complete' | 'buyout';
  assignmentId: string;
};

export interface ChoreListProps {
  assignments: ChoreAssignment[];
  chores: Chore[];
  userId: string;
  userAge: number;
  onChoreAction: (action: ChoreAction) => void;
  userPoints: number;
}

const ChoreList: React.FC<ChoreListProps> = ({
  assignments,
  chores,
  userId,
  userAge,
  onChoreAction,
  userPoints,
}) => {
  const handleComplete = useCallback((assignmentId: string) => {
    onChoreAction({ type: 'complete', assignmentId });
  }, [onChoreAction]);

  const handleBuyout = useCallback((assignmentId: string) => {
    onChoreAction({ type: 'buyout', assignmentId });
  }, [onChoreAction]);

  const renderItem = useCallback(({ item }: { item: ChoreAssignment }) => {
    const chore = chores.find(c => c.id === item.choreId);
    if (!chore) {
      return null;
    }

    // This is a simplified buyout calculation.
    // In a real app, this would be a more complex calculation.
    const buyoutCost = 2;
    const canAffordBuyout = userPoints >= buyoutCost;

    return (
      <ChoreCard
        assignment={item}
        chore={chore}
        userAge={userAge}
        onComplete={handleComplete}
        onBuyout={handleBuyout}
        disabled={item.userId !== userId}
        canAffordBuyout={canAffordBuyout}
      />
    );
  }, [chores, userAge, handleComplete, handleBuyout, userId, userPoints]);

  return (
    <FlatList
      data={assignments}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      // Add this to potentially improve scroll performance on Android
      removeClippedSubviews={true}
      // Adjust these numbers based on testing to optimize memory usage
      initialNumToRender={10}
      maxToRenderPerBatch={5}
      windowSize={11}
    />
  );
};

export default React.memo(ChoreList);
