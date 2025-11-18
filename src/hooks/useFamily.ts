import { useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { FamilySettings } from '../models/Family';
import { User } from '../models/User';
import { CreateUserRequest } from '../types';
import { IFamilyService } from '../services/FamilyService';
import {
  setFamily,
  setMembers,
  updateFamilySettings as updateSettingsAction,
  setLoading,
  setError,
} from '../store/slices/familySlice';
import { RootState } from '../store/store';

export const useFamily = (familyService: IFamilyService) => {
  const dispatch = useDispatch();
  const {
    current: family,
    members,
    loading,
    error,
  } = useSelector((state: RootState) => state.family);

  const refreshFamily = useCallback(async (familyId: string) => {
    if (!familyId) return;
    dispatch(setLoading(true));
    try {
      const fam = await familyService.getFamilyById(familyId);
      if (fam) {
        dispatch(setFamily(fam));
        const familyMembers = await familyService.getFamilyMembers(fam.id);
        dispatch(setMembers(familyMembers));
      }
    } catch (err) {
      dispatch(setError('Failed to refresh family data'));
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch, familyService]);

  const createFamily = async (name: string, admin: CreateUserRequest) => {
    dispatch(setLoading(true));
    try {
      const newFamily = await familyService.createFamily(name, admin);
      dispatch(setFamily(newFamily));
      return newFamily;
    } catch (err) {
      dispatch(setError('Failed to create family'));
      return null;
    } finally {
      dispatch(setLoading(false));
    }
  };

  const updateSettings = async (familyId: string, settings: Partial<FamilySettings>) => {
    dispatch(setLoading(true));
    try {
      const updatedFamily = await familyService.updateFamilySettings(familyId, settings);
      dispatch(updateSettingsAction(updatedFamily.settings));
    } catch (err) {
      dispatch(setError('Failed to update settings'));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const addMember = async (familyId: string, user: CreateUserRequest) => {
    dispatch(setLoading(true));
    try {
      await familyService.addFamilyMember(familyId, user);
      await refreshFamily(familyId); // Refresh to get the new member
    } catch (err) {
      dispatch(setError('Failed to add member'));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const removeMember = async (familyId: string, userId: string, currentUserId: string) => {
    dispatch(setLoading(true));
    try {
      await familyService.removeFamilyMember(familyId, userId, currentUserId);
      await refreshFamily(familyId); // Refresh to remove the member
    } catch (err) {
      dispatch(setError('Failed to remove member'));
    } finally {
      dispatch(setLoading(false));
    }
  };

  return {
    family,
    members,
    loading,
    error,
    refreshFamily,
    createFamily,
    updateSettings,
    addMember,
    removeMember,
  };
};