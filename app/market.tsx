import { useFocusEffect } from 'expo-router';
import { useCallback, useState, type ReactNode } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { formatDay } from '@/src/lib/dates';
import { TIME_OF_DAY_LABELS } from '@/src/lib/presets';
import type { Chore, ChoreAssignment, MarketListing, User } from '@/src/models';
import { UserFacingError, type MarketOp, type MarketOverview } from '@/src/services';
import { pushRejectCost } from '@/src/services/MarketService';
import { useApp } from '@/src/state/AppContext';
import { useSync } from '@/src/state/SyncContext';
import { Avatar, Body, Button, Card, Choice, ErrorText, Field, Heading, Row, Screen } from '@/src/ui/components';
import { colors, font, radius, space } from '@/src/ui/theme';

type Sheet =
  | { kind: 'sell'; assignment: ChoreAssignment }
  | { kind: 'push'; assignment: ChoreAssignment }
  | { kind: 'send'; offer: MarketListing }
  | { kind: 'offer' };

interface Limits {
  sales: number;
  pushesToSend: number;
  pushesToReceive: number;
}

export default function Market() {
  const { family, members, chores, coins, services } = useApp();
  const { market, ownerId } = useSync();
  // A kid's own phone trades as that kid; the main device and shared tablets pick who's trading.
  const [pickedId, setPickedId] = useState<string>(members.find((m) => m.role === 'child')?.id ?? members[0]?.id ?? '');
  const actorId = ownerId ?? pickedId;
  const actor = members.find((m) => m.id === actorId);

  const [overview, setOverview] = useState<MarketOverview>({ open: [], assignments: {} });
  const [mine, setMine] = useState<ChoreAssignment[]>([]);
  const [limits, setLimits] = useState<Limits | null>(null);
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!family || !actorId) return;
    const [o, t, l] = await Promise.all([
      services.market.overview(family.id),
      services.market.tradeable(family.id, actorId),
      services.market.allowance(family.id, actorId),
    ]);
    setOverview(o);
    setMine(t);
    setLimits(l);
    // Reload whenever balances change (after any action or sync).
  }, [family, actorId, services, coins]); // eslint-disable-line react-hooks/exhaustive-deps

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (!family || !actor) return null;
  const s = family.settings;
  const choreById = new Map(chores.map((c) => [c.id, c]));
  const userById = new Map(members.map((m) => [m.id, m]));
  const assignmentOf = (l: MarketListing) => (l.assignmentId ? overview.assignments[l.assignmentId] : undefined);
  const choreOf = (a?: ChoreAssignment) => (a ? choreById.get(a.choreId) : undefined);
  const name = (id: string | null) => (id ? (userById.get(id)?.name ?? 'Someone') : 'Someone');

  const run = async (op: MarketOp, done?: string) => {
    setBusy(true);
    try {
      await market(actor.id, op);
      setSheet(null);
      if (done) Alert.alert(done);
    } catch (e) {
      Alert.alert('Can’t do that', e instanceof UserFacingError ? e.message : 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
      await load();
    }
  };

  const open = overview.open;
  const pushesToMe = open.filter((l) => l.kind === 'push' && l.toUserId === actor.id);
  const requestsToMe = open.filter((l) => l.kind === 'handoff' && l.toUserId === actor.id);
  const myRequests = open.filter((l) => l.kind === 'handoff' && l.fromUserId === actor.id);
  const sales = open.filter((l) => l.kind === 'sale');
  const offers = open.filter((l) => l.kind === 'offer');
  const myOffer = offers.find((l) => l.fromUserId === actor.id);

  return (
    <Screen>
      {ownerId ? null : (
        <Card>
          <Heading>Who’s trading?</Heading>
          <Choice value={pickedId} onChange={setPickedId} options={members.map((m) => ({ value: m.id, label: `${m.avatarEmoji} ${m.name}` }))} />
        </Card>
      )}

      <Card style={{ backgroundColor: '#E8F1FF', borderColor: '#B8D0F5' }}>
        <Row>
          <Avatar user={actor} size={44} />
          <View style={{ flex: 1 }}>
            <Text style={styles.wallet}>🪙 {coins[actor.id] ?? 0} coins</Text>
            {limits ? (
              <Text style={styles.muted}>
                {limits.sales} sale{limits.sales === 1 ? '' : 's'} and {limits.pushesToSend} push{limits.pushesToSend === 1 ? '' : 'es'} left this week
              </Text>
            ) : null}
          </View>
        </Row>
      </Card>

      {pushesToMe.length + requestsToMe.length > 0 ? (
        <Card style={{ borderColor: colors.warning, borderWidth: 2 }}>
          <Heading>Waiting on you</Heading>
          {pushesToMe.map((l) => {
            const a = assignmentOf(l);
            const c = choreOf(a);
            const cost = pushRejectCost(l.price);
            return (
              <Item key={l.id} icon={c?.icon ?? '📌'} title={`📌 ${name(l.fromUserId)} pushed “${c?.name ?? 'a chore'}” to you`} subtitle={when(a, c)}>
                <Button title={`Send back · ${cost} 🪙`} kind="danger" busy={busy} onPress={() => run({ op: 'answerPush', listingId: l.id, reject: true })} style={{ flex: 1 }} />
                <Button title="I’ll do it" kind="secondary" busy={busy} onPress={() => run({ op: 'answerPush', listingId: l.id, reject: false })} style={{ flex: 1 }} />
              </Item>
            );
          })}
          {requestsToMe.map((l) => {
            const a = assignmentOf(l);
            const c = choreOf(a);
            return (
              <Item key={l.id} icon={c?.icon ?? '🤝'} title={`🤝 ${name(l.fromUserId)} wants you to do “${c?.name ?? 'a chore'}”`} subtitle={`${when(a, c)} · you get ${l.price} + ${c?.coins ?? 0} 🪙 when done`}>
                <Button title="Accept" busy={busy} onPress={() => run({ op: 'answerHandoff', listingId: l.id, accept: true }, 'It’s yours. Do it to collect!')} style={{ flex: 1 }} />
                <Button title="Decline" kind="secondary" busy={busy} onPress={() => run({ op: 'answerHandoff', listingId: l.id, accept: false })} style={{ flex: 1 }} />
              </Item>
            );
          })}
        </Card>
      ) : null}

      <Card>
        <Heading>🏷️ For sale</Heading>
        {sales.length === 0 ? <Body muted>Nothing for sale right now.</Body> : null}
        {sales.map((l) => {
          const a = assignmentOf(l);
          const c = choreOf(a);
          const isMine = l.fromUserId === actor.id;
          return (
            <Item
              key={l.id}
              icon={c?.icon ?? '🏷️'}
              title={`${c?.name ?? 'Chore'} · ${isMine ? 'your sale' : `from ${name(l.fromUserId)}`}`}
              subtitle={`${when(a, c)} · pays ${l.price} + ${c?.coins ?? 0} 🪙 when done`}
            >
              {isMine ? (
                <Button
                  title={`Take down · costs ${Math.min(l.price, c?.coins ?? 0)} 🪙`}
                  kind="ghost"
                  busy={busy}
                  onPress={() => run({ op: 'cancelSale', listingId: l.id })}
                  style={{ flex: 1 }}
                />
              ) : (
                <Button title={`Buy · earn ${l.price + (c?.coins ?? 0)} 🪙`} busy={busy} onPress={() => run({ op: 'buy', listingId: l.id }, `“${c?.name}” is yours. Do it to collect!`)} style={{ flex: 1 }} />
              )}
            </Item>
          );
        })}
      </Card>

      <Card>
        <Heading>🙋 Buy offers</Heading>
        <Body muted>People who’ll do a chore for coins. Send them one of yours — it only moves if they accept.</Body>
        {offers.length === 0 ? <Body muted>No offers yet.</Body> : null}
        {offers.map((l) => {
          const poster = userById.get(l.fromUserId);
          const isMine = l.fromUserId === actor.id;
          return (
            <Item key={l.id} icon={poster?.avatarEmoji ?? '🙋'} title={`${isMine ? 'You' : (poster?.name ?? 'Someone')} will do a chore for ${l.price} 🪙`} subtitle="Until the week ends">
              {isMine ? (
                <Button title="Withdraw" kind="ghost" busy={busy} onPress={() => run({ op: 'withdrawOffer', listingId: l.id })} style={{ flex: 1 }} />
              ) : (
                <Button title="Send a chore" kind="secondary" disabled={mine.length === 0} onPress={() => setSheet({ kind: 'send', offer: l })} style={{ flex: 1 }} />
              )}
            </Item>
          );
        })}
        {myRequests.map((l) => {
          const c = choreOf(assignmentOf(l));
          return (
            <Item key={l.id} icon="⏳" title={`Waiting for ${name(l.toUserId)} to answer`} subtitle={`${c?.name ?? 'Chore'} · ${l.price} 🪙 held`}>
              <Button title="Cancel" kind="ghost" busy={busy} onPress={() => run({ op: 'cancelHandoff', listingId: l.id })} style={{ flex: 1 }} />
            </Item>
          );
        })}
        <Button title={myOffer ? 'Change my offer' : 'Post my own offer'} kind="secondary" onPress={() => setSheet({ kind: 'offer' })} />
      </Card>

      <Card>
        <Heading>📋 Your chores</Heading>
        <Body muted>Sell it, or push it onto someone. Moves close when the chore’s part of the day starts.</Body>
        {mine.length === 0 ? <Body muted>Nothing you can trade right now.</Body> : null}
        {mine.map((a) => {
          const c = choreById.get(a.choreId);
          return (
            <Item key={a.id} icon={c?.icon ?? '✨'} title={c?.name ?? 'Chore'} subtitle={`${when(a, c)} · pays ${c?.coins ?? 0} 🪙`}>
              <Button title="Sell" kind="secondary" onPress={() => setSheet({ kind: 'sell', assignment: a })} style={{ flex: 1 }} />
              <Button title="Push" kind="secondary" onPress={() => setSheet({ kind: 'push', assignment: a })} style={{ flex: 1 }} />
            </Item>
          );
        })}
      </Card>

      {/* Keyed per action: each sheet starts fresh, but keeps its choices while open, so a refused
          move ("Ava already has that chore that day") can be fixed without picking everything again. */}
      <ActionSheet
        key={sheet ? `${sheet.kind}:${'assignment' in sheet ? sheet.assignment.id : 'offer' in sheet ? sheet.offer.id : ''}` : 'closed'}
        sheet={sheet}
        actor={actor}
        members={members}
        mine={mine}
        choreById={choreById}
        minSell={s.minSellPrice}
        pushCost={s.pushCost}
        busy={busy}
        onClose={() => setSheet(null)}
        onRun={run}
      />
    </Screen>
  );
}

function when(a?: ChoreAssignment, c?: Chore): string {
  if (!a) return '';
  return `${formatDay(a.dueDate)}${c && c.timeOfDay !== 'any' ? ` · ${TIME_OF_DAY_LABELS[c.timeOfDay]}` : ''}`;
}

function Item({ icon, title, subtitle, children }: { icon: string; title: string; subtitle?: string; children?: ReactNode }) {
  return (
    <View style={styles.item}>
      <Row>
        <Text style={{ fontSize: 30 }}>{icon}</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.itemTitle}>{title}</Text>
          {subtitle ? <Text style={styles.muted}>{subtitle}</Text> : null}
        </View>
      </Row>
      {children ? <Row style={{ marginTop: space.sm }}>{children}</Row> : null}
    </View>
  );
}

function ActionSheet({
  sheet,
  actor,
  members,
  mine,
  choreById,
  minSell,
  pushCost,
  busy,
  onClose,
  onRun,
}: {
  sheet: Sheet | null;
  actor: User;
  members: User[];
  mine: ChoreAssignment[];
  choreById: Map<string, Chore>;
  minSell: number;
  pushCost: number;
  busy: boolean;
  onClose: () => void;
  onRun: (op: MarketOp, done?: string) => void;
}) {
  const [price, setPrice] = useState('');
  const [targetId, setTargetId] = useState('');
  const [error, setError] = useState<string | null>(null);

  const close = () => onClose();
  const amount = Number(price);

  let body: ReactNode = null;
  if (sheet?.kind === 'sell') {
    const c = choreById.get(sheet.assignment.choreId);
    body = (
      <>
        <Heading>Sell “{c?.name}”</Heading>
        <Body muted>
          You pay your price now. Whoever buys it gets your price plus the chore’s {c?.coins} 🪙 once they do it. If nobody buys, you get it back
          minus {c?.coins} 🪙 and still have to do it.
        </Body>
        <Field label={`Your price (at least ${minSell} 🪙)`} value={price} onChangeText={(t) => setPrice(t.replace(/\D/g, ''))} keyboardType="number-pad" maxLength={4} />
        <ErrorText>{error}</ErrorText>
        <Button
          title={price ? `Put it up for ${amount} 🪙` : 'Put it up for sale'}
          busy={busy}
          disabled={!price}
          onPress={() => {
            if (amount < minSell) return setError(`The lowest price is ${minSell} 🪙.`);
            onRun({ op: 'sell', assignmentId: sheet.assignment.id, price: amount }, 'It’s on the market!');
          }}
        />
      </>
    );
  } else if (sheet?.kind === 'push') {
    const c = choreById.get(sheet.assignment.choreId);
    const others = members.filter((m) => m.id !== actor.id);
    body = (
      <>
        <Heading>Push “{c?.name}”</Heading>
        <Body muted>
          Costs you {pushCost} 🪙 and nobody gets them. They can pay {pushRejectCost(pushCost)} 🪙 to send it back to you.
        </Body>
        <Choice value={targetId} onChange={setTargetId} options={others.map((m) => ({ value: m.id, label: `${m.avatarEmoji} ${m.name}` }))} />
        <Button
          title={targetId ? `Push to ${others.find((m) => m.id === targetId)?.name} · ${pushCost} 🪙` : 'Pick someone'}
          kind="danger"
          busy={busy}
          disabled={!targetId}
          onPress={() => {
            onRun({ op: 'push', assignmentId: sheet.assignment.id, targetId }, 'Pushed! 📌');
          }}
        />
      </>
    );
  } else if (sheet?.kind === 'send') {
    const helper = members.find((m) => m.id === sheet.offer.fromUserId);
    body = (
      <>
        <Heading>
          Send a chore to {helper?.name} for {sheet.offer.price} 🪙
        </Heading>
        <Body muted>Your coins are held. If {helper?.name} says no or doesn’t answer in time, you get them all back.</Body>
        {mine.map((a) => {
          const c = choreById.get(a.choreId);
          return (
            <Pressable
              key={a.id}
              accessibilityRole="button"
              onPress={() => onRun({ op: 'send', assignmentId: a.id, offerId: sheet.offer.id }, `Sent to ${helper?.name}. They’ll answer in the marketplace.`)}
              style={({ pressed }) => [styles.pick, pressed && { opacity: 0.7 }]}
            >
              <Text style={{ fontSize: 26 }}>{c?.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemTitle}>{c?.name}</Text>
                <Text style={styles.muted}>{when(a, c)}</Text>
              </View>
            </Pressable>
          );
        })}
      </>
    );
  } else if (sheet?.kind === 'offer') {
    body = (
      <>
        <Heading>Offer to do a chore</Heading>
        <Body muted>Say how many coins you’ll do a chore for. Others can send you one; you choose whether to accept. It replaces any offer you already have.</Body>
        <Field label="Coins per chore" value={price} onChangeText={(t) => setPrice(t.replace(/\D/g, ''))} keyboardType="number-pad" maxLength={4} />
        <Button
          title={price ? `Offer for ${amount} 🪙` : 'Post offer'}
          busy={busy}
          disabled={!price || amount < 1}
          onPress={() => {
            onRun({ op: 'offer', price: amount }, 'Your offer is up!');
          }}
        />
      </>
    );
  }

  return (
    <Modal visible={!!sheet} transparent animationType="slide" onRequestClose={close}>
      <Pressable style={styles.backdrop} onPress={close} accessibilityLabel="Close">
        <Pressable style={styles.sheet} onPress={() => undefined}>
          {body}
          <Button title="Cancel" kind="ghost" onPress={close} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  wallet: { fontSize: font.large, fontWeight: '900', color: '#1F5FBF' },
  muted: { color: colors.textMuted, fontSize: font.small, marginTop: 2 },
  item: { paddingVertical: space.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  itemTitle: { fontSize: font.body, fontWeight: '700', color: colors.text },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: space.lg,
    paddingBottom: space.xxl,
    gap: space.sm,
  },
  pick: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
