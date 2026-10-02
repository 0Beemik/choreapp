import { router } from 'expo-router';
import { Alert } from 'react-native';
import { useApp } from '../state/AppContext';
import { useSync } from '../state/SyncContext';
import { Avatar, Body, Button, Card, Heading, ListItem, Screen } from './components';
import { SyncBar } from './SyncBar';

/** What the 🔒/⚙️ button opens on a joined device. Parent tools stay on the main device. */
export function MemberDeviceSettings() {
  const { members } = useApp();
  const { link, leave, syncNow } = useSync();
  const who = members.find((m) => m.id === link?.userId);

  const confirmLeave = () =>
    Alert.alert('Remove this device from the family?', 'Chores stop showing here. A parent can add it back with a new code.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          await leave();
          router.dismissAll();
          router.replace('/setup');
        },
      },
    ]);

  return (
    <Screen edges={['top', 'bottom']}>
      <Heading>This device</Heading>
      <SyncBar />
      <Card>
        <ListItem
          left={who ? <Avatar user={who} size={40} /> : undefined}
          title={who ? `${who.name}’s device` : 'Whole-family view'}
          subtitle={`Part of ${link?.familyName ?? 'your family'}`}
        />
        <Body muted>
          Parent tools (chores, points, settings) are on the family’s main device. Changes made there show up here
          automatically when this device is on the same Wi-Fi.
        </Body>
      </Card>
      <Button title="Sync now" kind="secondary" onPress={syncNow} />
      <Button title="Back to chores" onPress={() => router.back()} />
      <Button title="Remove this device from the family" kind="danger" onPress={confirmLeave} />
    </Screen>
  );
}
