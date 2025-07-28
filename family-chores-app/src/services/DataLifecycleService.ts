import { IAssignmentRepository } from '../repositories/AssignmentRepository';
import { IPointsRepository } from '../repositories/PointsRepository';
import { IAdminSessionRepository } from '../repositories/AdminSessionRepository';

export interface ArchivalResult {
  recordsArchived: number;
  spaceFreed: number; // This is a placeholder, as calculating space freed is complex
}

export interface IDataLifecycleService {
  archiveOldData(cutoffDate: Date): Promise<ArchivalResult>;
  optimizeDatabase(): Promise<void>;
}

export class DataLifecycleService implements IDataLifecycleService {
  constructor(
    private assignmentRepository: IAssignmentRepository,
    private pointsRepository: IPointsRepository,
    private adminSessionRepository: IAdminSessionRepository
  ) {}

  async archiveOldData(cutoffDate: Date): Promise<ArchivalResult> {
    // This is a placeholder implementation. A real implementation would be more robust.
    const assignments = await this.assignmentRepository.findAll();
    const points = await this.pointsRepository.findAll();
    const sessions = await this.adminSessionRepository.findAll();

    const assignmentsToArchive = assignments.filter(a => new Date(a.createdAt) < cutoffDate);
    const pointsToArchive = points.filter(p => new Date(p.createdAt) < cutoffDate);
    const sessionsToArchive = sessions.filter(s => new Date(s.createdAt) < cutoffDate);

    for (const assignment of assignmentsToArchive) {
      await this.assignmentRepository.delete(assignment.id);
    }
    for (const point of pointsToArchive) {
      await this.pointsRepository.delete(point.id);
    }
    for (const session of sessionsToArchive) {
      await this.adminSessionRepository.delete(session.id);
    }

    return {
      recordsArchived: assignmentsToArchive.length + pointsToArchive.length + sessionsToArchive.length,
      spaceFreed: 0,
    };
  }

  async optimizeDatabase(): Promise<void> {
    // This is a placeholder. A real implementation would use a VACUUM command or similar.
    console.log('Optimizing database...');
  }
}
