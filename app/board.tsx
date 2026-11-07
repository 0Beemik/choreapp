import * as Haptics from 'expo-haptics';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
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
  const { family, members, kids: allKids, chores, board, balances, coins, services, refresh } = useApp();
  const { act, mode, link, ownerId } = useSync();
  // Someone's own phone shows just them; the main device and family tablets show every kid,
  // plus any parent who has chores today (e.g. Mow lawn → Dad).
  const kids =
    mode === 'member' && link?.userId
      ? members.filter((m) => m.id === link.userId)
      : [...allKids, ...members.filter((m) => m.role !== 'child' && (board?.byUser[m.id]?.length ?? 0) > 0)];
  const [celebration, setCelebration] = useState<CelebrationInfo | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [unseen, setUnseen] = useState(0);
  const [tags, setTags] = useState<Record<string, string>>({});
  // Wide screens (a tablet, or a phone turned sideways) show the family side by side.
  const { width } = useWindowDimensions();
  const columns = width >= 1200 ? 3 : width >= 760 ? 2 : 1;
  const cardWidth = columns > 1 ? (width - space.lg * 2 - space.md * (columns - 1)) / columns : undefined;

  // The bell counts what this device hasn't seen: its owner's, or the whole family's on a shared device.
  const viewerKey = (ownerId ? [ownerId] : members.map((m) => m.id)).join(',');
  useEffect(() => {
    let live = true;
    services.notifications
      .unseenCount(viewerKey.split(',').filter(Boolean))
      .then((n) => live && setUnseen(n))
      .catch(() => undefined);
    // Chores riding on the market get a tag, so nobody ticks off one they're selling by accident.
    if (family) {
      services.market
        .overview(family.id)
        .then(({ open }) => {
          const nameOf = (id: string | null) => members.find((m) => m.id === id)?.name ?? 'someone';
          const next: Record<string, string> = {};
          for (const l of open) {
            if (!l.assignmentId) continue;
            if (l.kind === 'sale') next[l.assignmentId] = '🏷️ For sale';
            else if (l.kind === 'handoff') next[l.assignmentId] = `⏳ Offered to ${nameOf(l.toUserId)}`;
            else if (l.kind === 'push') next[l.assignmentId] = `📌 Pushed by ${nameOf(l.fromUserId)}`;
          }
          if (live) setTags(next);
        })
        .catch(() => undefined);
    }
    return () => {
      live = false;
    };
  }, [services, viewerKey, board, coins, family, members]);

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
      setCelebration({ name: kid.name, points: result.pointsAwarded, coins: result.coinsAwarded, badges: result.newBadges });
    });

  const confirmUndo = (a: ChoreAssignment, chore: Chore) =>
    Alert.alert('Not done after all?', `Put “${chore.name}” back on the list? The points will be taken back.`, [
      { text: 'Keep it done', style: 'cancel' },
      { text: 'Undo', style: 'destructive', onPress: () => run(a.id, () => act('undo', a.id).then(() => undefined)) },
    ]);

  const offerSkip = async (a: ChoreAssignment, chore: Chore) => {
    const q = await services.chores.buyoutQuote(a.id);
    if (!q.allowed) {
      Alert.alert('Can’t skip this one', q.reason ?? 'Please try again.');
      return;
    }
    Alert.alert(
      `Use a skip on “${chore.name}”?`,
      `A get-out-of-jail card: no points, no coins, no penalty. You’ll have ${q.buyoutsLeftThisMonth - 1} skip${q.buyoutsLeftThisMonth - 1 === 1 ? '' : 's'} left this month.`,
      [
        { text: 'No, I’ll do it', style: 'cancel' },
        { text: 'Use a skip', onPress: () => run(a.id, () => act('skip', a.id).then(() => undefined)) },
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
        <Pressable accessibilityRole="button" accessibilityLabel="Marketplace" onPress={() => router.push('/market')} style={styles.iconBtn}>
          <Text style={styles.iconBtnText}>🏪</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={unseen > 0 ? `Notifications, ${unseen} new` : 'Notifications'}
          onPress={() => router.push('/notifications')}
          style={styles.iconBtn}
        >
          <Text style={styles.iconBtnText}>🔔</Text>
          {unseen > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unseen > 9 ? '9+' : unseen}</Text>
            </View>
          ) : null}
        </Pressable>
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

      <View style={columns > 1 ? styles.columns : styles.stack}>
        {kids.map((kid) => {
          const list = board.byUser[kid.id] ?? [];
          const little = kid.age <= LITTLE_KID_MAX_AGE;
          const left = list.filter((a) => a.status === 'pending').length;
          return (
            <Card key={kid.id} style={[{ borderTopWidth: 6, borderTopColor: kid.avatarColor }, cardWidth ? { width: cardWidth } : null]}>
              <Pressable accessibilityRole="button" accessibilityLabel={`${kid.name}'s profile`} onPress={() => router.push(`/kid/${kid.id}`)}>
                <Row>
                  <Avatar user={kid} size={little ? 64 : 52} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.kidName, little && { fontSize: font.title }]}>{kid.name}</Text>
                    <Text style={styles.kidSub}>
                      {list.length === 0 ? 'No chores today' : left === 0 ? 'All done! 🎉' : `${left} to go`}
                    </Text>
                  </View>
                  <View style={{ gap: space.xs, alignItems: 'flex-end' }}>
                    <View style={styles.points}>
                      <Text style={styles.pointsText} accessibilityLabel={`${balances[kid.id] ?? 0} points`}>⭐ {balances[kid.id] ?? 0}</Text>
                    </View>
                    <View style={styles.coins}>
                      <Text style={styles.coinsText} accessibilityLabel={`${coins[kid.id] ?? 0} coins`}>🪙 {coins[kid.id] ?? 0}</Text>
                    </View>
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
                        tag={tags[a.id]}
                      />
                    </View>
                  );
                })}
              </View>
            </Card>
          );
        })}
      </View>

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
  tag,
}: {
  assignment: ChoreAssignment;
  chore: Chore;
  points: number;
  little: boolean;
  busy: boolean;
  onComplete: () => void;
  onUndo: () => void;
  onSkip?: () => void;
  /** Market status, e.g. "🏷️ For sale". */
  tag?: string;
}) {
  const done = assignment.status === 'completed';
  const skipped = assignment.status === 'bought_out';
  const pending = assignment.status === 'pending';
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: done, disabled: busy }}
      accessibilityLabel={`${chore.name}, ${done ? 'done' : skipped ? 'skipped' : `${points} points, ${chore.coins} coins`}`}
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
          {done
            ? `+${assignment.pointsAwarded} pts · +${chore.coins} 🪙`
            : skipped
              ? 'Skipped'
              : `${points} pts · ${chore.coins} 🪙${chore.frequency === 'weekly' ? ' · this week' : ''}`}
        </Text>
        {tag && pending ? <Text style={styles.tag}>{tag}</Text> : null}
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
  stack: { gap: space.md },
  columns: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md, alignItems: 'flex-start' },
  week: { color: colors.textMuted, fontSize: font.small, marginTop: 2 },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnText: { fontSize: 20 },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 4,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '900' },
  kidName: { fontSize: font.large, fontWeight: '800', color: colors.text },
  kidSub: { color: colors.textMuted, fontSize: font.small },
  slot: { color: colors.textMuted, fontSize: font.small, fontWeight: '800', textTransform: 'uppercase', marginTop: space.xs },
  points: { backgroundColor: '#FFF4CC', borderRadius: radius.pill, paddingHorizontal: space.md, paddingVertical: space.xs },
  pointsText: { fontWeight: '800', color: '#8A6500', fontSize: font.body },
  coins: { backgroundColor: '#E8F1FF', borderRadius: radius.pill, paddingHorizontal: space.md, paddingVertical: space.xs },
  coinsText: { fontWeight: '800', color: '#1F5FBF', fontSize: font.body },
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
  tag: { color: '#1F5FBF', fontSize: font.small, fontWeight: '800', marginTop: 2 },
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
