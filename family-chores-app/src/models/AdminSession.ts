import { AdminPermission } from "../types";

export interface AdminSession {
  id: string;
  userId: string;
  createdAt: Date;
  expiresAt: Date;
  permissions: AdminPermission[];
  lastActivity: Date;
}