import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';
import { ExpoDb } from '../database/connection';
import { createServices } from '../services';
import { findHubAddress, httpTransport } from '../sync/device';
import { SyncMember } from '../sync/SyncMember';
import { deliver, notificationsAllowed } from './deliver';
import { phoneNotificationsEnabled, takeNewNotices } from './phoneNotices';

/**
 * Joined devices check in with the main device in the background (Android allows every 15
 * minutes at best) so news like "you've been pushed" arrives with the app closed. Must be
 * defined at startup, so this module is imported by the root layout.
 */
export const BACKGROUND_SYNC_TASK = 'family-chores-background-sync';

TaskManager.defineTask(BACKGROUND_SYNC_TASK, async () => {
  try {
    const services = await createServices(await ExpoDb.open());
    const member = new SyncMember(services, httpTransport, findHubAddress);
    const link = await member.link();
    if (!link) return BackgroundTask.BackgroundTaskResult.Success;
    await member.sync();
    if (!(await phoneNotificationsEnabled(services)) || !(await notificationsAllowed(false))) {
      return BackgroundTask.BackgroundTaskResult.Success;
    }
    const family = await services.family.current();
    const members = family ? await services.family.members(family.id) : [];
    const viewers = link.userId ? [link.userId] : members.map((m) => m.id);
    await deliver(await takeNewNotices(services, viewers, members));
    return BackgroundTask.BackgroundTaskResult.Success;
  } catch {
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});

export async function setBackgroundSync(on: boolean): Promise<void> {
  const registered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_SYNC_TASK);
  if (on && !registered) await BackgroundTask.registerTaskAsync(BACKGROUND_SYNC_TASK, { minimumInterval: 15 });
  if (!on && registered) await BackgroundTask.unregisterTaskAsync(BACKGROUND_SYNC_TASK);
}
