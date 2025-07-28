import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useChores } from './useChores';
import { choreService } from '../services/ChoreService';
import { ChoreAssignment } from '../models/ChoreAssignment';

jest.mock('../services/ChoreService', () => ({
  choreService: {
    getAssignmentsForUser: jest.fn(),
    completeChore: jest.fn(),
  },
}));

const mockAssignments: ChoreAssignment[] = [
  { id: 'a1', choreId: 'c1', userId: 'u1', familyId: 'f1', status: 'pending', dueDate: new Date().toISOString() },
  { id: 'a2', choreId: 'c2', userId: 'u1', familyId: 'f1', status: 'pending', dueDate: new Date().toISOString() },
];

describe('useChores', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (choreService.getAssignmentsForUser as jest.Mock).mockResolvedValue(mockAssignments);
    (choreService.completeChore as jest.Mock).mockResolvedValue(undefined);
  });

  it('should initialize with correct default values', () => {
    const { result } = renderHook(() => useChores('f1'));
    expect(result.current.assignments).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should refresh assignments successfully', async () => {
    const { result } = renderHook(() => useChores('f1'));
    const period = { start: new Date(), end: new Date() };

    await act(async () => {
      await result.current.refreshAssignments(period);
    });

    expect(choreService.getAssignmentsForUser).toHaveBeenCalledWith('f1', period);
    expect(result.current.assignments).toEqual(mockAssignments);
    expect(result.current.loading).toBe(false);
  });

  it('should handle errors during assignment refresh', async () => {
    (choreService.getAssignmentsForUser as jest.Mock).mockRejectedValue(new Error('Fetch error'));
    const { result } = renderHook(() => useChores('f1'));
    const period = { start: new Date(), end: new Date() };

    await act(async () => {
      await result.current.refreshAssignments(period);
    });

    expect(result.current.error).toBe('Failed to refresh assignments');
    expect(result.current.loading).toBe(false);
  });

  it('should complete a chore successfully', async () => {
    const { result } = renderHook(() => useChores('f1'));
    
    // First, refresh assignments to populate the state
    await act(async () => {
        await result.current.refreshAssignments({ start: new Date(), end: new Date() });
    });
    
    await act(async () => {
      await result.current.completeChore('a1', 'u1');
    });

    expect(choreService.completeChore).toHaveBeenCalledWith('a1', 'u1');
    const completedChore = result.current.assignments.find(a => a.id === 'a1');
    expect(completedChore?.status).toBe('completed');
  });

  it('should handle errors during chore completion', async () => {
    (choreService.completeChore as jest.Mock).mockRejectedValue(new Error('Completion error'));
    const { result } = renderHook(() => useChores('f1'));

    await act(async () => {
      await result.current.completeChore('a1', 'u1');
    });

    expect(result.current.error).toBe('Failed to complete chore');
  });

  it('should not refresh assignments if familyId is not provided', async () => {
    const { result } = renderHook(() => useChores(''));
    const period = { start: new Date(), end: new Date() };

    await act(async () => {
      await result.current.refreshAssignments(period);
    });

    expect(choreService.getAssignmentsForUser).not.toHaveBeenCalled();
  });
});