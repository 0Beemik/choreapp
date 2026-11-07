import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { PhoneNotice } from './phoneNotices';

const CHANNEL = 'family-news';

// Shown even while the app is open (the main device can be on screen when a kid's deal lands).
Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
});

/** Creates the Android channel; asks for permission only when `ask` (never from the background). */
export async function notificationsAllowed(ask: boolean): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL, {
      name: 'Family news',
      description: 'Chores bought, sold and pushed in your family',
      importance: Notifications.AndroidImportance.DEFAULT,
      lightColor: '#6C5CE7',
    });
  }
  const current = await Notifications.getPermissionsAsync();
  if (current.granted || !ask || !current.canAskAgain) return current.granted;
  return (await Notifications.requestPermissionsAsync()).granted;
}

export async function deliver(notices: PhoneNotice[]): Promise<void> {
  for (const n of notices) {
    await Notifications.scheduleNotificationAsync({
      content: { title: n.title, body: n.body, data: { url: '/notifications' } },
      trigger: Platform.OS === 'android' ? { channelId: CHANNEL } : null,
    });
  }
}

/** Tapping a notification opens the bell list. */
export function onNotificationTap(open: (url: string) => void): () => void {
  const sub = Notifications.addNotificationResponseReceivedListener((r) => {
    const url = r.notification.request.content.data?.url;
    if (typeof url === 'string') open(url);
  });
  return () => sub.remove();
}
