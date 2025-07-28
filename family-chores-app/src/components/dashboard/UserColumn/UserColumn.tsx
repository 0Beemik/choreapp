import React from 'react';
import Animated from 'react-native-reanimated';
import { User } from '../../../models/User';
import { ChoreAssignment } from '../../../models/ChoreAssignment';
import ChoreList from '../../chores/ChoreList/ChoreList';
import { UserColumnContainer, UserName } from './UserColumn.styles';
import { Button, ViewStyle } from 'react-native';

export interface UserColumnProps {
  user: User;
  assignments: ChoreAssignment[];
  chores: Chore[];
  userPoints: number;
  style: Animated.AnimateStyle<ViewStyle>;
  onToggle: () => void;
  onChoreAction: (action: { type: 'complete' | 'buyout', assignmentId: string, userId: string }) => void;
}

export const UserColumn: React.FC<UserColumnProps> = ({
  user,
  assignments,
  chores,
  userPoints,
  style,
  onToggle,
  onChoreAction,
}) => {
  return (
    <Animated.View style={[style, { flex: 1, height: '100%' }]}>
      <UserColumnContainer>
        <UserName>{user.name}</UserName>
        <Button title="Toggle" onPress={onToggle} />
        <ChoreList
          assignments={assignments}
          chores={chores}
          userId={user.id}
          userAge={user.age}
          userPoints={userPoints}
          onChoreAction={(action) => onChoreAction({ ...action, userId: user.id })}
        />
      </UserColumnContainer>
    </Animated.View>
  );
};
