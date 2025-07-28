import { useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { IChoreService } from '../services/ChoreService';
import {
  setAssignments,
  setLoading,
  setError,
  updateAssignment,
} from '../store/slices/choresSlice';
import { RootState } from '../store/store';

export const useChores = (choreService: IChoreService) => {
  const dispatch = useDispatch();
  const { assignments, loading, error } = useSelector((state: RootState) => state.chores);

  const refreshAssignments = useCallback(async (familyId: string, period: { start: Date; end: Date }) => {
    if (!familyId) return;
    dispatch(setLoading(true));
    try {
      // This should probably be getAssignmentsForFamily
      const userAssignments = await choreService.getAssignmentsForUser(familyId, period);
      dispatch(setAssignments(userAssignments));
    } catch (err) {
      dispatch(setError('Failed to refresh assignments'));
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch, choreService]);

  const completeChore = useCallback(async (assignmentId: string, userId: string) => {
    dispatch(setLoading(true));
    try {
      await choreService.completeChore(assignmentId, userId);
      // The API should return the updated assignment
      const updated = { id: assignmentId, changes: { status: 'completed' } };
      dispatch(updateAssignment(updated));
    } catch (err) {
      dispatch(setError('Failed to complete chore'));
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch, choreService]);

  const buyoutChore = useCallback(async (assignmentId: string, userId: string) => {
    dispatch(setLoading(true));
    try {
      await choreService.buyoutChore(assignmentId, userId);
      const updated = { id: assignmentId, changes: { status: 'bought_out' } };
      dispatch(updateAssignment(updated));
    } catch (err) {
      dispatch(setError('Failed to buyout chore'));
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch, choreService]);

  return { assignments, loading, error, refreshAssignments, completeChore, buyoutChore };
};
