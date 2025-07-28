import * as bcrypt from 'bcryptjs';
import * as crypto from 'expo-crypto';
import { AdminSession } from '../models/AdminSession';
import { IFamilyRepository } from '../repositories/FamilyRepository';
import { IAdminSessionRepository } from '../repositories/AdminSessionRepository';

export interface IAdminAuthService {
  authenticateAdmin(familyId: string, userId: string, pin: string): Promise<AdminSession>;
  validateAdminSession(sessionId: string): Promise<boolean>;
  refreshAdminSession(sessionId: string): Promise<AdminSession>;
  logAdminAction(sessionId: string, action: unknown): Promise<void>;
  revokeAdminSession(sessionId: string): Promise<void>;
}

export class AdminAuthService implements IAdminAuthService {
  constructor(
    private familyRepository: IFamilyRepository,
    private adminSessionRepository: IAdminSessionRepository
  ) {}

  async authenticateAdmin(familyId: string, userId: string, pin: string): Promise<AdminSession> {
    const family = await this.familyRepository.findById(familyId);
    if (!family || !family.settings.adminPin) {
      throw new Error('Admin PIN not set up for this family.');
    }

    const isMatch = await bcrypt.compare(pin, family.settings.adminPin);

    if (isMatch) {
      const session: Omit<AdminSession, 'id'> = {
        userId,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
        permissions: [], // Permissions can be expanded in the future
        lastActivity: new Date(),
      };
      const newSession = await this.adminSessionRepository.create({
        ...session,
        id: crypto.randomUUID(),
      });
      return newSession;
    } else {
      throw new Error('Invalid PIN');
    }
  }

  async validateAdminSession(sessionId: string): Promise<boolean> {
    const session = await this.adminSessionRepository.findBySessionId(sessionId);
    if (!session) {
      return false;
    }

    const isExpired = new Date() > session.expiresAt;
    if (isExpired) {
      await this.revokeAdminSession(sessionId);
      return false;
    }

    return true;
  }

  async refreshAdminSession(sessionId: string): Promise<AdminSession> {
    const session = await this.adminSessionRepository.findBySessionId(sessionId);
    if (!session) {
      throw new Error('Invalid session ID');
    }

    const updatedSession = await this.adminSessionRepository.update(sessionId, {
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      lastActivity: new Date(),
    });

    return updatedSession;
  }

  async logAdminAction(sessionId: string, action: unknown): Promise<void> {
    // This can be implemented with a separate audit log repository
    console.log(`Admin action for session ${sessionId}:`, action);
  }

  async revokeAdminSession(sessionId: string): Promise<void> {
    await this.adminSessionRepository.delete(sessionId);
  }
}
