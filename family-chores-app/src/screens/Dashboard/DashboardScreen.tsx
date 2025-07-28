import React, { useEffect } from 'react';
import { View } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import { useSharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { useFamily } from '../../hooks/useFamily';
import { useChores } from '../../hooks/useChores';
import { usePoints } from '../../hooks/usePoints';
import { FamilyDashboard } from '../../components/dashboard/FamilyDashboard/FamilyDashboard';
import { BlurOverlay } from '../../components/dashboard/BlurOverlay/BlurOverlay';
import { BadgeNotification } from '../../components/achievements/BadgeNotification/BadgeNotification';
import { RootStackParamList, RootState } from '../../types';
import { LoadingSpinner } from '../../components/common/Loading/LoadingSpinner';
import {
  hideBadgeNotification,
  setAdminModalOpen,
  setSelectedUserId,
} from '../../store/slices/uiSlice';
import { AdminLogin } from '../../components/admin/AdminAuth/AdminLogin';
import { animationController } from '../../animations/AnimationController';
import { familyService } from '../../services/FamilyService'; // Should be injected
import { choreService } from '../../services/ChoreService'; // Should be injected
import { pointsService } from '../../services/PointsService'; // Should be injected
import { leaderboardService } from '../../services/LeaderboardService'; // Should be injected

type DashboardScreenRouteProp = RouteProp<RootStackParamList, 'Dashboard'>;

export const DashboardScreen: React.FC = () => {
  const route = useRoute<DashboardScreenRouteProp>();
  const dispatch = useDispatch();
  const { familyId } = route.params;

  const { family, members, loading: familyLoading, refreshFamily } = useFamily(familyService);
  const { assignments, loading: choresLoading, refreshAssignments, completeChore, buyoutChore } = useChores(choreService);
  const { points, loading: pointsLoading, refreshPoints } = usePoints(pointsService);
  const { badgeNotification, adminModalOpen, selectedUserId } = useSelector((state: RootState) => state.ui);

  const expandedState = useSharedValue(0);

  useEffect(() => {
    refreshFamily(familyId);
    refreshAssignments(familyId, { start: new Date(), end: new Date() });
    // In a real app, we would fetch points for all users
  }, [familyId, refreshFamily, refreshAssignments]);

  const handleUserSelect = (userId: string) => {
    if (userId && userId !== selectedUserId) {
      dispatch(setSelectedUserId(userId));
      animationController.columns.expand(expandedState);
    } else {
      dispatch(setSelectedUserId(null));
      animationController.columns.collapse(expandedState);
    }
  };

  const handleChoreAction = (action: { type: 'complete' | 'buyout', assignmentId: string, userId: string }) => {
    if (action.type === 'complete') {
      completeChore(action.assignmentId, action.userId);
    } else {
      buyoutChore(action.assignmentId, action.userId);
    }
  };

  if (familyLoading || choresLoading || pointsLoading || !family) {
    return <LoadingSpinner />;
  }

  return (
    <View style={{ flex: 1, flexDirection: 'row' }}>
      <FamilyDashboard
        family={family}
        members={members}
        chores={[]} // This should be fetched from the store
        assignments={assignments}
        points={points}
        leaderboardService={leaderboardService}
        onChoreAction={handleChoreAction}
        onAdminAccess={() => dispatch(setAdminModalOpen(true))}
      />
      <BlurOverlay visible={expandedState} />
      {badgeNotification && (
        <BadgeNotification
          badge={badgeNotification}
          onDismiss={() => dispatch(hideBadgeNotification())}
        />
      )}
      <AdminLogin
        visible={adminModalOpen}
        onClose={() => dispatch(setAdminModalOpen(false))}
      />
    </View>
  );
};
