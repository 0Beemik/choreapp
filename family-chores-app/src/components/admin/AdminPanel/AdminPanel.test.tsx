
import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { thunk } from 'redux-thunk';
import { AdminPanel } from './AdminPanel';
import { useFamily } from '../../../hooks/useFamily';
import { useChores } from '../../../hooks/useChores';
import { userService } from '../../../services/UserService';
import { choreService } from '../../../services/ChoreService';
import { adminOverrideService } from '../../../services/AdminOverrideService';
import { familyService } from '../../../services/FamilyService';
import { addUser, removeUser, updateUser } from '../../../store/slices/usersSlice';
import { addChore, removeChore, updateChore, updateAssignment } from '../../../store/slices/choresSlice';
import { updateFamilySettings } from '../../../store/slices/familySlice';

// Mock services
jest.mock('../../../services/UserService');
jest.mock('../../../services/ChoreService');
jest.mock('../../../services/AdminOverrideService');
jest.mock('../../../services/FamilyService');

jest.mock('../../../hooks/useFamily');
jest.mock('../../../hooks/useChores');

// Mock child components to check for props
jest.mock('../UserManagement/UserManagementPanel', () => ({
  UserManagementPanel: (props) => {
    global.userManagementPanelProps = props;
    return <div testID="user-management-panel" />;
  },
}));
jest.mock('../ChoreManagement/ChoreManagementPanel', () => ({
  ChoreManagementPanel: (props) => {
    global.choreManagementPanelProps = props;
    return <div testID="chore-management-panel" />;
  },
}));
jest.mock('../SystemSettings/FamilySettings', () => ({
  FamilySettingsPanel: (props) => {
    global.familySettingsPanelProps = props;
    return <div testID="family-settings-panel" />;
  },
}));
jest.mock('../UserManagement/AddUserModal', () => ({
  AddUserModal: (props) => {
    global.addUserModalProps = props;
    return <div testID="add-user-modal" />;
  },
}));
jest.mock('../UserManagement/EditUserModal', () => ({
  EditUserModal: (props) => {
    global.editUserModalProps = props;
    return <div testID="edit-user-modal" />;
  },
}));
jest.mock('../PointsManagement/PointAdjustmentModal', () => ({
  PointAdjustmentModal: (props) => {
    global.pointAdjustmentModalProps = props;
    return <div testID="point-adjustment-modal" />;
  },
}));
jest.mock('../ChoreManagement/AddChoreModal', () => ({
  AddChoreModal: (props) => {
    global.addChoreModalProps = props;
    return <div testID="add-chore-modal" />;
  },
}));
jest.mock('../ChoreManagement/EditChoreModal', () => ({
  EditChoreModal: (props) => {
    global.editChoreModalProps = props;
    return <div testID="edit-chore-modal" />;
  },
}));
jest.mock('../ChoreManagement/AssignmentOverrideModal', () => ({
  AssignmentOverrideModal: (props) => {
    global.assignmentOverrideModalProps = props;
    return <div testID="assignment-override-modal" />;
  },
}));


const middlewares = [thunk];
const mockStore = configureStore(middlewares);
const mockedUseFamily = useFamily as jest.Mock;
const mockedUseChores = useChores as jest.Mock;
const mockedUserService = userService as jest.Mocked<typeof userService>;
const mockedChoreService = choreService as jest.Mocked<typeof choreService>;
const mockedAdminOverrideService = adminOverrideService as jest.Mocked<typeof adminOverrideService>;
const mockedFamilyService = familyService as jest.Mocked<typeof familyService>;

describe('AdminPanel', () => {
  let store;
  const mockFamily = {
    id: 'family-1',
    name: 'Test Family',
    users: [{ id: 'user-1', name: 'Test User', role: 'child' }],
    members: [{ id: 'user-1', name: 'Test User', role: 'child' }],
    settings: {
      pointsPerChore: 10,
      buyoutCostPercentage: 50,
      maxBuyoutsPerMonth: 2,
    },
  };
  const mockChores = [{ id: 'chore-1', name: 'Test Chore', points: 10 }];
  const mockAssignments = [{ id: 'assign-1', choreId: 'chore-1', userId: 'user-1', completed: false }];

  beforeEach(() => {
    store = mockStore({
      family: {
        family: mockFamily,
        users: mockFamily.users,
        loading: false,
        error: null,
      },
      chores: {
        chores: mockChores,
        assignments: mockAssignments,
        loading: false,
        error: null,
      },
    });

    mockedUseFamily.mockReturnValue({
      family: mockFamily,
      loading: false,
      error: null,
    });

    mockedUseChores.mockReturnValue({
      chores: mockChores,
      assignments: mockAssignments,
      loading: false,
      error: null,
    });

    jest.clearAllMocks();
  });

  const renderPanel = () => render(
    <Provider store={store}>
      <AdminPanel onLogout={() => {}} />
    </Provider>
  );

  it('should render the user management section by default', async () => {
    const { findByTestId } = renderPanel();
    expect(await findByTestId('user-management-panel')).toBeTruthy();
  });

  it('should render the chore management section when chores tab is pressed', async () => {
    const { findByTestId, getByText } = renderPanel();
    fireEvent.press(getByText('Chores'));
    expect(await findByTestId('chore-management-panel')).toBeTruthy();
  });

  it('should render the family settings section when settings tab is pressed', async () => {
    const { findByTestId, getByText } = renderPanel();
    fireEvent.press(getByText('Settings'));
    expect(await findByTestId('family-settings-panel')).toBeTruthy();
  });

  // User Management Tests
  it('should handle adding a new user', async () => {
    mockedUserService.createUser.mockResolvedValueOnce({ id: 'user-2', name: 'New User', role: 'child' });
    renderPanel();
    
    await act(async () => {
      global.userManagementPanelProps.onUserAdd();
    });

    await act(async () => {
      global.addUserModalProps.onSave({ name: 'New User', role: 'child' });
    });

    expect(mockedUserService.createUser).toHaveBeenCalledWith({ name: 'New User', role: 'child' }, 'family-1');
    expect(store.getActions()).toContainEqual(addUser(expect.any(Object)));
  });

  it('should handle editing a user', async () => {
    const updatedUser = { id: 'user-1', name: 'Updated User', role: 'parent' };
    mockedUserService.updateUser.mockResolvedValueOnce(updatedUser);
    renderPanel();

    await act(async () => {
      global.userManagementPanelProps.onUserEdit(mockFamily.users[0]);
    });

    await act(async () => {
      global.editUserModalProps.onSave('user-1', { name: 'Updated User', role: 'parent' });
    });

    expect(mockedUserService.updateUser).toHaveBeenCalledWith('user-1', { name: 'Updated User', role: 'parent' });
    expect(store.getActions()).toContainEqual(updateUser(updatedUser));
  });

  it('should handle removing a user', async () => {
    mockedUserService.deleteUser.mockResolvedValueOnce(undefined);
    renderPanel();

    await act(async () => {
      global.userManagementPanelProps.onUserRemove('user-1');
    });

    expect(mockedUserService.deleteUser).toHaveBeenCalledWith('user-1');
    expect(store.getActions()).toContainEqual(removeUser('user-1'));
  });

  it('should handle adjusting user points', async () => {
    mockedAdminOverrideService.adjustUserPoints.mockResolvedValueOnce(undefined);
    renderPanel();

    await act(async () => {
      global.userManagementPanelProps.onAdjustPoints(mockFamily.users[0]);
    });

    await act(async () => {
      global.pointAdjustmentModalProps.onSave('user-1', 100, 'Bonus');
    });

    expect(mockedAdminOverrideService.adjustUserPoints).toHaveBeenCalledWith('user-1', { amount: 100, reason: 'Bonus', category: 'correction' });
  });

  // Chore Management Tests
  it('should handle adding a new chore', async () => {
    const newChore = { id: 'chore-2', name: 'New Chore', points: 20 };
    mockedChoreService.createChore.mockResolvedValueOnce(newChore);
    const { getByText } = renderPanel();
    fireEvent.press(getByText('Chores'));

    await act(async () => {
      global.choreManagementPanelProps.onChoreCreate();
    });

    await act(async () => {
      global.addChoreModalProps.onSave({ name: 'New Chore', points: 20 });
    });

    expect(mockedChoreService.createChore).toHaveBeenCalledWith({ name: 'New Chore', points: 20 }, 'family-1');
    expect(store.getActions()).toContainEqual(addChore(newChore));
  });

  it('should handle editing a chore', async () => {
    const updatedChore = { id: 'chore-1', name: 'Updated Chore', points: 15 };
    mockedChoreService.updateChore.mockResolvedValueOnce(updatedChore);
    const { getByText } = renderPanel();
    fireEvent.press(getByText('Chores'));

    await act(async () => {
      global.choreManagementPanelProps.onChoreEdit(mockChores[0]);
    });

    await act(async () => {
      global.editChoreModalProps.onSave('chore-1', { name: 'Updated Chore', points: 15 });
    });

    expect(mockedChoreService.updateChore).toHaveBeenCalledWith('chore-1', { name: 'Updated Chore', points: 15 });
    expect(store.getActions()).toContainEqual(updateChore(updatedChore));
  });

  it('should handle deleting a chore', async () => {
    mockedChoreService.deleteChore.mockResolvedValueOnce(undefined);
    const { getByText } = renderPanel();
    fireEvent.press(getByText('Chores'));

    await act(async () => {
      global.choreManagementPanelProps.onChoreEdit(mockChores[0]);
    });

    await act(async () => {
      global.editChoreModalProps.onDelete('chore-1');
    });

    expect(mockedChoreService.deleteChore).toHaveBeenCalledWith('chore-1');
    expect(store.getActions()).toContainEqual(removeChore('chore-1'));
  });

  it('should handle overriding an assignment', async () => {
    const updatedAssignment = { ...mockAssignments[0], userId: 'user-2' };
    mockedAdminOverrideService.overrideAssignment.mockResolvedValueOnce(updatedAssignment);
    const { getByText } = renderPanel();
    fireEvent.press(getByText('Chores'));

    await act(async () => {
      global.choreManagementPanelProps.onAssignmentOverride(mockAssignments[0]);
    });

    await act(async () => {
      global.assignmentOverrideModalProps.onSave('assign-1', 'user-2', 'User sick');
    });

    expect(mockedAdminOverrideService.overrideAssignment).toHaveBeenCalledWith('assign-1', { newUserId: 'user-2', reason: 'User sick' });
    expect(store.getActions()).toContainEqual(updateAssignment(updatedAssignment));
  });

  // Settings Management Tests
  it('should handle updating family settings', async () => {
    const newSettings = { pointsPerChore: 15 };
    const updatedFamily = { ...mockFamily, settings: { ...mockFamily.settings, ...newSettings } };
    mockedFamilyService.updateFamilySettings.mockResolvedValueOnce(updatedFamily);
    const { getByText } = renderPanel();
    fireEvent.press(getByText('Settings'));

    await act(async () => {
      global.familySettingsPanelProps.onSettingsUpdate(newSettings);
    });

    expect(mockedFamilyService.updateFamilySettings).toHaveBeenCalledWith('family-1', newSettings);
    expect(store.getActions()).toContainEqual(updateFamilySettings(updatedFamily.settings));
  });

  it('should handle activating vacation mode', async () => {
    mockedAdminOverrideService.activateVacationMode.mockResolvedValueOnce(undefined);
    const { getByText } = renderPanel();
    fireEvent.press(getByText('Settings'));

    const startDate = new Date('2025-12-20');
    const endDate = new Date('2025-12-30');

    await act(async () => {
      global.familySettingsPanelProps.onActivateVacationMode(startDate, endDate);
    });

    expect(mockedAdminOverrideService.activateVacationMode).toHaveBeenCalledWith('family-1', { start: startDate, end: endDate });
  });
});
