import { Family, FamilySettings } from '../models/Family';
import { BaseRepository, IBaseRepository } from './BaseRepository';

export interface IFamilyRepository extends IBaseRepository<Family> {
  // Add any family-specific methods here
}

interface FamilyRow {
  id: string;
  name: string;
  created_at: string;
  last_rotation_date: string | null;
  settings_points_per_chore: number;
  settings_buyout_cost_percentage: number;
  settings_max_buyouts_per_month: number;
  settings_rotation_day: string;
  admin_pin: string;
}

export class FamilyRepository extends BaseRepository<Family> implements IFamilyRepository {
  protected tableName = 'families';

  protected mapToModel(row: unknown): Family {
    const typedRow = row as FamilyRow;
    return {
      id: typedRow.id,
      name: typedRow.name,
      createdAt: new Date(typedRow.created_at),
      lastRotationDate: typedRow.last_rotation_date ? new Date(typedRow.last_rotation_date) : null,
      settings: {
        pointsPerChore: typedRow.settings_points_per_chore,
        buyoutCostPercentage: typedRow.settings_buyout_cost_percentage,
        maxBuyoutsPerMonth: typedRow.settings_max_buyouts_per_month,
        rotationDay: typedRow.settings_rotation_day as FamilySettings['rotationDay'],
        adminPin: typedRow.admin_pin,
      },
    };
  }
  // ... (rest of the class remains the same)
}
