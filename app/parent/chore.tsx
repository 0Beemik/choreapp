import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';
import { DEFAULT_CHORE_ICON } from '@/src/lib/choreIcons';
import { TIME_OF_DAY_LABELS } from '@/src/lib/presets';
import { TIMES_OF_DAY, type ChoreFrequency, type TimeOfDay } from '@/src/models';
import { UserFacingError } from '@/src/services';
import { useApp } from '@/src/state/AppContext';
import { ChoreIconPicker } from '@/src/ui/ChoreIconPicker';
import { Button, Card, Choice, ErrorText, Field, MultiChoice, Screen } from '@/src/ui/components';

export default function ChoreEditor() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { family, chores, members, services, refresh } = useApp();
  const existing = chores.find((c) => c.id === id);

  const [name, setName] = useState(existing?.name ?? '');
  const [icon, setIcon] = useState(existing?.icon ?? DEFAULT_CHORE_ICON);
  const [frequency, setFrequency] = useState<ChoreFrequency>(existing?.frequency ?? 'weekly');
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>(existing?.timeOfDay ?? 'any');
  const [points, setPoints] = useState(existing?.points != null ? String(existing.points) : '');
  // Empty = rotate weekly; otherwise every picked kid does their own copy.
  const [assigneeIds, setAssigneeIds] = useState<string[]>(existing?.assigneeIds ?? []);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!family) return null;

  const toggleWho = (v: string) => {
    if (v === 'rotate') setAssigneeIds([]);
    else setAssigneeIds((ids) => (ids.includes(v) ? ids.filter((id) => id !== v) : [...ids, v]));
  };

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      const p = points.trim() ? Number(points) : null;
      if (p !== null && (!Number.isInteger(p) || p < 1 || p > 1000)) throw new UserFacingError('Points must be 1–1000.');
      const input = { name, icon, frequency, points: p, assigneeIds, timeOfDay };
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
        <ChoreIconPicker value={icon} onChange={setIcon} />
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
          label="When"
          value={timeOfDay}
          onChange={setTimeOfDay}
          options={(['any', ...TIMES_OF_DAY.filter((t) => t !== 'any')] as TimeOfDay[]).map((t) => ({ value: t, label: TIME_OF_DAY_LABELS[t] }))}
        />
        <MultiChoice
          label="Who does it"
          hint="(pick as many people as needed)"
          values={assigneeIds.length > 0 ? assigneeIds : ['rotate']}
          onToggle={toggleWho}
          options={[
            { value: 'rotate', label: '🔄 Rotate weekly (kids)' },
            // Kids first, then parents (e.g. Mow lawn → Dad).
            ...[...members].sort((a, b) => Number(a.role !== 'child') - Number(b.role !== 'child')).map((m) => ({ value: m.id, label: `${m.avatarEmoji} ${m.name}` })),
          ]}
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
