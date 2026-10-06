import { router } from 'expo-router';
import { Text } from 'react-native';
import { TIME_OF_DAY_LABELS } from '@/src/lib/presets';
import { chorePoints } from '@/src/services/ChoreService';
import { useApp } from '@/src/state/AppContext';
import { Body, Button, Card, ListItem, Screen } from '@/src/ui/components';
import { colors, font } from '@/src/ui/theme';

export default function Chores() {
  const { family, chores, members } = useApp();
  if (!family) return null;
  const whoDoesIt = (ids: string[]) => {
    if (ids.length === 0) return 'Rotates weekly';
    const names = members.filter((m) => ids.includes(m.id)).map((m) => m.name);
    if (names.length === 0) return '—';
    return names.length === 1 ? `Always ${names[0]}` : `Each does their own: ${names.join(', ')}`;
  };
  return (
    <Screen>
      <Button title="Add a chore" onPress={() => router.push('/parent/chore')} />
      {chores.length === 0 ? <Body muted>No chores yet.</Body> : null}
      {chores.length > 0 ? (
        <Card>
          {chores.map((c) => (
            <ListItem
              key={c.id}
              left={<Text style={{ fontSize: 28 }}>{c.icon}</Text>}
              title={c.name}
              subtitle={[
                c.frequency === 'daily' ? 'Every day' : 'Once a week',
                ...(c.timeOfDay !== 'any' ? [TIME_OF_DAY_LABELS[c.timeOfDay]] : []),
                `${chorePoints(c, family)} pts`,
                whoDoesIt(c.assigneeIds),
              ].join(' · ')}
              right={<Text style={{ color: colors.textMuted, fontSize: font.large }}>›</Text>}
              onPress={() => router.push({ pathname: '/parent/chore', params: { id: c.id } })}
            />
          ))}
        </Card>
      ) : null}
    </Screen>
  );
}
