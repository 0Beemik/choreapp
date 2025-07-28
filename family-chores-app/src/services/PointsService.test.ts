import { PointsService } from './PointsService';
import { IPointsRepository } from '../repositories/PointsRepository';
import { PointTransaction } from '../models/PointTransaction';
import { TransactionType } from '../types';

describe('PointsService', () => {
  let pointsService: PointsService;
  let pointsRepository: jest.Mocked<IPointsRepository>;

  beforeEach(() => {
    pointsRepository = {
      create: jest.fn(),
      getUserTotal: jest.fn(),
      findByUserId: jest.fn(),
    } as any;
    pointsService = new PointsService(pointsRepository);
  });

  describe('awardPoints', () => {
    it('should award points to a user', async () => {
      const transaction: PointTransaction = {
        id: 't-1',
        userId: 'user-1',
        amount: 100,
        reason: 'Test award',
        transactionType: TransactionType.EARNED,
        adminOverride: false,
        createdAt: new Date(),
      };
      pointsRepository.create.mockResolvedValue(transaction);

      const result = await pointsService.awardPoints('user-1', 100, 'Test award');

      expect(pointsRepository.create).toHaveBeenCalledWith({
        userId: 'user-1',
        amount: 100,
        reason: 'Test award',
        transactionType: TransactionType.EARNED,
        adminOverride: false,
      });
      expect(result).toEqual(transaction);
    });
  });

  describe('deductPoints', () => {
    it('should deduct points from a user', async () => {
      const transaction: PointTransaction = {
        id: 't-1',
        userId: 'user-1',
        amount: -100,
        reason: 'Test deduction',
        transactionType: TransactionType.DEDUCTED,
        adminOverride: false,
        createdAt: new Date(),
      };
      pointsRepository.create.mockResolvedValue(transaction);

      const result = await pointsService.deductPoints('user-1', 100, 'Test deduction');

      expect(pointsRepository.create).toHaveBeenCalledWith({
        userId: 'user-1',
        amount: -100,
        reason: 'Test deduction',
        transactionType: TransactionType.DEDUCTED,
        adminOverride: false,
      });
      expect(result).toEqual(transaction);
    });
  });

  describe('adjustPoints', () => {
    it('should adjust points for a user', async () => {
      const transaction: PointTransaction = {
        id: 't-1',
        userId: 'user-1',
        amount: 50,
        reason: 'Test adjustment',
        transactionType: TransactionType.BONUS,
        adminOverride: true,
        createdAt: new Date(),
      };
      pointsRepository.create.mockResolvedValue(transaction);

      const result = await pointsService.adjustPoints('user-1', 50, 'Test adjustment');

      expect(pointsRepository.create).toHaveBeenCalledWith({
        userId: 'user-1',
        amount: 50,
        reason: 'Test adjustment',
        transactionType: TransactionType.BONUS,
        adminOverride: true,
      });
      expect(result).toEqual(transaction);
    });
  });

  describe('getCurrentPoints', () => {
    it('should get current points for a user', async () => {
      pointsRepository.getUserTotal.mockResolvedValue(500);

      const result = await pointsService.getCurrentPoints('user-1');

      expect(pointsRepository.getUserTotal).toHaveBeenCalledWith('user-1');
      expect(result).toBe(500);
    });
  });

  describe('getPointHistory', () => {
    it('should get point history for a user', async () => {
      const history: PointTransaction[] = [
        { id: 't-1', userId: 'user-1', amount: 100, reason: 'Chore', transactionType: TransactionType.EARNED, adminOverride: false, createdAt: new Date() },
        { id: 't-2', userId: 'user-1', amount: -50, reason: 'Buyout', transactionType: TransactionType.DEDUCTED, adminOverride: false, createdAt: new Date() },
      ];
      pointsRepository.findByUserId.mockResolvedValue(history);

      const result = await pointsService.getPointHistory('user-1');

      expect(pointsRepository.findByUserId).toHaveBeenCalledWith('user-1', undefined, undefined);
      expect(result).toEqual(history);
    });
  });

  describe('transferPoints', () => {
    it('should transfer points between users', async () => {
      const fromTransaction: PointTransaction = {
        id: 't-1',
        userId: 'user-1',
        amount: -100,
        reason: 'Transfer to user user-2: Gift',
        transactionType: TransactionType.DEDUCTED,
        adminOverride: false,
        createdAt: new Date(),
      };
      const toTransaction: PointTransaction = {
        id: 't-2',
        userId: 'user-2',
        amount: 100,
        reason: 'Transfer from user user-1: Gift',
        transactionType: TransactionType.EARNED,
        adminOverride: false,
        createdAt: new Date(),
      };
      pointsRepository.create.mockResolvedValueOnce(fromTransaction);
      pointsRepository.create.mockResolvedValueOnce(toTransaction);

      const result = await pointsService.transferPoints('user-1', 'user-2', 100, 'Gift');

      expect(pointsRepository.create).toHaveBeenCalledWith({
        userId: 'user-1',
        amount: -100,
        reason: 'Transfer to user user-2: Gift',
        transactionType: TransactionType.DEDUCTED,
        adminOverride: false,
      });
      expect(pointsRepository.create).toHaveBeenCalledWith({
        userId: 'user-2',
        amount: 100,
        reason: 'Transfer from user user-1: Gift',
        transactionType: TransactionType.EARNED,
        adminOverride: false,
      });
      expect(result).toEqual([fromTransaction, toTransaction]);
    });
  });

  describe('calculateAllowance', () => {
    it('should calculate allowance for a user', async () => {
      const history: PointTransaction[] = [
        { id: 't-1', userId: 'user-1', amount: 100, reason: 'Chore', transactionType: TransactionType.EARNED, adminOverride: false, createdAt: new Date() },
        { id: 't-2', userId: 'user-1', amount: 50, reason: 'Chore', transactionType: TransactionType.EARNED, adminOverride: false, createdAt: new Date() },
        { id: 't-3', userId: 'user-1', amount: -20, reason: 'Buyout', transactionType: TransactionType.DEDUCTED, adminOverride: false, createdAt: new Date() },
      ];
      pointsRepository.findByUserId.mockResolvedValue(history);

      const result = await pointsService.calculateAllowance('user-1', { start: new Date(), end: new Date() }, 0.1);

      expect(pointsRepository.findByUserId).toHaveBeenCalled();
      expect(result.totalPoints).toBe(150);
      expect(result.allowanceAmount).toBe(15);
    });
  });
});
