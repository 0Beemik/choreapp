import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert } from 'react-native';
import { useApp } from '../state/AppContext';
import { PhoneNotificationsCard } from '../notify/PhoneNotificationsCard';
import { UserFacingError } from '../services/deps';
import { useSync } from '../state/SyncContext';
import { Avatar, Body, Button, Card, Heading, ListItem, Screen } from './components';
import { CountertopCard } from './Countertop';
import { PinPad } from './PinPad';
import { colors } from './theme';
import { SyncBar } from './SyncBar';

/** What the 🔒/⚙️ button opens on a joined device. Parent tools stay on the main device. */
export function MemberDeviceSettings() {
  const { members } = useApp();
  const { link, leave, syncNow, becomeMainDevice } = useSync();
  const [moving, setMoving] = useState<'idle' | 'pin' | 'busy'>('idle');
  const [pinError, setPinError] = useState<string | null>(null);
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

  const startMove = () =>
    Alert.alert(
      'Make this the main device?',
      'Everything moves here: chores, points, coins, the marketplace and parent settings. The current main device becomes an ordinary family device, and every phone finds this one by itself. Keep both devices on home Wi-Fi. A parent PIN is needed.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Continue', onPress: () => setMoving('pin') },
      ],
    );

  const move = async (pin: string) => {
    setMoving('busy');
    setPinError(null);
    try {
      await becomeMainDevice(pin);
      setMoving('idle');
      Alert.alert('This is now the main device 🎉', 'Parent tools are here now (🔒, same PIN). Family phones reconnect on their own.');
      router.dismissAll();
      router.replace('/board');
    } catch (e) {
      const message = e instanceof UserFacingError ? e.message : 'Something went wrong. Nothing changed.';
      if (message.includes('PIN')) {
        setPinError(message);
        setMoving('pin');
      } else {
        setMoving('idle');
        Alert.alert('Couldn’t move the main device', message);
      }
    }
  };

  if (moving !== 'idle') {
    return (
      <Screen edges={['top', 'bottom']}>
        {moving === 'busy' ? (
          <Card>
            <ActivityIndicator color={colors.primary} />
            <Body>Moving everything to this device… keep both devices on Wi-Fi.</Body>
          </Card>
        ) : (
          <>
            <PinPad title="Parent PIN to make this the main device" error={pinError} onComplete={move} />
            <Button title="Cancel" kind="ghost" onPress={() => setMoving('idle')} />
          </>
        )}
      </Screen>
    );
  }

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
      <PhoneNotificationsCard />
      <CountertopCard />
      <Card>
        <Heading>🏠 Main device</Heading>
        <Body muted>
          Want this device (say, a tablet on the counter) to run the family instead? It takes over everything, including parent tools.
        </Body>
        <Button title="Make this the main device" kind="secondary" onPress={startMove} />
      </Card>
      <Button title="Sync now" kind="secondary" onPress={syncNow} />
      <Button title="Back to chores" onPress={() => router.back()} />
      <Button title="Remove this device from the family" kind="danger" onPress={confirmLeave} />
    </Screen>
  );
}
