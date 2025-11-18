import { User } from '../models/User';
import { ChoreAssignment } from '../models/ChoreAssignment';
import { Family } from '../models/Family';
import { IPointsService } from './PointsService';
import { IAssignmentRepository } from '../repositories/AssignmentRepository';
import { IUserRepository } from '../repositories/UserRepository';
import { IFamilyRepository } from '../repositories/FamilyRepository';
import { BuyoutTransaction } from '../models/BuyoutTransaction';
import { TransactionManager } from '../database/TransactionManager';

// As per DEVELOPMENT_ROADMAP.md
export interface CostBreakdown {
    basePoints: number;
    buyoutCostPercentage: number;
    totalCost: number;
  }
  
  export interface BuyoutCalculation {
    choreId: string;
    baseCost: number;
    adjustedCost: number;
    userBalance: number;
    canAfford: boolean;
    remainingBalance: number;
    costBreakdown: CostBreakdown;
  }
  
  export interface BuyoutEligibility {
    isEligible: boolean;
    reason?: string;
  }
  
  export interface IBuyoutService {
    calculateBuyoutCost(userId: string, assignmentId: string): Promise<BuyoutCalculation>;
    validateBuyoutEligibility(userId: string, assignmentId: string): Promise<BuyoutEligibility>;
    processBuyout(userId: string, assignmentId: string): Promise<void>;
    getBuyoutHistory(userId: string, period: { start: Date; end: Date }): Promise<BuyoutTransaction[]>;
    getRemainingBuyouts(userId: string, month: Date): Promise<number>;
  }
  
  export class BuyoutService implements IBuyoutService {
    constructor(
      private pointsService: IPointsService,
      private assignmentRepository: IAssignmentRepository,
      private userRepository: IUserRepository,
      private familyRepository: IFamilyRepository,
      private transactionManager: TransactionManager
    ) {}
  
    async calculateBuyoutCost(
      userId: string,
      assignmentId: string
    ): Promise<BuyoutCalculation> {
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }
      const assignment = await this.assignmentRepository.findById(assignmentId);
      if (!assignment) {
        throw new Error('Chore assignment not found');
      }
      const family = await this.familyRepository.findById(user.familyId);
      if (!family) {
        throw new Error('Family not found');
      }
  
      const userBalance = await this.pointsService.getCurrentPoints(user.id);
      const baseCost = family.settings.pointsPerChore;
      const adjustedCost = baseCost * (family.settings.buyoutCostPercentage / 100);
  
      return {
        choreId: assignment.choreId,
        baseCost,
        adjustedCost,
        userBalance,
        canAfford: userBalance >= adjustedCost,
        remainingBalance: userBalance - adjustedCost,
        costBreakdown: {
          basePoints: baseCost,
          buyoutCostPercentage: family.settings.buyoutCostPercentage,
          totalCost: adjustedCost,
        },
      };
    }
  
    async validateBuyoutEligibility(
      userId: string,
      assignmentId: string
    ): Promise<BuyoutEligibility> {
      const user = await this.userRepository.findById(userId);
      if (!user) {
        return { isEligible: false, reason: 'User not found.' };
      }
      const family = await this.familyRepository.findById(user.familyId);
      if (!family) {
        return { isEligible: false, reason: 'Family not found.' };
      }
  
      const calculation = await this.calculateBuyoutCost(userId, assignmentId);
      if (!calculation.canAfford) {
        return { isEligible: false, reason: 'Insufficient points.' };
      }
  
      const buyoutHistory = await this.getBuyoutHistoryForCurrentMonth(user.id);
      if (buyoutHistory.length >= family.settings.maxBuyoutsPerMonth) {
        return { isEligible: false, reason: 'Monthly buyout limit reached.' };
      }
  
      return { isEligible: true };
    }
  
    async processBuyout(
      userId: string,
      assignmentId: string
    ): Promise<void> {
      const eligibility = await this.validateBuyoutEligibility(userId, assignmentId);
      if (!eligibility.isEligible) {
        throw new Error(eligibility.reason);
      }
  
      const calculation = await this.calculateBuyoutCost(userId, assignmentId);
  
      await this.transactionManager.runInTransaction(async (tx) => {
        await this.pointsService.deductPoints(
          userId,
          calculation.adjustedCost,
          `Buyout for chore: ${assignmentId}`,
          {},
          tx
        );
  
        await this.assignmentRepository.update(assignmentId, {
          status: 'bought_out',
          boughtOutAt: new Date(),
          pointsSpent: calculation.adjustedCost,
        }, tx);
      });
    }
  
    async getBuyoutHistory(userId: string, period: { start: Date; end: Date }): Promise<BuyoutTransaction[]> {
      const boughtOutAssignments = await this.assignmentRepository.findBoughtOutByDateRange(userId, period.start, period.end);
      
      return boughtOutAssignments.map(assignment => ({
          id: assignment.id,
          userId: assignment.userId,
          choreId: assignment.choreId,
          pointsSpent: assignment.pointsSpent || 0,
          boughtOutAt: assignment.boughtOutAt || new Date(),
      }));
    }
  
    async getRemainingBuyouts(userId: string, month: Date): Promise<number> {
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }
        const family = await this.familyRepository.findById(user.familyId);
        if (!family) {
            throw new Error('Family not found');
        }

        const history = await this.getBuyoutHistoryForCurrentMonth(userId);
        return family.settings.maxBuyoutsPerMonth - history.length;
    }
  
    private async getBuyoutHistoryForCurrentMonth(userId: string): Promise<ChoreAssignment[]> {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  
      return this.assignmentRepository.findBoughtOutByDateRange(userId, startOfMonth, endOfMonth);
    }
  }