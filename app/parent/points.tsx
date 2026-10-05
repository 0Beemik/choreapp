import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Text } from 'react-native';
import type { PointTransaction } from '@/src/models';
import { UserFacingError, type AllowanceSummary } from '@/src/services';
import { useApp } from '@/src/state/AppContext';
import { Avatar, Body, Button, Card, Choice, Field, Heading, ListItem, Row, Screen } from '@/src/ui/components';
import { colors } from '@/src/ui/theme';

export default function Points() {
  const { family, kids, balances, services, refresh } = useApp();
  const [kidId, setKidId] = useState(kids[0]?.id ?? '');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [history, setHistory] = useState<PointTransaction[]>([]);
  const [allowances, setAllowances] = useState<Record<string, AllowanceSummary>>({});

  const load = useCallback(async () => {
    if (!family) return;
    const entries = await Promise.all(kids.map(async (k) => [k.id, await services.points.allowance(family.id, k.id)] as const));
    setAllowances(Object.fromEntries(entries));
    if (kidId) setHistory(await services.points.history(kidId));
  }, [family, kids, kidId, services]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (!family) return null;
  const kid = kids.find((k) => k.id === kidId);

  const apply = async (sign: 1 | -1) => {
    try {
      await services.points.adjust(family.id, kidId, sign * Number(amount), reason);
      setAmount('');
      setReason('');
      await refresh();
      await load();
    } catch (e) {
      Alert.alert('Can’t adjust', e instanceof UserFacingError ? e.message : 'Please try again.');
    }
  };

  return (
    <Screen>
      <Card>
        <Heading>This week’s allowance</Heading>
        {kids.map((k) => {
          const a = allowances[k.id];
          return (
            <ListItem
              key={k.id}
              left={<Avatar user={k} size={36} />}
              title={k.name}
              subtitle={a ? `${a.done}/${a.total} chores done` : ''}
              right={
                <Text style={{ fontWeight: '800', color: colors.text }}>
                  {k.allowanceRate > 0 ? `$${(a?.amount ?? 0).toFixed(2)}` : `⭐ ${balances[k.id] ?? 0}`}
                </Text>
              }
            />
          );
        })}
        <Body muted>Set a weekly allowance per kid under Family. Pay is in proportion to chores done.</Body>
      </Card>

      {kid ? (
        <Card>
          <Heading>Give or take points</Heading>
          <Choice value={kidId} onChange={setKidId} options={kids.map((k) => ({ value: k.id, label: `${k.avatarEmoji} ${k.name}` }))} />
          <Body>
            {kid.name} has ⭐ {balances[kid.id] ?? 0}
          </Body>
          <Field label="Points" value={amount} onChangeText={(t) => setAmount(t.replace(/\D/g, ''))} keyboardType="number-pad" maxLength={4} />
          <Field label="Reason" value={reason} onChangeText={setReason} placeholder="Helped with groceries" />
          <Row>
            <Button title="+ Give" onPress={() => apply(1)} disabled={!amount} style={{ flex: 1 }} />
            <Button title="− Take" kind="danger" onPress={() => apply(-1)} disabled={!amount} style={{ flex: 1 }} />
          </Row>
        </Card>
      ) : null}

      {kid ? (
        <Card>
          <Heading>{kid.name}’s history</Heading>
          {history.length === 0 ? <Body muted>No points yet.</Body> : null}
          {history.map((t) => (
            <ListItem
              key={t.id}
              title={t.reason}
              subtitle={t.createdAt.replace('T', ' ').slice(0, 16)}
              right={
                <Text style={{ fontWeight: '800', color: t.amount >= 0 ? colors.success : colors.danger }}>
                  {t.amount >= 0 ? '+' : ''}
                  {t.amount}
                </Text>
              }
            />
          ))}
        </Card>
      ) : null}
    </Screen>
  );
}
