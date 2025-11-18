import { VacationSettings } from '../models/VacationSettings';
import { BaseRepository, IBaseRepository } from './BaseRepository';

export interface IVacationSettingsRepository extends IBaseRepository<VacationSettings> {
  findByFamilyId(familyId: string): Promise<VacationSettings | null>;
}

interface VacationSettingsRow {
  id: string;
  family_id: string;
  start_date: string;
  end_date: string;
  pause_assignments: number;
  pause_points_decay: number;
}

export class VacationSettingsRepository extends BaseRepository<VacationSettings> implements IVacationSettingsRepository {
  protected tableName = 'vacation_settings';

  protected mapToModel(row: unknown): VacationSettings {
    const typedRow = row as VacationSettingsRow;
    return {
      id: typedRow.id,
      familyId: typedRow.family_id,
      startDate: new Date(typedRow.start_date),
      endDate: new Date(typedRow.end_date),
      pauseAssignments: !!typedRow.pause_assignments,
      pausePointsDecay: !!typedRow.pause_points_decay,
    };
  }

  async findByFamilyId(familyId: string): Promise<VacationSettings | null> {
    const sql = `SELECT * FROM ${this.tableName} WHERE family_id = ?`;
    const rows = await this.query(sql, [familyId]);
    return rows.length > 0 ? this.mapToModel(rows[0]) : null;
  }
}
