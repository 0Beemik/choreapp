import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';
import { CHORE_ICONS } from '@/src/lib/presets';
import type { ChoreFrequency } from '@/src/models';
import { UserFacingError } from '@/src/services';
import { useApp } from '@/src/state/AppContext';
import { Button, Card, Choice, EmojiPicker, ErrorText, Field, Screen } from '@/src/ui/components';

export default function ChoreEditor() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { family, chores, kids, services, refresh } = useApp();
  const existing = chores.find((c) => c.id === id);

  const [name, setName] = useState(existing?.name ?? '');
  const [icon, setIcon] = useState(existing?.icon ?? CHORE_ICONS[0]);
  const [frequency, setFrequency] = useState<ChoreFrequency>(existing?.frequency ?? 'weekly');
  const [points, setPoints] = useState(existing?.points != null ? String(existing.points) : '');
  const [who, setWho] = useState<string>(existing?.fixedUserId ?? 'rotate');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!family) return null;

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      const p = points.trim() ? Number(points) : null;
      if (p !== null && (!Number.isInteger(p) || p < 1 || p > 1000)) throw new UserFacingError('Points must be 1–1000.');
      const input = { name, icon, frequency, points: p, fixedUserId: who === 'rotate' ? null : who };
      if (existing) await services.chores.update(existing.id, input);
      else await services.chores.add(family.id, input);
      await refresh();
      router.back();
    } catch (e) {
      setError(e instanceof UserFacingError ? e.message : 'Could not save. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const remove = () => {
    if (!existing) return;
    Alert.alert(`Delete “${existing.name}”?`, 'It disappears from the board. Points already earned stay.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await services.chores.remove(existing.id);
          await refresh();
          router.back();
        },
      },
    ]);
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: existing ? 'Edit chore' : 'New chore' }} />
      <Card>
        <Field label="Chore" value={name} onChangeText={setName} placeholder="Unload the dishwasher" />
        <EmojiPicker label="Picture" options={CHORE_ICONS} value={icon} onChange={setIcon} />
        <Choice
          label="How often"
          value={frequency}
          onChange={setFrequency}
          options={[
            { value: 'daily', label: 'Every day' },
            { value: 'weekly', label: 'Once a week' },
          ]}
        />
        <Choice
          label="Who does it"
          value={who}
          onChange={setWho}
          options={[{ value: 'rotate', label: '🔄 Rotate weekly' }, ...kids.map((k) => ({ value: k.id, label: `${k.avatarEmoji} ${k.name}` }))]}
        />
        <Field
          label={`Points (blank = family default, ${family.settings.pointsPerChore})`}
          value={points}
          onChangeText={(t) => setPoints(t.replace(/\D/g, ''))}
          keyboardType="number-pad"
          placeholder={String(family.settings.pointsPerChore)}
          maxLength={4}
        />
        <ErrorText>{error}</ErrorText>
        <Button title="Save" onPress={save} busy={busy} />
      </Card>
      {existing ? <Button title="Delete chore" kind="danger" onPress={remove} /> : null}
    </Screen>
  );
}
