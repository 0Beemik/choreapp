import { StackNavigationProp } from '@react-navigation/stack';

export type RootStackParamList = {
  FamilySetup: undefined;
  Dashboard: { familyId: string };
  AdminPanel: { familyId: string };
  Profile: { userId: string };
  Settings: undefined;
};

export type DashboardScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Dashboard'
>;

export type AdminPanelScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'AdminPanel'
>;
