import { useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { IPointsService } from '../services/PointsService';
import {
  setPoints,
  setHistory,
  setLoading,
  setError,
} from '../store/slices/pointsSlice';
import { RootState } from '../store/store';

export const usePoints = (pointsService: IPointsService) => {
  const dispatch = useDispatch();
  const { points, history, loading, error } = useSelector((state: RootState) => state.points);

  const refreshPoints = useCallback(async (userId: string) => {
    if (!userId) return;
    dispatch(setLoading(true));
    try {
      const currentPoints = await pointsService.getCurrentPoints(userId);
      dispatch(setPoints(currentPoints));
      const pointHistory = await pointsService.getPointHistory(userId);
      dispatch(setHistory(pointHistory));
    } catch (err) {
      dispatch(setError('Failed to refresh points'));
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch, pointsService]);

  return { points, history, loading, error, refreshPoints };
};
