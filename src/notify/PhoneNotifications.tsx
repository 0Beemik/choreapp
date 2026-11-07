import { router } from 'expo-router';
import { useEffect } from 'react';
import { AppState } from 'react-native';
import { useApp } from '../state/AppContext';
import { useSync } from '../state/SyncContext';
import { setBackgroundSync } from './background';
import { deliver, notificationsAllowed, onNotificationTap } from './deliver';
import { phoneNotificationsEnabled, takeNewNotices } from './phoneNotices';

/**
 * Turns new family news into phone notifications. Renders nothing. While the app is on screen
 * the bell already shows the news, so only news that arrives in the background pops up.
 */
export function PhoneNotifications() {
  const { family, members, board, coins, services } = useApp();
  const { mode, ownerId } = useSync();
  const familyId = family?.id;
  const viewerKey = (ownerId ? [ownerId] : members.map((m) => m.id)).join(',');

  // Ask once per device for permission, and keep the background check-in matched to the mode.
  useEffect(() => {
    if (!familyId || mode === 'none') return;
    (async () => {
      const on = await phoneNotificationsEnabled(services);
      if (on) await notificationsAllowed(true);
      await setBackgroundSync(on && mode === 'member');
    })().catch(() => undefined);
  }, [familyId, mode, services]);

  useEffect(() => onNotificationTap((url) => router.push(url as '/notifications')), []);

  // Every data change (a sync, a deal relayed through the main device) may carry news.
  useEffect(() => {
    if (!familyId || mode === 'none') return;
    (async () => {
      if (!(await phoneNotificationsEnabled(services))) return;
      const notices = await takeNewNotices(services, viewerKey.split(',').filter(Boolean), members);
      if (notices.length === 0 || AppState.currentState === 'active') return;
      if (await notificationsAllowed(false)) await deliver(notices);
    })().catch(() => undefined);
    // board/coins change identity on every refresh, which is exactly when news can arrive.
  }, [familyId, mode, services, viewerKey, members, board, coins]);

  return null;
}
