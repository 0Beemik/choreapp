import { router } from 'expo-router';
import { Text } from 'react-native';
import { useApp } from '@/src/state/AppContext';
import { Avatar, Button, Card, ListItem, Screen } from '@/src/ui/components';
import { colors, font } from '@/src/ui/theme';

export default function Members() {
  const { members } = useApp();
  return (
    <Screen>
      <Card>
        {members.map((m) => (
          <ListItem
            key={m.id}
            left={<Avatar user={m} size={44} />}
            title={m.name}
            subtitle={
              m.role === 'parent'
                ? 'Parent'
                : `Age ${m.age}${m.allowanceRate > 0 ? ` · $${m.allowanceRate.toFixed(2)}/week allowance` : ''}`
            }
            right={<Text style={{ color: colors.textMuted, fontSize: font.large }}>›</Text>}
            onPress={() => router.push({ pathname: '/parent/member', params: { id: m.id } })}
          />
        ))}
      </Card>
      <Button title="Add a kid" onPress={() => router.push({ pathname: '/parent/member', params: { role: 'child' } })} />
      <Button title="Add a parent" kind="secondary" onPress={() => router.push({ pathname: '/parent/member', params: { role: 'parent' } })} />
    </Screen>
  );
}
