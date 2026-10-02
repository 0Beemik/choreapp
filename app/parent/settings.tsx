import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { addDays, formatDay, WEEKDAYS, type Weekday } from '@/src/lib/dates';
import type { FamilySettings, Vacation } from '@/src/models';
import { UserFacingError } from '@/src/services';
import { useApp } from '@/src/state/AppContext';
import { Body, Button, Card, Choice, ErrorText, Field, Heading, ListItem, Screen } from '@/src/ui/components';
import { PinPad } from '@/src/ui/PinPad';

const num = (s: string) => (s.trim() === '' ? NaN : Number(s));

export default function Settings() {
  const { family, services, refresh } = useApp();
  const s = family?.settings;
  const [name, setName] = useState(family?.name ?? '');
  const [points, setPoints] = useState(String(s?.pointsPerChore ?? ''));
  const [skipPct, setSkipPct] = useState(String(s?.buyoutCostPercentage ?? ''));
  const [skips, setSkips] = useState(String(s?.maxBuyoutsPerMonth ?? ''));
  const [penalty, setPenalty] = useState(String(s?.missedChorePenalty ?? ''));
  const [day, setDay] = useState<Weekday>(s?.rotationDay ?? 'sunday');
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [vacations, setVacations] = useState<Vacation[]>([]);
  const [vacStart, setVacStart] = useState<'today' | 'tomorrow'>('tomorrow');
  const [vacDays, setVacDays] = useState('7');
  const [pinStep, setPinStep] = useState<'idle' | 'new' | 'confirm'>('idle');
  const [newPin, setNewPin] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);

  const loadVacations = useCallback(async () => {
    if (family) setVacations(await services.vacations.upcoming(family.id));
  }, [family, services]);

  useFocusEffect(
    useCallback(() => {
      loadVacations();
    }, [loadVacations]),
  );

  if (!family || !s) return null;

  const saveRules = async () => {
    setError(null);
    setSaved(false);
    try {
      const next: FamilySettings = {
        pointsPerChore: num(points),
        buyoutCostPercentage: num(skipPct),
        maxBuyoutsPerMonth: num(skips),
        missedChorePenalty: num(penalty),
        rotationDay: day,
      };
      if (name.trim() !== family.name) await services.family.rename(family.id, name);
      await services.family.updateSettings(family.id, next);
      await refresh();
      setSaved(true);
    } catch (e) {
      setError(e instanceof UserFacingError ? e.message : 'Could not save. Please try again.');
    }
  };

  const addVacation = async () => {
    try {
      const today = services.deps.today();
      await services.vacations.add(family.id, vacStart === 'today' ? today : addDays(today, 1), num(vacDays));
      await refresh();
      await loadVacations();
    } catch (e) {
      Alert.alert('Can’t add vacation', e instanceof UserFacingError ? e.message : 'Please try again.');
    }
  };

  const resetAll = () =>
    Alert.alert('Erase everything?', 'All kids, chores, points and badges on this device will be deleted. This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Erase',
        style: 'destructive',
        onPress: async () => {
          await services.family.resetEverything();
          await refresh();
          router.dismissAll();
          router.replace('/setup');
        },
      },
    ]);

  if (pinStep !== 'idle') {
    return (
      <Screen>
        <PinPad
          title={pinStep === 'new' ? 'Enter a new PIN' : 'Confirm the new PIN'}
          error={pinError}
          onComplete={async (pin) => {
            if (pinStep === 'new') {
              setNewPin(pin);
              setPinError(null);
              setPinStep('confirm');
            } else if (pin !== newPin) {
              setPinError('Those didn’t match. Start again.');
              setPinStep('new');
            } else {
              await services.family.changePin(family.id, pin);
              setPinStep('idle');
              Alert.alert('PIN changed', 'Use the new PIN next time.');
            }
          }}
        />
        <Button title="Cancel" kind="ghost" onPress={() => setPinStep('idle')} />
      </Screen>
    );
  }

  return (
    <Screen>
      <Card>
        <Heading>Family rules</Heading>
        <Field label="Family name" value={name} onChangeText={setName} />
        <Field label="Points per chore" value={points} onChangeText={setPoints} keyboardType="number-pad" />
        <Field label="Missed chore penalty (points)" value={penalty} onChangeText={setPenalty} keyboardType="number-pad" />
        <Field label="Cost to skip a chore (% of its points)" value={skipPct} onChangeText={setSkipPct} keyboardType="number-pad" />
        <Field label="Skips allowed per kid each month" value={skips} onChangeText={setSkips} keyboardType="number-pad" />
        <Choice
          label="New chore week starts on"
          value={day}
          onChange={setDay}
          options={WEEKDAYS.map((d) => ({ value: d, label: d.slice(0, 3).replace(/^./, (c) => c.toUpperCase()) }))}
        />
        <ErrorText>{error}</ErrorText>
        {saved ? <Body muted>Saved ✓</Body> : null}
        <Button title="Save rules" onPress={saveRules} />
      </Card>

      <Card>
        <Heading>🏖️ Vacation mode</Heading>
        <Body muted>No chores are handed out and nothing counts as missed during a vacation.</Body>
        {vacations.map((v) => (
          <ListItem
            key={v.id}
            title={`${formatDay(v.startDate)} – ${formatDay(v.endDate)}`}
            right={
              <Button
                title="Cancel"
                kind="ghost"
                onPress={async () => {
                  await services.vacations.remove(v.id);
                  await refresh();
                  await loadVacations();
                }}
              />
            }
          />
        ))}
        <Choice
          label="Starts"
          value={vacStart}
          onChange={setVacStart}
          options={[
            { value: 'today', label: 'Today' },
            { value: 'tomorrow', label: 'Tomorrow' },
          ]}
        />
        <Field label="How many days" value={vacDays} onChangeText={(t) => setVacDays(t.replace(/\D/g, ''))} keyboardType="number-pad" maxLength={2} />
        <Button title="Add vacation" kind="secondary" onPress={addVacation} />
      </Card>

      <Card>
        <Heading>Security</Heading>
        <Button title="Change parent PIN" kind="secondary" onPress={() => setPinStep('new')} />
      </Card>

      <Button title="Erase everything and start over" kind="danger" onPress={resetAll} />
    </Screen>
  );
}
