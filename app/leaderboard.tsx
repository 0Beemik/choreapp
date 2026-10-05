import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AdBanner } from '@/src/ads/AdBanner';
import type { LeaderboardRow } from '@/src/models';
import type { LeaderboardRange } from '@/src/services';
import { useApp } from '@/src/state/AppContext';
import { Avatar, Body, Card, Choice, Row, Screen } from '@/src/ui/components';
import { colors, font, space } from '@/src/ui/theme';

const MEDALS = ['🥇', '🥈', '🥉'];

export default function Leaderboard() {
  const { family, services } = useApp();
  const [range, setRange] = useState<LeaderboardRange>('week');
  const [rows, setRows] = useState<LeaderboardRow[]>([]);

  useFocusEffect(
    useCallback(() => {
      if (!family) return;
      let live = true;
      services.points.leaderboard(family.id, range).then((r) => live && setRows(r));
      return () => {
        live = false;
      };
    }, [family, services, range]),
  );

  return (
    <Screen footer={<AdBanner />}>
      <Choice
        value={range}
        onChange={setRange}
        options={[
          { value: 'week', label: 'This week' },
          { value: 'month', label: 'This month' },
          { value: 'all', label: 'All time' },
        ]}
      />
      {rows.map((r) => (
        <Card key={r.user.id} style={r.rank === 1 && r.points > 0 ? styles.leader : undefined}>
          <Row>
            <Text style={styles.rank}>{r.points > 0 ? (MEDALS[r.rank - 1] ?? `#${r.rank}`) : '·'}</Text>
            <Avatar user={r.user} size={52} />
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{r.user.name}</Text>
              <Text style={styles.sub}>
                {r.completed} chore{r.completed === 1 ? '' : 's'} done
              </Text>
            </View>
            <Text style={styles.points}>{r.points}</Text>
          </Row>
        </Card>
      ))}
      {rows.every((r) => r.points === 0) ? <Body muted center>No points yet {range === 'week' ? 'this week' : ''}. First chore wins the crown! 👑</Body> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  leader: { borderColor: colors.gold, borderWidth: 3 },
  rank: { fontSize: 30, width: 44, textAlign: 'center', color: colors.textMuted },
  name: { fontSize: font.large, fontWeight: '800', color: colors.text },
  sub: { color: colors.textMuted },
  points: { fontSize: font.title, fontWeight: '900', color: colors.primary, marginLeft: space.sm },
});
