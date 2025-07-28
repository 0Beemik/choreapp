import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useFamily } from './useFamily';
import { familyService } from '../services/FamilyService';
import { Family, FamilySettings } from '../models/Family';
import { User } from '../models/User';
import { CreateUserRequest } from '../types';

jest.mock('../services/FamilyService', () => ({
  familyService: {
    getFamilyById: jest.fn(),
    getFamilyMembers: jest.fn(),
    createFamily: jest.fn(),
    updateFamilySettings: jest.fn(),
    addUserToFamily: jest.fn(),
  },
}));

const mockFamily: Family = { id: 'f1', name: 'Test Family', settings: {} as FamilySettings, createdAt: new Date() };
const mockMembers: User[] = [{ id: 'u1', name: 'Test User', familyId: 'f1', age: 30, isAdmin: true, avatar: '', createdAt: new Date() }];
const mockNewFamily: Family = { id: 'f2', name: 'New Family', settings: {} as FamilySettings, createdAt: new Date() };

describe('useFamily', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (familyService.getFamilyById as jest.Mock).mockResolvedValue(mockFamily);
    (familyService.getFamilyMembers as jest.Mock).mockResolvedValue(mockMembers);
    (familyService.createFamily as jest.Mock).mockResolvedValue(mockNewFamily);
    (familyService.updateFamilySettings as jest.Mock).mockResolvedValue({ ...mockFamily, name: 'Updated Family' });
    (familyService.addUserToFamily as jest.Mock).mockResolvedValue(mockMembers[0]);
  });

  it('should initialize with default values and start loading', async () => {
    const { result } = renderHook(() => useFamily('f1'));
    expect(result.current.family).toBeNull();
    expect(result.current.members).toEqual([]);
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();
    await act(() => Promise.resolve());
  });

  it('should refresh family and members successfully', async () => {
    const { result } = renderHook(() => useFamily('f1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.family).toEqual(mockFamily);
    expect(result.current.members).toEqual(mockMembers);
    expect(familyService.getFamilyById).toHaveBeenCalledWith('f1');
    expect(familyService.getFamilyMembers).toHaveBeenCalledWith('f1');
    await act(() => Promise.resolve());
  });

  it('should handle errors when refreshing family data', async () => {
    (familyService.getFamilyById as jest.Mock).mockRejectedValue(new Error('Fetch error'));
    const { result } = renderHook(() => useFamily('f1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to refresh family data');
    await act(() => Promise.resolve());
  });

  it('should not refresh if familyId is not provided', async () => {
    renderHook(() => useFamily(''));
    expect(familyService.getFamilyById).not.toHaveBeenCalled();
    await act(() => Promise.resolve());
  });

  it('should create a family successfully', async () => {
    const { result } = renderHook(() => useFamily(null));
    const newFamilyData = { name: 'New Family', admin: { name: 'Admin', pin: '1234' } };
  
    let createdFamily;
    await act(async () => {
      createdFamily = await result.current.createFamily(newFamilyData.name, newFamilyData.admin as any);
    });
  
    expect(familyService.createFamily).toHaveBeenCalledWith(newFamilyData.name, newFamilyData.admin);
    expect(createdFamily).toEqual(mockNewFamily);
    await act(() => Promise.resolve());
  });

  it('should handle errors when creating a family', async () => {
    (familyService.createFamily as jest.Mock).mockRejectedValue(new Error('Create error'));
    const { result } = renderHook(() => useFamily(null));

    await act(async () => {
      await result.current.createFamily('New Family', {} as CreateUserRequest);
    });

    expect(result.current.error).toBe('Failed to create family');
    await act(() => Promise.resolve());
  });

  it('should update settings successfully', async () => {
    const { result } = renderHook(() => useFamily('f1'));

    await waitFor(() => {
        expect(result.current.family).toEqual(mockFamily);
    });

    await act(async () => {
      await result.current.updateSettings({ vacationMode: true });
    });

    expect(familyService.updateFamilySettings).toHaveBeenCalledWith('f1', { vacationMode: true });
    await waitFor(() => {
      expect(result.current.family?.name).toBe('Updated Family');
    });
    await act(() => Promise.resolve());
  });

  it('should handle errors when updating settings', async () => {
    (familyService.updateFamilySettings as jest.Mock).mockRejectedValue(new Error('Update error'));
    const { result } = renderHook(() => useFamily('f1'));

    await waitFor(() => {
        expect(result.current.family).toEqual(mockFamily);
    });

    await act(async () => {
      await result.current.updateSettings({ vacationMode: true });
    });

    await waitFor(() => {
      expect(result.current.error).toBe('Failed to update settings');
    });
    await act(() => Promise.resolve());
  });

  it('should not update settings if family is null', async () => {
    const { result } = renderHook(() => useFamily(''));

    await act(async () => {
      await result.current.updateSettings({ vacationMode: true });
    });

    expect(familyService.updateFamilySettings).not.toHaveBeenCalled();
    await act(() => Promise.resolve());
  });
});
