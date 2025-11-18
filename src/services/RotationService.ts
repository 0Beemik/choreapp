import { IFamilyRepository } from '../repositories/FamilyRepository';
import { IChoreService } from './ChoreService';

export interface IRotationService {
  checkAndTriggerRotation(familyId: string): Promise<boolean>;
  shouldRotateToday(familyId: string): Promise<boolean>;
}

export class RotationService implements IRotationService {
  constructor(
    private familyRepository: IFamilyRepository,
    private choreService: IChoreService
  ) {}

  /**
   * Check if rotation is needed and trigger it if so
   * Returns true if rotation was triggered, false otherwise
   */
  async checkAndTriggerRotation(familyId: string): Promise<boolean> {
    const shouldRotate = await this.shouldRotateToday(familyId);

    if (!shouldRotate) {
      return false;
    }

    // Get family to update lastRotationDate
    const family = await this.familyRepository.findById(familyId);
    if (!family) {
      throw new Error(`Family not found: ${familyId}`);
    }

    // Calculate the period for the current week
    const today = new Date();
    const periodStart = new Date(today);
    periodStart.setHours(0, 0, 0, 0);

    const periodEnd = new Date(today);
    periodEnd.setDate(periodEnd.getDate() + 7);
    periodEnd.setHours(23, 59, 59, 999);

    // Trigger chore assignment
    await this.choreService.assignChores(familyId, {
      start: periodStart,
      end: periodEnd,
    });

    // Update lastRotationDate
    await this.familyRepository.update(familyId, {
      lastRotationDate: today,
    });

    console.log(`Chore rotation triggered for family ${familyId} on ${today.toISOString()}`);
    return true;
  }

  /**
   * Determine if rotation should happen today
   */
  async shouldRotateToday(familyId: string): Promise<boolean> {
    const family = await this.familyRepository.findById(familyId);
    if (!family) {
      return false;
    }

    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

    // Map rotationDay to day number
    const rotationDayMap: Record<string, number> = {
      sunday: 0,
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6,
    };

    const targetDay = rotationDayMap[family.settings.rotationDay];

    // Check if today is the rotation day
    if (dayOfWeek !== targetDay) {
      return false;
    }

    // Check if we've already rotated this week
    if (family.lastRotationDate) {
      const lastRotation = new Date(family.lastRotationDate);
      const daysSinceLastRotation = Math.floor(
        (today.getTime() - lastRotation.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Don't rotate if we rotated in the last 6 days (prevents double-rotation)
      if (daysSinceLastRotation < 6) {
        return false;
      }
    }

    return true;
  }
}
