import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, Alert } from 'react-native';
import { UserManagementPanel } from '../UserManagement/UserManagementPanel';
import { ChoreManagementPanel } from '../ChoreManagement/ChoreManagementPanel';
import { FamilySettingsPanel } from '../SystemSettings/FamilySettings';
import { PointAdjustmentModal } from '../PointsManagement/PointAdjustmentModal';
import { AssignmentOverrideModal } from '../ChoreManagement/AssignmentOverrideModal';
import { useFamily } from '../../../hooks/useFamily';
import { useChores } from '../../../hooks/useChores';
import { IUserService } from '../../../services/UserService';
import { IAdminOverrideService } from '../../../services/AdminOverrideService';
import { IChoreService } from '../../../services/ChoreService';
import { IFamilyService } from '../../../services/FamilyService';
import { useDispatch } from 'react-redux';
import { addUser, removeUser, updateUser } from '../../../store/slices/usersSlice';
import { addChore, removeChore, updateChore, updateAssignment } from '../../../store/slices/choresSlice';
import { updateFamilySettings } from '../../../store/slices/familySlice';
import { EditUserModal } from '../UserManagement/EditUserModal';
import { AddUserModal } from '../UserManagement/AddUserModal';
import { EditChoreModal } from '../ChoreManagement/EditChoreModal';
import { AddChoreModal } from '../ChoreManagement/AddChoreModal';
import { User } from '../../../models/User';
import { Chore, ChoreAssignment } from '../../../models/Chore';
import { FamilySettings } from '../../../models/Family';
import { UpdateUserRequest, CreateUserRequest, UpdateChoreRequest, CreateChoreRequest } from '../../../types';

interface AdminPanelProps {
  onLogout: () => void;
  userService: IUserService;
  adminOverrideService: IAdminOverrideService;
  choreService: IChoreService;
  familyService: IFamilyService;
}

type AdminTab = 'users' | 'chores' | 'settings' | 'system';

export const AdminPanel: React.FC<AdminPanelProps> = ({
  onLogout,
  userService,
  adminOverrideService,
  choreService,
  familyService,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('users');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [addingUser, setAddingUser] = useState(false);
  const [adjustingPointsUser, setAdjustingPointsUser] = useState<User | null>(null);
  const [editingChore, setEditingChore] = useState<Chore | null>(null);
  const [addingChore, setAddingChore] = useState(false);
  const [overridingAssignment, setOverridingAssignment] = useState<ChoreAssignment | null>(null);
  const { family } = useFamily();
  const { chores, assignments } = useChores();
  const dispatch = useDispatch();

  const handleError = (error: unknown) => {
    const message = error instanceof Error ? error.message : 'An unknown error occurred.';
    Alert.alert('Error', message);
  };

  // User Management Handlers
  const handleRemoveUser = async (userId: string) => {
    try {
      await userService.deleteUser(userId);
      dispatch(removeUser(userId));
    } catch (error) {
      handleError(error);
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
  };

  const handleSaveUser = async (userId: string, updates: UpdateUserRequest) => {
    try {
      const updatedUser = await userService.updateUser(userId, updates);
      dispatch(updateUser(updatedUser));
      setEditingUser(null);
    } catch (error) {
      handleError(error);
    }
  };

  const handleAddUser = () => {
    setAddingUser(true);
  };

  const handleSaveNewUser = async (user: CreateUserRequest) => {
    try {
      const newUser = await userService.createUser(user, family.id);
      dispatch(addUser(newUser));
      setAddingUser(false);
    } catch (error) {
      handleError(error);
    }
  };

  const handleAdjustPoints = (user: User) => {
    setAdjustingPointsUser(user);
  };

  const handleSavePointAdjustment = async (userId: string, amount: number, reason: string) => {
    try {
      await adminOverrideService.adjustUserPoints(userId, { amount, reason, category: 'correction' });
      setAdjustingPointsUser(null);
    } catch (error) {
      handleError(error);
    }
  };

  // Chore Management Handlers
  const handleEditChore = (chore: Chore) => {
    setEditingChore(chore);
  };

  const handleSaveChore = async (choreId: string, updates: UpdateChoreRequest) => {
    try {
      const updatedChore = await choreService.updateChore(choreId, updates);
      dispatch(updateChore(updatedChore));
      setEditingChore(null);
    } catch (error) {
      handleError(error);
    }
  };

  const handleDeleteChore = async (choreId: string) => {
    try {
      await choreService.deleteChore(choreId);
      dispatch(removeChore(choreId));
      setEditingChore(null);
    } catch (error) {
      handleError(error);
    }
  };

  const handleAddChore = () => {
    setAddingChore(true);
  };

  const handleSaveNewChore = async (chore: CreateChoreRequest) => {
    try {
      const newChore = await choreService.createChore(chore, family.id);
      dispatch(addChore(newChore));
      setAddingChore(false);
    } catch (error) {
      handleError(error);
    }
  };

  const handleOverrideAssignment = (assignment: ChoreAssignment) => {
    setOverridingAssignment(assignment);
  };

  const handleSaveAssignmentOverride = async (assignmentId: string, newUserId: string, reason: string) => {
    try {
      const updatedAssignment = await adminOverrideService.overrideAssignment(assignmentId, { newUserId, reason });
      dispatch(updateAssignment(updatedAssignment));
      setOverridingAssignment(null);
    } catch (error) {
      handleError(error);
    }
  };

  // Settings Management Handler
  const handleSettingsUpdate = async (settings: Partial<FamilySettings>) => {
    try {
      const updatedFamily = await familyService.updateFamilySettings(family.id, settings);
      dispatch(updateFamilySettings(updatedFamily.settings));
    } catch (error) {
      handleError(error);
    }
  };

  const handleActivateVacationMode = async (startDate: Date, endDate: Date) => {
    try {
      await adminOverrideService.activateVacationMode(family.id, { start: startDate, end: endDate });
      Alert.alert('Success', 'Vacation mode activated.');
    } catch (error) {
      handleError(error);
    }
  };

  if (!family) {
    return <Text>Loading family data...</Text>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Admin Panel</Text>
        <Button title="Logout" onPress={onLogout} />
      </View>
      <View style={styles.tabs}>
        <Button title="Users" onPress={() => setActiveTab('users')} />
        <Button title="Chores" onPress={() => setActiveTab('chores')} />
        <Button title="Settings" onPress={() => setActiveTab('settings')} />
        <Button title="System" onPress={() => setActiveTab('system')} />
      </View>
      <View style={styles.content}>
        {activeTab === 'users' && (
          <UserManagementPanel
            family={family}
            onUserAdd={handleAddUser}
            onUserEdit={handleEditUser}
            onUserRemove={handleRemoveUser}
            onAdjustPoints={handleAdjustPoints}
          />
        )}
        {activeTab === 'chores' && (
          <ChoreManagementPanel
            chores={chores}
            assignments={assignments}
            onChoreCreate={handleAddChore}
            onChoreEdit={handleEditChore}
            onAssignmentOverride={handleOverrideAssignment}
          />
        )}
        {activeTab === 'settings' && (
          <FamilySettingsPanel
            family={family}
            onSettingsUpdate={handleSettingsUpdate}
            onActivateVacationMode={handleActivateVacationMode}
          />
        )}
        {activeTab === 'system' && (
          <View>
            <Text style={styles.subtitle}>System Health</Text>
            <Text>Coming soon...</Text>
            <Text style={styles.subtitle}>Data Management</Text>
            <Button title="Export Data" onPress={() => Alert.alert('Export Data', 'Coming soon!')} />
            <Button title="Import Data" onPress={() => Alert.alert('Import Data', 'Coming soon!')} />
          </View>
        )}
      </View>
      <EditUserModal
        user={editingUser}
        visible={!!editingUser}
        onClose={() => setEditingUser(null)}
        onSave={handleSaveUser}
      />
      <AddUserModal
        visible={addingUser}
        onClose={() => setAddingUser(false)}
        onSave={handleSaveNewUser}
      />
      <PointAdjustmentModal
        user={adjustingPointsUser}
        visible={!!adjustingPointsUser}
        onClose={() => setAdjustingPointsUser(null)}
        onSave={handleSavePointAdjustment}
      />
      <EditChoreModal
        chore={editingChore}
        visible={!!editingChore}
        onClose={() => setEditingChore(null)}
        onSave={handleSaveChore}
        onDelete={handleDeleteChore}
      />
      <AddChoreModal
        visible={addingChore}
        onClose={() => setAddingChore(false)}
        onSave={handleSaveNewChore}
      />
      <AssignmentOverrideModal
        assignment={overridingAssignment}
        visible={!!overridingAssignment}
        onClose={() => setOverridingAssignment(null)}
        onSave={handleSaveAssignmentOverride}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  tabs: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  content: {
    flex: 1,
  },
});
