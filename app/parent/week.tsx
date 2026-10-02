import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Text } from 'react-native';
import { formatDay } from '@/src/lib/dates';
import type { ChoreAssignment } from '@/src/models';
import { UserFacingError } from '@/src/services';
import { useApp } from '@/src/state/AppContext';
import { Avatar, Body, Card, Heading, ListItem, Screen } from '@/src/ui/components';
import { colors } from '@/src/ui/theme';

const STATUS = {
  pending: { label: 'To do', color: colors.textMuted },
  completed: { label: 'Done ✓', color: colors.success },
  bought_out: { label: 'Skipped', color: colors.warning },
  missed: { label: 'Missed', color: colors.danger },
  excused: { label: 'Excused', color: colors.textMuted },
} as const;

export default function Week() {
  const { family, members, kids, chores, services, refresh } = useApp();
  const [items, setItems] = useState<ChoreAssignment[]>([]);

  const load = useCallback(async () => {
    if (!family?.currentPeriodStart) return;
    setItems(await services.deps.repos.assignments.findByPeriod(family.id, family.currentPeriodStart));
  }, [family, services]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (!family) return null;
  const today = services.deps.today();
  const choreById = new Map(chores.map((c) => [c.id, c]));
  const userById = new Map(members.map((m) => [m.id, m]));

  const act = async (fn: () => Promise<unknown>) => {
    try {
      await fn();
    } catch (e) {
      Alert.alert('Can’t do that', e instanceof UserFacingError ? e.message : 'Please try again.');
    }
    await refresh();
    await load();
  };

  const manage = (a: ChoreAssignment) => {
    const chore = choreById.get(a.choreId);
    const open = a.dueDate >= today;
    const buttons: { text: string; style?: 'cancel' | 'destructive'; onPress?: () => void }[] = [];
    if (a.status === 'pending' && open) {
      buttons.push({ text: 'Mark done', onPress: () => act(() => services.chores.complete(a.id)) });
      for (const k of kids.filter((k) => k.id !== a.userId)) {
        buttons.push({ text: `Give to ${k.name}`, onPress: () => act(() => services.chores.reassign(a.id, k.id)) });
      }
    }
    if ((a.status === 'completed' || a.status === 'bought_out') && open) {
      buttons.push({ text: 'Undo', onPress: () => act(() => services.chores.undo(a.id)) });
    }
    if (a.status !== 'excused' && a.status !== 'missed' && open) {
      buttons.push({ text: 'Excuse (sick day, etc.)', onPress: () => act(() => services.chores.excuse(a.id)) });
    }
    if (buttons.length === 0) {
      Alert.alert(chore?.name ?? 'Chore', 'This day is closed, so nothing can change.');
      return;
    }
    buttons.push({ text: 'Cancel', style: 'cancel' });
    Alert.alert(chore?.name ?? 'Chore', `${userById.get(a.userId)?.name ?? ''} · ${formatDay(a.dueDate)}`, buttons);
  };

  const days = [...new Set(items.map((a) => a.dueDate))].sort();
  return (
    <Screen>
      {items.length === 0 ? <Body muted>No chores this week yet.</Body> : null}
      {days.map((d) => (
        <Card key={d} style={d === today ? { borderColor: colors.primary, borderWidth: 2 } : undefined}>
          <Heading>
            {formatDay(d)}
            {d === today ? ' · today' : ''}
          </Heading>
          {items
            .filter((a) => a.dueDate === d)
            .map((a) => {
              const chore = choreById.get(a.choreId);
              const kid = userById.get(a.userId);
              const s = STATUS[a.status];
              return (
                <ListItem
                  key={a.id}
                  left={kid ? <Avatar user={kid} size={36} /> : undefined}
                  title={`${chore?.icon ?? ''} ${chore?.name ?? 'Removed chore'}`}
                  subtitle={kid?.name}
                  right={<Text style={{ color: s.color, fontWeight: '700' }}>{s.label}</Text>}
                  onPress={() => manage(a)}
                />
              );
            })}
        </Card>
      ))}
    </Screen>
  );
}
