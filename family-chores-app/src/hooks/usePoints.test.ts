import { renderHook, act, waitFor } from '@testing-library/react-native';
import { usePoints } from './usePoints';
import { pointsService } from '../services/PointsService';
import { PointTransaction } from '../models/PointTransaction';

jest.mock('../services/PointsService', () => ({
  pointsService: {
    getCurrentPoints: jest.fn(),
    getPointHistory: jest.fn(),
  },
}));

const mockPointHistory: PointTransaction[] = [
  { id: '1', userId: 'user-1', points: 10, reason: 'Test', date: new Date().toISOString(), type: 'add' },
  { id: '2', userId: 'user-1', points: 5, reason: 'Test 2', date: new Date().toISOString(), type: 'subtract' },
];

describe('usePoints', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with correct default values', () => {
    const { result } = renderHook(() => usePoints(''));
    expect(result.current.points).toBe(0);
    expect(result.current.history).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should not fetch points if userId is not provided', () => {
    renderHook(() => usePoints(''));
    expect(pointsService.getCurrentPoints).not.toHaveBeenCalled();
    expect(pointsService.getPointHistory).not.toHaveBeenCalled();
  });

  it('should fetch and set points and history on initial load', async () => {
    (pointsService.getCurrentPoints as jest.Mock).mockResolvedValue(100);
    (pointsService.getPointHistory as jest.Mock).mockResolvedValue(mockPointHistory);
    const { result } = renderHook(() => usePoints('user-1'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.points).toBe(100);
    expect(result.current.history).toEqual(mockPointHistory);
    expect(result.current.error).toBeNull();
    expect(pointsService.getCurrentPoints).toHaveBeenCalledWith('user-1');
    expect(pointsService.getPointHistory).toHaveBeenCalledWith('user-1');
  });

  it('should handle errors during points fetch', async () => {
    (pointsService.getCurrentPoints as jest.Mock).mockRejectedValue(new Error('Fetch error'));
    (pointsService.getPointHistory as jest.Mock).mockRejectedValue(new Error('Fetch error'));
    const { result } = renderHook(() => usePoints('user-1'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.points).toBe(0);
    expect(result.current.history).toEqual([]);
    expect(result.current.error).toBe('Failed to refresh points');
  });

  it('should refresh points and history when refreshPoints is called', async () => {
    (pointsService.getCurrentPoints as jest.Mock).mockResolvedValueOnce(100);
    (pointsService.getPointHistory as jest.Mock).mockResolvedValueOnce([]);
    const { result } = renderHook(() => usePoints('user-1'));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.points).toBe(100);
    expect(result.current.history).toEqual([]);

    (pointsService.getCurrentPoints as jest.Mock).mockResolvedValueOnce(150);
    (pointsService.getPointHistory as jest.Mock).mockResolvedValueOnce(mockPointHistory);

    await act(async () => {
      result.current.refreshPoints();
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.points).toBe(150);
    expect(result.current.history).toEqual(mockPointHistory);
    expect(pointsService.getCurrentPoints).toHaveBeenCalledTimes(2);
    expect(pointsService.getPointHistory).toHaveBeenCalledTimes(2);
  });
});