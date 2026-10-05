import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { hubAddresses } from '@/src/sync/device';
import type { PairedDevice } from '@/src/sync/SyncHub';
import { useApp } from '@/src/state/AppContext';
import { useSync } from '@/src/state/SyncContext';
import { Avatar, Body, Button, Card, Heading, ListItem, Screen } from '@/src/ui/components';
import { colors, radius, space } from '@/src/ui/theme';

export default function Devices() {
  const { members } = useApp();
  const { supported, hub, hubPort, devicesChanged } = useSync();
  const [devices, setDevices] = useState<PairedDevice[]>([]);
  const [pairing, setPairing] = useState<{ code: string; expiresAt: number; devicesBefore: number } | null>(null);
  const [addresses, setAddresses] = useState<string[]>([]);
  const [now, setNow] = useState(() => Date.now());

  const load = useCallback(async () => setDevices(await hub.devices()), [hub]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  // While a code is showing, count down and watch for the new device. Codes work once,
  // so the code is put away as soon as a device joins with it.
  useEffect(() => {
    if (!pairing) return;
    const t = setInterval(() => {
      setNow(Date.now());
      hub.devices().then((next) => {
        setDevices(next);
        if (next.length > pairing.devicesBefore) setPairing(null);
      });
    }, 2000);
    return () => clearInterval(t);
  }, [pairing, hub]);

  useEffect(() => {
    if (hubPort) hubAddresses(hubPort).then(setAddresses);
  }, [hubPort]);

  const count = devices.length;
  useEffect(() => {
    devicesChanged();
  }, [count, devicesChanged]);


  if (!supported) {
    return (
      <Screen>
        <Card>
          <Heading>Not available on this device yet</Heading>
          <Body muted>Sharing chores with other phones works on Android today. iPhone support is coming.</Body>
        </Card>
      </Screen>
    );
  }

  const secondsLeft = pairing ? Math.max(0, Math.round((pairing.expiresAt - now) / 1000)) : 0;
  const expired = pairing !== null && secondsLeft === 0;
  const nameOf = (id: string | null) => members.find((m) => m.id === id);

  const remove = (d: PairedDevice) =>
    Alert.alert(`Remove ${d.name}?`, 'It stops getting chores. You can add it again with a new code.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          await hub.removeDevice(d.id);
          await load();
        },
      },
    ]);

  return (
    <Screen>
      <Card>
        <Heading>Put chores on another phone or tablet</Heading>
        <Body muted>
          This device is your family’s main device. Other devices on the same Wi-Fi get chores from here, and kids can
          tick them off on their own phone. Everything stays in your home: no accounts, no cloud.
        </Body>
        {pairing && !expired ? (
          <View style={styles.codeBox}>
            <Body center>On the other device, install Family Chores and tap “Join my family”. Enter this code:</Body>
            <Text style={styles.code} accessibilityLabel={`Pairing code ${pairing.code.split('').join(' ')}`} testID="pairing-code">
              {pairing.code.slice(0, 3)} {pairing.code.slice(3)}
            </Text>
            <Body muted center>
              Works once · expires in {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, '0')}
            </Body>
            {addresses.length ? (
              <Body muted center>
                If it can’t find this device, type this address there: {addresses.join(' or ')}
              </Body>
            ) : null}
            <Button
              title="Done"
              kind="ghost"
              onPress={() => {
                hub.cancelPairing();
                setPairing(null);
              }}
            />
          </View>
        ) : (
          <Button title="Add a device" onPress={() => setPairing({ ...hub.newPairingCode(), devicesBefore: devices.length })} style={{ marginTop: space.md }} />
        )}
      </Card>

      <Card>
        <Heading>Connected devices</Heading>
        {devices.length === 0 ? <Body muted>None yet.</Body> : null}
        {devices.map((d) => {
          const who = nameOf(d.userId);
          return (
            <ListItem
              key={d.id}
              left={who ? <Avatar user={who} size={36} /> : <Text style={{ fontSize: 28 }}>📱</Text>}
              title={d.name}
              subtitle={`${who ? `${who.name}’s device` : 'Whole-family view'} · last synced ${d.lastSeenAt ? d.lastSeenAt.replace('T', ' ').slice(0, 16) : 'never'}`}
              right={<Button title="Remove" kind="ghost" onPress={() => remove(d)} />}
            />
          );
        })}
        {devices.length > 0 ? (
          <Body muted>
            Android keeps this device reachable for a few hours after you close the app (you’ll see a notification). Kids’
            ticks are saved on their phone and sync as soon as both devices are home and awake.
          </Body>
        ) : null}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  codeBox: {
    marginTop: space.md,
    padding: space.lg,
    borderRadius: radius.lg,
    backgroundColor: '#EEEAFE',
    gap: space.sm,
    alignItems: 'center',
  },
  code: { fontSize: 44, fontWeight: '900', letterSpacing: 6, color: colors.primary },
});
