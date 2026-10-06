import * as Haptics from 'expo-haptics';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { AdBanner } from '@/src/ads/AdBanner';
import { formatDay } from '@/src/lib/dates';
import { TIME_OF_DAY_LABELS } from '@/src/lib/presets';
import type { Chore, ChoreAssignment, User } from '@/src/models';
import { UserFacingError } from '@/src/services';
import { chorePoints } from '@/src/services/ChoreService';
import { useApp } from '@/src/state/AppContext';
import { useSync } from '@/src/state/SyncContext';
import { SyncBar } from '@/src/ui/SyncBar';
import { Celebration, type CelebrationInfo } from '@/src/ui/Celebration';
import { Avatar, Body, Button, Card, Row, Screen } from '@/src/ui/components';
import { colors, font, LITTLE_KID_MAX_AGE, radius, space } from '@/src/ui/theme';

export default function BoardScreen() {
  const { family, members, kids: allKids, chores, board, balances, services, refresh } = useApp();
  const { act, mode, link } = useSync();
  // Someone's own phone shows just them; the main device and family tablets show every kid,
  // plus any parent who has chores today (e.g. Mow lawn → Dad).
  const kids =
    mode === 'member' && link?.userId
      ? members.filter((m) => m.id === link.userId)
      : [...allKids, ...members.filter((m) => m.role !== 'child' && (board?.byUser[m.id]?.length ?? 0) > 0)];
  const [celebration, setCelebration] = useState<CelebrationInfo | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      refresh().catch(() => undefined);
    }, [refresh]),
  );

  if (!family || !board) return null;
  const choreById = new Map(chores.map((c) => [c.id, c]));

  const run = async (id: string, action: () => Promise<void>) => {
    setBusyId(id);
    try {
      await action();
    } catch (e) {
      Alert.alert('Hmm', e instanceof UserFacingError ? e.message : 'Something went wrong. Please try again.');
      await refresh();
    } finally {
      setBusyId(null);
    }
  };

  const complete = (kid: User, a: ChoreAssignment) =>
    run(a.id, async () => {
      const result = await act('complete', a.id);
      if (!result) return;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
      setCelebration({ name: kid.name, points: result.pointsAwarded, badges: result.newBadges });
    });

  const confirmUndo = (a: ChoreAssignment, chore: Chore) =>
    Alert.alert('Not done after all?', `Put “${chore.name}” back on the list? The points will be taken back.`, [
      { text: 'Keep it done', style: 'cancel' },
      { text: 'Undo', style: 'destructive', onPress: () => run(a.id, () => act('undo', a.id).then(() => undefined)) },
    ]);

  const offerSkip = async (a: ChoreAssignment, chore: Chore) => {
    const q = await services.chores.buyoutQuote(a.id);
    if (!q.allowed) {
      Alert.alert('Can’t skip this one', `${q.reason}\nYou have ${q.balance} points and ${q.buyoutsLeftThisMonth} skips left this month.`);
      return;
    }
    Alert.alert(
      `Skip “${chore.name}”?`,
      `It costs ${q.cost} points. You’ll have ${q.balance - q.cost} left and ${q.buyoutsLeftThisMonth - 1} skips left this month.`,
      [
        { text: 'No, I’ll do it', style: 'cancel' },
        { text: `Spend ${q.cost} points`, onPress: () => run(a.id, () => act('skip', a.id).then(() => undefined)) },
      ],
    );
  };

  return (
    <Screen edges={['top', 'bottom']} footer={<AdBanner />}>
      <Row style={{ justifyContent: 'space-between' }}>
        <View style={{ flex: 1 }}>
          <Text style={styles.family}>{family.name}</Text>
          <Text style={styles.week}>
            {formatDay(board.today)} · week ends {formatDay(board.periodEnd)}
          </Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Leaderboard" onPress={() => router.push('/leaderboard')} style={styles.iconBtn}>
          <Text style={styles.iconBtnText}>🏆</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={mode === 'member' ? 'Device settings' : 'Parent area'}
          onPress={() => router.push('/parent')}
          style={styles.iconBtn}
        >
          <Text style={styles.iconBtnText}>{mode === 'member' ? '⚙️' : '🔒'}</Text>
        </Pressable>
      </Row>

      <SyncBar />

      {board.vacation ? (
        <Card style={{ backgroundColor: colors.successSoft, borderColor: colors.success }}>
          <Body>🏖️ Vacation mode until {formatDay(board.vacation.endDate)}. No chores, no penalties. Enjoy!</Body>
        </Card>
      ) : null}

      {kids.map((kid) => {
        const list = board.byUser[kid.id] ?? [];
        const little = kid.age <= LITTLE_KID_MAX_AGE;
        const left = list.filter((a) => a.status === 'pending').length;
        return (
          <Card key={kid.id} style={{ borderTopWidth: 6, borderTopColor: kid.avatarColor }}>
            <Pressable accessibilityRole="button" accessibilityLabel={`${kid.name}'s profile`} onPress={() => router.push(`/kid/${kid.id}`)}>
              <Row>
                <Avatar user={kid} size={little ? 64 : 52} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.kidName, little && { fontSize: font.title }]}>{kid.name}</Text>
                  <Text style={styles.kidSub}>
                    {list.length === 0 ? 'No chores today' : left === 0 ? 'All done! 🎉' : `${left} to go`}
                  </Text>
                </View>
                <View style={styles.points}>
                  <Text style={styles.pointsText}>⭐ {balances[kid.id] ?? 0}</Text>
                </View>
              </Row>
            </Pressable>

            <View style={{ gap: space.sm, marginTop: space.md }}>
              {list.map((a, i) => {
                const chore = choreById.get(a.choreId);
                if (!chore) return null;
                // The list arrives sorted by part of the day; label each group, but skip the
                // labels when everything is all-day.
                const prev = i > 0 ? choreById.get(list[i - 1].choreId) : undefined;
                const split = list.some((x) => choreById.get(x.choreId)?.timeOfDay !== 'any');
                const showHeader = split && prev?.timeOfDay !== chore.timeOfDay;
                return (
                  <View key={a.id} style={{ gap: space.sm }}>
                    {showHeader ? (
                      <Text style={[styles.slot, little && { fontSize: font.body }]}>
                        {SLOT_ICONS[chore.timeOfDay]} {TIME_OF_DAY_LABELS[chore.timeOfDay]}
                      </Text>
                    ) : null}
                    <ChoreRow
                      assignment={a}
                      chore={chore}
                      points={chorePoints(chore, family)}
                      little={little}
                      busy={busyId === a.id}
                      onComplete={() => complete(kid, a)}
                      onUndo={() => confirmUndo(a, chore)}
                      onSkip={little ? undefined : () => offerSkip(a, chore)}
                    />
                  </View>
                );
              })}
            </View>
          </Card>
        );
      })}

      {kids.length === 0 ? (
        <Card>
          <Body>No kids yet. A parent can add them from the 🔒 parent area.</Body>
        </Card>
      ) : null}
      {chores.length === 0 && kids.length > 0 ? (
        <Card>
          <Body>No chores yet. Tap 🔒 to add some.</Body>
          <Button title="Add chores" kind="secondary" onPress={() => router.push('/parent')} style={{ marginTop: space.md }} />
        </Card>
      ) : null}

      <Celebration info={celebration} onDone={() => setCelebration(null)} />
    </Screen>
  );
}

const SLOT_ICONS = { morning: '🌅', afternoon: '☀️', evening: '🌙', any: '🕑' } as const;

function ChoreRow({
  assignment,
  chore,
  points,
  little,
  busy,
  onComplete,
  onUndo,
  onSkip,
}: {
  assignment: ChoreAssignment;
  chore: Chore;
  points: number;
  little: boolean;
  busy: boolean;
  onComplete: () => void;
  onUndo: () => void;
  onSkip?: () => void;
}) {
  const done = assignment.status === 'completed';
  const skipped = assignment.status === 'bought_out';
  const pending = assignment.status === 'pending';
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: done, disabled: busy }}
      accessibilityLabel={`${chore.name}, ${done ? 'done' : skipped ? 'skipped' : `${points} points`}`}
      disabled={busy}
      onPress={pending ? onComplete : onUndo}
      style={({ pressed }) => [
        styles.chore,
        little && styles.choreLittle,
        done && styles.choreDone,
        skipped && styles.choreSkipped,
        pressed && { opacity: 0.75 },
      ]}
    >
      <Text style={{ fontSize: little ? 44 : 30 }}>{chore.icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={[styles.choreName, little && { fontSize: font.large }, !pending && styles.choreNameDone]}>{chore.name}</Text>
        <Text style={styles.choreMeta}>
          {done ? `+${assignment.pointsAwarded} earned` : skipped ? 'Skipped' : `${points} pts${chore.frequency === 'weekly' ? ' · this week' : ''}`}
        </Text>
      </View>
      {pending && onSkip ? (
        <Pressable accessibilityRole="button" accessibilityLabel={`Skip ${chore.name}`} onPress={onSkip} hitSlop={8} style={styles.skip}>
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      ) : null}
      <View style={[styles.check, little && styles.checkLittle, done && styles.checkDone]}>
        <Text style={[styles.checkMark, little && { fontSize: 28 }]}>{done ? '✓' : skipped ? '–' : ''}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  family: { fontSize: font.title, fontWeight: '900', color: colors.text },
  week: { color: colors.textMuted, fontSize: font.small, marginTop: 2 },
  iconBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnText: { fontSize: 22 },
  kidName: { fontSize: font.large, fontWeight: '800', color: colors.text },
  kidSub: { color: colors.textMuted, fontSize: font.small },
  slot: { color: colors.textMuted, fontSize: font.small, fontWeight: '800', textTransform: 'uppercase', marginTop: space.xs },
  points: { backgroundColor: '#FFF4CC', borderRadius: radius.pill, paddingHorizontal: space.md, paddingVertical: space.xs },
  pointsText: { fontWeight: '800', color: '#8A6500', fontSize: font.body },
  chore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    minHeight: 64,
  },
  choreLittle: { minHeight: 88, padding: space.lg },
  choreDone: { backgroundColor: colors.successSoft },
  choreSkipped: { backgroundColor: '#EFEFF3' },
  choreName: { fontSize: font.body, fontWeight: '700', color: colors.text },
  choreNameDone: { color: colors.textMuted, textDecorationLine: 'line-through' },
  choreMeta: { color: colors.textMuted, fontSize: font.small, marginTop: 2 },
  skip: { paddingHorizontal: space.md, paddingVertical: space.xs, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.warning },
  skipText: { color: colors.warning, fontWeight: '700', fontSize: font.small },
  check: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 3,
    borderColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  checkLittle: { width: 52, height: 52, borderRadius: 26 },
  checkDone: { backgroundColor: colors.success },
  checkMark: { color: '#fff', fontWeight: '900', fontSize: 20 },
});
