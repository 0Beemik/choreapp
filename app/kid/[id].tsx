import { Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AdBanner } from '@/src/ads/AdBanner';
import { currentStreak } from '@/src/services/BadgeService';
import type { Badge, PointTransaction } from '@/src/models';
import type { AllowanceSummary } from '@/src/services';
import { useApp } from '@/src/state/AppContext';
import { Avatar, Body, Card, Heading, Row, Screen } from '@/src/ui/components';
import { colors, font, radius, space } from '@/src/ui/theme';

interface Profile {
  badges: Badge[];
  earned: Set<string>;
  history: PointTransaction[];
  allowance: AllowanceSummary;
  streak: number;
}

export default function KidProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { family, members, balances, services } = useApp();
  const kid = members.find((m) => m.id === id);
  const [profile, setProfile] = useState<Profile | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!family || !kid) return;
      let live = true;
      (async () => {
        const [badges, earned, history, allowance, days] = await Promise.all([
          services.badges.all(),
          services.badges.earned(kid.id),
          services.points.history(kid.id),
          services.points.allowance(family.id, kid.id),
          services.deps.repos.assignments.completionDays(kid.id),
        ]);
        if (live) {
          setProfile({
            badges,
            earned: new Set(earned.map((e) => e.badgeId)),
            history,
            allowance,
            streak: currentStreak(days, services.deps.today()),
          });
        }
      })();
      return () => {
        live = false;
      };
    }, [family, kid, services]),
  );

  if (!kid) return null;
  return (
    <Screen footer={<AdBanner />}>
      <Stack.Screen options={{ title: kid.name }} />
      <Row>
        <Avatar user={kid} size={80} />
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{kid.name}</Text>
          <Text style={styles.big}>⭐ {balances[kid.id] ?? 0} points</Text>
          {profile && profile.streak > 1 ? <Text style={styles.streak}>🔥 {profile.streak}-day streak</Text> : null}
        </View>
      </Row>

      {profile ? (
        <>
          <Card>
            <Heading>This week</Heading>
            <Body>
              {profile.allowance.done} of {profile.allowance.total} chores done
            </Body>
            <View style={styles.bar}>
              <View
                style={[
                  styles.barFill,
                  { width: `${profile.allowance.total ? (100 * profile.allowance.done) / profile.allowance.total : 0}%` },
                ]}
              />
            </View>
            {kid.allowanceRate > 0 ? (
              <Body muted>
                Allowance so far: ${profile.allowance.amount.toFixed(2)} of ${kid.allowanceRate.toFixed(2)}
              </Body>
            ) : null}
          </Card>

          <Card>
            <Heading>
              Badges ({profile.earned.size}/{profile.badges.length})
            </Heading>
            <View style={styles.badgeGrid}>
              {profile.badges.map((b) => {
                const has = profile.earned.has(b.id);
                return (
                  <View key={b.id} style={[styles.badge, !has && { opacity: 0.35 }]} accessibilityLabel={`${b.name}${has ? '' : ', locked'}: ${b.description}`}>
                    <Text style={{ fontSize: 34 }}>{has ? b.icon : '🔒'}</Text>
                    <Text style={styles.badgeName} numberOfLines={2}>
                      {b.name}
                    </Text>
                    <Text style={styles.badgeDesc} numberOfLines={3}>
                      {b.description}
                    </Text>
                  </View>
                );
              })}
            </View>
          </Card>

          <Card>
            <Heading>Recent points</Heading>
            {profile.history.length === 0 ? <Body muted>Nothing yet. Go do a chore!</Body> : null}
            {profile.history.slice(0, 15).map((t) => (
              <Row key={t.id} style={styles.historyRow}>
                <Text style={{ flex: 1, color: colors.text }}>{t.reason}</Text>
                <Text style={{ fontWeight: '800', color: t.amount >= 0 ? colors.success : colors.danger }}>
                  {t.amount >= 0 ? '+' : ''}
                  {t.amount}
                </Text>
              </Row>
            ))}
          </Card>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  name: { fontSize: font.title, fontWeight: '900', color: colors.text },
  big: { fontSize: font.large, fontWeight: '800', color: '#8A6500' },
  streak: { color: colors.warning, fontWeight: '700', marginTop: 2 },
  bar: { height: 14, borderRadius: 7, backgroundColor: colors.surfaceAlt, overflow: 'hidden', marginVertical: space.sm },
  barFill: { height: '100%', backgroundColor: colors.success },
  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  badge: {
    width: '31%',
    alignItems: 'center',
    padding: space.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
  },
  badgeName: { fontWeight: '800', color: colors.text, textAlign: 'center', fontSize: font.small },
  badgeDesc: { color: colors.textMuted, textAlign: 'center', fontSize: 11 },
  historyRow: { paddingVertical: space.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
});
