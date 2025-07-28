import { ChoreAssignment } from '../models/ChoreAssignment';
import { BaseRepository, IBaseRepository } from './BaseRepository';
import { AssignmentStatus, AssignmentType } from '../types';
import { dbConnection } from '../database/connection';

export interface IAssignmentRepository extends IBaseRepository<ChoreAssignment> {
  findByUserIdAndPeriod(userId: string, periodStart: Date, periodEnd: Date): Promise<ChoreAssignment[]>;
  findBoughtOutByDateRange(userId: string, startDate: Date, endDate: Date): Promise<ChoreAssignment[]>;
}

interface AssignmentRow {
  id: string;
  chore_id: string;
  user_id: string;
  assignment_type: AssignmentType;
  period_start: string;
  period_end: string;
  status: AssignmentStatus;
  completed_at?: string;
  points_awarded?: number;
  bought_out_at?: string;
  points_spent?: number;
  override_reason?: string;
  overridden_by?: string;
  created_at: string;
}

export class AssignmentRepository extends BaseRepository<ChoreAssignment> implements IAssignmentRepository {
  protected tableName = 'chore_assignments';

  protected mapToModel(row: unknown): ChoreAssignment {
    const typedRow = row as AssignmentRow;
    return {
      id: typedRow.id,
      choreId: typedRow.chore_id,
      userId: typedRow.user_id,
      assignmentType: typedRow.assignment_type,
      periodStart: new Date(typedRow.period_start),
      periodEnd: new Date(typedRow.period_end),
      status: typedRow.status,
      completedAt: typedRow.completed_at ? new Date(typedRow.completed_at) : undefined,
      pointsAwarded: typedRow.points_awarded,
      boughtOutAt: typedRow.bought_out_at ? new Date(typedRow.bought_out_at) : undefined,
      pointsSpent: typedRow.points_spent,
      overrideReason: typedRow.override_reason,
      overriddenBy: typedRow.overridden_by,
      createdAt: new Date(typedRow.created_at),
    };
  }

  async findByUserIdAndPeriod(userId: string, periodStart: Date, periodEnd: Date): Promise<ChoreAssignment[]> {
    const sql = `
      SELECT * FROM ${this.tableName} 
      WHERE user_id = ? AND period_start >= ? AND period_end <= ?
    `;
    const rows = await dbConnection.query(sql, [userId, periodStart.toISOString(), periodEnd.toISOString()]);
    return rows.map(this.mapToModel);
  }

  async findBoughtOutByDateRange(userId: string, startDate: Date, endDate: Date): Promise<ChoreAssignment[]> {
    const sql = `
      SELECT * FROM ${this.tableName} 
      WHERE user_id = ? AND status = 'bought_out' AND bought_out_at >= ? AND bought_out_at <= ?
    `;
    const rows = await dbConnection.query(sql, [userId, startDate.toISOString(), endDate.toISOString()]);
    return rows.map(this.mapToModel);
  }
}