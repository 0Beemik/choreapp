import type { AppNotification } from '../models';
import type { Deps } from './deps';

const SEEN_KEY = 'notifications_seen_at';

/**
 * The in-app bell. Notifications sync like everything else; "seen" is remembered per device,
 * so a kid's phone tracks that kid and a shared tablet tracks the whole family.
 */
export class NotificationService {
  constructor(private deps: Deps) {}

  list(userIds: string[]): Promise<AppNotification[]> {
    return this.deps.repos.notifications.forUsers(userIds);
  }

  async unseenCount(userIds: string[]): Promise<number> {
    const seen = (await this.deps.repos.appState.get(SEEN_KEY)) ?? '';
    return this.deps.repos.notifications.countSince(userIds, seen);
  }

  async markSeen(): Promise<void> {
    await this.deps.repos.appState.set(SEEN_KEY, this.deps.timestamp());
  }
}
