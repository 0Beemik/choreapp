import { AdminSession } from './AdminSession';
import { AdminPermission } from '../types';

describe('AdminSession', () => {
  it('should have the correct properties', () => {
    const session: AdminSession = {
      id: '1',
      userId: 'user-1',
      createdAt: new Date(),
      expiresAt: new Date(),
      permissions: [AdminPermission.CanManageUsers],
      lastActivity: new Date(),
    };

    expect(session.id).toBe('1');
    expect(session.userId).toBe('user-1');
    expect(session.createdAt).toBeInstanceOf(Date);
    expect(session.expiresAt).toBeInstanceOf(Date);
    expect(session.permissions).toEqual([AdminPermission.CanManageUsers]);
    expect(session.lastActivity).toBeInstanceOf(Date);
  });
});
