import { router } from 'expo-router';
import { Text } from 'react-native';
import { chorePoints } from '@/src/services/ChoreService';
import { useApp } from '@/src/state/AppContext';
import { Body, Button, Card, ListItem, Screen } from '@/src/ui/components';
import { colors, font } from '@/src/ui/theme';

export default function Chores() {
  const { family, chores, members } = useApp();
  if (!family) return null;
  const nameOf = (id: string | null) => members.find((m) => m.id === id)?.name;
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
                `${chorePoints(c, family)} pts`,
                c.fixedUserId ? `Always ${nameOf(c.fixedUserId) ?? '—'}` : 'Rotates weekly',
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
