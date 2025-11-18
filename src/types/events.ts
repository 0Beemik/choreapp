import { Badge } from '../models/Badge';

export interface ChoreCompletionEvent {
  userId: string;
  choreId: string;
  completedAt: Date;
}

export interface BadgeAwardedEvent {
  userId: string;
  badge: Badge;
}