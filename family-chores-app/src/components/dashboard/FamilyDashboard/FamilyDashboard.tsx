import React from 'react';
import { Family } from '../../../models/Family';
import { User } from '../../../models/User';
import { Chore } from '../../../models/Chore';
import { ChoreAssignment } from '../../../models/ChoreAssignment';
import { DashboardContainer, MainContent, UserColumnContainer } from './FamilyDashboard.styles';
import { FamilyInfoSection } from '../FamilyInfoSection/FamilyInfoSection';
import { LeaderboardDisplay } from '../LeaderboardDisplay/LeaderboardDisplay';
import { UserColumn } from '../UserColumn/UserColumn';
import { ILeaderboardService } from '../../../services';
import { useSharedValue } from 'react-native-reanimated';

export interface FamilyDashboardProps {
  family: Family;
  members: User[];
  chores: Chore[];
  assignments: ChoreAssignment[];
  points: Record<string, number>;
  leaderboardService: ILeaderboardService;
  onChoreAction: (action: { type: 'complete' | 'buyout', assignmentId: string, userId: string }) => void;
  onAdminAccess: () => void;
}

export const FamilyDashboard: React.FC<FamilyDashboardProps> = ({
  family,
  members,
  chores,
  assignments,
  points,
  leaderboardService,
  onChoreAction,
  onAdminAccess,
}) => {
  const selectedUserId = useSharedValue<string | null>(null);

  return (
    <DashboardContainer>
      <MainContent>
        <FamilyInfoSection family={family} />
        <LeaderboardDisplay familyId={family.id} leaderboardService={leaderboardService} />
      </MainContent>
      <UserColumnContainer>
        {members.map((member) => (
          <UserColumn
            key={member.id}
            user={member}
            assignments={assignments.filter((a) => a.userId === member.id)}
            chores={chores}
            userPoints={points[member.id] || 0}
            style={{}} // This will be updated with animations
            onToggle={() => {
              selectedUserId.value = selectedUserId.value === member.id ? null : member.id;
            }}
            onChoreAction={onChoreAction}
          />
        ))}
      </UserColumnContainer>
    </DashboardContainer>
  );
};