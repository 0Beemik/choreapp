import { AdminAuthService as AdminAuthServiceClass } from './AdminAuthService';
import { familyRepository } from '../repositories/FamilyRepository';
import * as bcrypt from 'bcryptjs';
import { Family } from '../models/Family';

jest.mock('../repositories/FamilyRepository', () => ({
  familyRepository: {
    findById: jest.fn(),
  },
}));
jest.mock('bcryptjs');

describe('AdminAuthService', () => {
  let adminAuthService: AdminAuthServiceClass;

  beforeEach(() => {
    jest.clearAllMocks();
    adminAuthService = new AdminAuthServiceClass();
  });

  describe('authenticateAdmin', () => {
    it('should authenticate an admin with a valid PIN', async () => {
      const familyId = 'family-1';
      const pin = '1234';
      const family: Family = {
        id: familyId,
        name: 'Test Family',
        settings: {
          adminPin: 'hashed-pin',
        },
        createdAt: new Date(),
      };

      (familyRepository.findById as jest.Mock).mockResolvedValue(family);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const session = await adminAuthService.authenticateAdmin(familyId, pin);

      expect(familyRepository.findById).toHaveBeenCalledWith(familyId);
      expect(bcrypt.compare).toHaveBeenCalledWith(pin, 'hashed-pin');
      expect(session).toBeDefined();
      expect(session.id).toBeDefined();
    });

    it('should throw an error for an invalid PIN', async () => {
      const familyId = 'family-1';
      const pin = 'wrong-pin';
      const family: Family = {
        id: familyId,
        name: 'Test Family',
        settings: {
          adminPin: 'hashed-pin',
        },
        createdAt: new Date(),
      };

      (familyRepository.findById as jest.Mock).mockResolvedValue(family);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(adminAuthService.authenticateAdmin(familyId, pin)).rejects.toThrow('Invalid PIN');
    });

    it('should throw an error if admin PIN is not set up', async () => {
      const familyId = 'family-1';
      const pin = '1234';
      const family: Family = {
        id: familyId,
        name: 'Test Family',
        settings: {},
        createdAt: new Date(),
      };

      (familyRepository.findById as jest.Mock).mockResolvedValue(family);

      await expect(adminAuthService.authenticateAdmin(familyId, pin)).rejects.toThrow('Admin PIN not set up for this family.');
    });
  });

  describe('validateAdminSession', () => {
    it('should validate an admin session', async () => {
      const sessionId = 'session-1';
      const result = await adminAuthService.validateAdminSession(sessionId);
      expect(result).toBe(true);
    });
  });

  describe('refreshAdminSession', () => {
    it('should refresh an admin session', async () => {
      const sessionId = 'session-1';
      const session = await adminAuthService.refreshAdminSession(sessionId);
      expect(session).toBeDefined();
      expect(session.id).toBe(sessionId);
    });
  });
});