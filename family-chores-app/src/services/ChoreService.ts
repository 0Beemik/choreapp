import { Chore } from '../models/Chore';
import { ChoreAssignment } from '../models/ChoreAssignment';
import { CreateChoreRequest, UpdateChoreRequest, CompletionResult, BuyoutResult } from '../types';
import { IChoreRepository, ChoreRepository } from '../repositories/ChoreRepository';
import { IAssignmentRepository, AssignmentRepository } from '../repositories/AssignmentRepository';
import { IPointsService, PointsService } from './PointsService';



type AssignmentPeriod = { start: Date; end: Date };

export interface IChoreService {
  createChore(request: CreateChoreRequest, familyId: string): Promise<Chore>;
  updateChore(id: string, updates: UpdateChoreRequest): Promise<Chore>;
  deleteChore(id: string): Promise<void>;
  assignChores(familyId: string, period: AssignmentPeriod): Promise<ChoreAssignment[]>;
  completeChore(assignmentId: string, userId: string): Promise<CompletionResult>;
  buyoutChore(assignmentId: string, userId: string): Promise<BuyoutResult>;
  getAssignmentsForUser(userId: string, period: AssignmentPeriod): Promise<ChoreAssignment[]>;
  getChoresByFamily(familyId: string): Promise<Chore[]>;
}

export class ChoreService implements IChoreService {
  constructor(
    private choreRepository: IChoreRepository,
    private assignmentRepository: IAssignmentRepository,
    private pointsService: IPointsService
  ) {}

  async createChore(request: CreateChoreRequest, familyId: string): Promise<Chore> {
    const chore: Omit<Chore, 'id' | 'createdAt'> = {
      familyId,
      ...request,
      isActive: true,
    };
    return this.choreRepository.create(chore);
  }

  async updateChore(id: string, updates: UpdateChoreRequest): Promise<Chore> {
    return this.choreRepository.update(id, updates);
  }

  async deleteChore(id: string): Promise<void> {
    return this.choreRepository.update(id, { isActive: false });
  }

  async assignChores(familyId: string, period: AssignmentPeriod): Promise<ChoreAssignment[]> {
    // In a real implementation, the AssignmentEngine would have complex logic
    // for fair chore distribution, rotation, and history tracking.
    // For now, we'll use a simplified approach.
    const chores = await this.choreRepository.findByFamilyId(familyId);
    const users = await this.pointsService.getUsersForLeaderboard(familyId);

    if (users.length === 0) {
      return [];
    }

    const assignments: Omit<ChoreAssignment, 'id' | 'createdAt'>[] = chores.map((chore, index) => ({
      familyId,
      choreId: chore.id,
      userId: users[index % users.length].id,
      periodStart: period.start,
      periodEnd: period.end,
      status: 'pending',
    }));

    const createdAssignments: ChoreAssignment[] = [];
    for (const assignment of assignments) {
      const newAssignment = await this.assignmentRepository.create(assignment);
      createdAssignments.push(newAssignment);
    }
    return createdAssignments;
  }

  async completeChore(assignmentId: string, userId: string): Promise<CompletionResult> {
    const assignment = await this.assignmentRepository.findById(assignmentId);
    if (!assignment || assignment.userId !== userId || assignment.status !== 'pending') {
      throw new Error('Chore is not available for completion.');
    }

    const pointsToAward = 10;
    await this.assignmentRepository.update(assignmentId, { status: 'completed', pointsAwarded: pointsToAward });
    await this.pointsService.awardPoints(userId, pointsToAward, `Completed chore: ${assignment.id}`);

    return {
      success: true,
      pointsAwarded: pointsToAward,
      badgesEarned: [],
    };
  }

  async buyoutChore(assignmentId: string, userId: string): Promise<BuyoutResult> {
    const assignment = await this.assignmentRepository.findById(assignmentId);
    if (!assignment || assignment.userId !== userId || assignment.status !== 'pending') {
      throw new Error('Chore is not available for buyout.');
    }

    const buyoutCost = 2;
    const currentPoints = await this.pointsService.getCurrentPoints(userId);

    if (currentPoints < buyoutCost) {
      throw new Error('Insufficient points for buyout.');
    }

    await this.assignmentRepository.update(assignmentId, { status: 'bought_out', pointsAwarded: -buyoutCost });
    await this.pointsService.deductPoints(userId, buyoutCost, `Bought out of chore: ${assignment.id}`);

    return {
      success: true,
      pointsSpent: buyoutCost,
      remainingBalance: currentPoints - buyoutCost,
    };
  }

  async getAssignmentsForUser(userId: string, period: AssignmentPeriod): Promise<ChoreAssignment[]> {
    return this.assignmentRepository.findByUserIdAndPeriod(userId, period.start, period.end);
  }

  async getChoresByFamily(familyId: string): Promise<Chore[]> {
    return this.choreRepository.findByFamilyId(familyId);
  }
}


