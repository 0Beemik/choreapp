import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Text } from 'react-native';
import { UserFacingError } from '@/src/services';
import { discoverHubs, httpTransport, normalizeAddress, type FoundHub } from '@/src/sync/device';
import { SyncMember } from '@/src/sync/SyncMember';
import { useApp } from '@/src/state/AppContext';
import { useSync } from '@/src/state/SyncContext';
import { Avatar, Body, Button, Card, ErrorText, Field, Heading, ListItem, Screen, Title } from '@/src/ui/components';
import { colors, font } from '@/src/ui/theme';

type Step = 'find' | 'code' | 'who';

export default function Join() {
  const { services, kids } = useApp();
  const { supported, join, chooseUser } = useSync();
  const [step, setStep] = useState<Step>('find');
  const [scanning, setScanning] = useState(supported);
  const [found, setFound] = useState<FoundHub[]>([]);
  const [manual, setManual] = useState('');
  const [target, setTarget] = useState<{ address: string; familyName: string } | null>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const finishScan = useCallback((hubs: FoundHub[]) => {
    setFound(hubs);
    setScanning(false);
  }, []);

  const scan = () => {
    setScanning(true);
    discoverHubs().then(finishScan);
  };

  useEffect(() => {
    if (supported) discoverHubs().then(finishScan);
  }, [supported, finishScan]);

  const useManual = async () => {
    const address = normalizeAddress(manual);
    if (!address) return setError('Type the address shown on the main device, like 192.168.1.20');
    setBusy(true);
    setError(null);
    try {
      const hello = await new SyncMember(services, httpTransport).probe(address);
      setTarget({ address, familyName: hello.familyName });
      setStep('code');
    } catch (e) {
      setError(e instanceof UserFacingError ? e.message : 'Couldn’t reach that address.');
    } finally {
      setBusy(false);
    }
  };

  const submitCode = async () => {
    if (!target) return;
    setBusy(true);
    setError(null);
    try {
      await join(target.address, code.replace(/\D/g, ''));
      setStep('who');
    } catch (e) {
      setError(e instanceof UserFacingError ? e.message : 'Joining failed. Ask for a new code and try again.');
    } finally {
      setBusy(false);
    }
  };

  const pick = async (userId: string | null) => {
    setBusy(true);
    await chooseUser(userId);
    router.replace('/board');
  };

  if (!supported) {
    return (
      <Screen>
        <Title>Not available on this device yet</Title>
        <Body muted>Joining a family’s main device works on Android today. iPhone support is coming.</Body>
        <Button title="Back" kind="ghost" onPress={() => router.back()} />
      </Screen>
    );
  }

  if (step === 'who') {
    return (
      <Screen>
        <Title>Who uses this device?</Title>
        <Body muted>A kid’s own device shows only their chores.</Body>
        <Card>
          {kids.map((k) => (
            <ListItem key={k.id} left={<Avatar user={k} size={44} />} title={k.name} subtitle={`${k.name}’s phone or tablet`} onPress={() => pick(k.id)} />
          ))}
          <ListItem
            left={<Text style={{ fontSize: 32 }}>🏠</Text>}
            title="The whole family"
            subtitle="A shared tablet or a second parent’s phone"
            onPress={() => pick(null)}
          />
        </Card>
        {busy ? <ActivityIndicator color={colors.primary} /> : null}
      </Screen>
    );
  }

  if (step === 'code' && target) {
    return (
      <Screen>
        <Title>Joining {target.familyName}</Title>
        <Body muted>On the main device, open 🔒 Parent area → Family devices → Add a device. Type the 6-digit code it shows.</Body>
        <Field
          label="Code"
          value={code}
          onChangeText={(t) => setCode(t.replace(/\D/g, '').slice(0, 6))}
          keyboardType="number-pad"
          placeholder="123456"
          autoFocus
          style={{ fontSize: font.hero, letterSpacing: 6, textAlign: 'center' }}
        />
        <ErrorText>{error}</ErrorText>
        <Button title="Join" onPress={submitCode} disabled={code.length !== 6} busy={busy} />
        <Button title="Back" kind="ghost" onPress={() => setStep('find')} />
      </Screen>
    );
  }

  return (
    <Screen>
      <Title>Find your family’s main device</Title>
      <Body muted>Make sure this device and the main device are on the same home Wi-Fi, and Family Chores is open on the main device.</Body>
      <Card>
        <Heading>{scanning ? 'Looking…' : found.length ? 'Found on your Wi-Fi' : 'Nothing found yet'}</Heading>
        {scanning ? <ActivityIndicator color={colors.primary} /> : null}
        {found.map((h) => (
          <ListItem
            key={h.hubId}
            left={<Text style={{ fontSize: 28 }}>🏡</Text>}
            title={h.familyName}
            subtitle={h.address}
            onPress={() => {
              setTarget(h);
              setError(null);
              setStep('code');
            }}
          />
        ))}
        {!scanning ? <Button title="Search again" kind="secondary" onPress={scan} /> : null}
      </Card>
      <Card>
        <Heading>Or type its address</Heading>
        <Body muted>It’s shown on the main device next to the code.</Body>
        <Field label="Address" value={manual} onChangeText={setManual} placeholder="192.168.1.20" keyboardType="numbers-and-punctuation" autoCapitalize="none" />
        <ErrorText>{error}</ErrorText>
        <Button title="Connect" onPress={useManual} busy={busy} disabled={!manual.trim()} />
      </Card>
    </Screen>
  );
}
