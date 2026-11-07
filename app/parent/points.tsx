import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Text } from 'react-native';
import { UserFacingError, type AllowanceSummary } from '@/src/services';
import { useApp } from '@/src/state/AppContext';
import { Avatar, Body, Button, Card, Choice, Field, Heading, ListItem, Row, Screen } from '@/src/ui/components';
import { colors } from '@/src/ui/theme';

type Currency = 'points' | 'coins';

interface HistoryRow {
  id: string;
  reason: string;
  amount: number;
  createdAt: string;
}

export default function Points() {
  const { family, kids, members, balances, coins, services, refresh } = useApp();
  const [userId, setUserId] = useState(kids[0]?.id ?? members[0]?.id ?? '');
  const [currency, setCurrency] = useState<Currency>('points');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [allowances, setAllowances] = useState<Record<string, AllowanceSummary>>({});

  const load = useCallback(async () => {
    if (!family) return;
    const entries = await Promise.all(kids.map(async (k) => [k.id, await services.points.allowance(family.id, k.id)] as const));
    setAllowances(Object.fromEntries(entries));
    if (userId) setHistory(currency === 'points' ? await services.points.history(userId) : await services.coins.history(userId));
  }, [family, kids, userId, currency, services]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (!family) return null;
  const person = members.find((m) => m.id === userId);
  const unit = currency === 'points' ? '⭐' : '🪙';

  const apply = async (sign: 1 | -1) => {
    try {
      const n = sign * Number(amount);
      if (currency === 'points') await services.points.adjust(family.id, userId, n, reason);
      else await services.coins.adjust(family.id, userId, n, reason);
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

      {person ? (
        <Card>
          <Heading>Give or take</Heading>
          <Choice value={userId} onChange={setUserId} options={members.map((m) => ({ value: m.id, label: `${m.avatarEmoji} ${m.name}` }))} />
          <Choice
            value={currency}
            onChange={setCurrency}
            options={[
              { value: 'points', label: '⭐ Points' },
              { value: 'coins', label: '🪙 Coins' },
            ]}
          />
          <Body>
            {person.name} has ⭐ {balances[person.id] ?? 0} points and 🪙 {coins[person.id] ?? 0} coins
          </Body>
          <Field
            label={currency === 'points' ? 'Points' : 'Coins'}
            value={amount}
            onChangeText={(t) => setAmount(t.replace(/\D/g, ''))}
            keyboardType="number-pad"
            maxLength={4}
          />
          <Field label="Reason" value={reason} onChangeText={setReason} placeholder="Helped with groceries" />
          <Row>
            <Button title="+ Give" onPress={() => apply(1)} disabled={!amount} style={{ flex: 1 }} />
            <Button title="− Take" kind="danger" onPress={() => apply(-1)} disabled={!amount} style={{ flex: 1 }} />
          </Row>
        </Card>
      ) : null}

      {person ? (
        <Card>
          <Heading>
            {person.name}’s {currency}
          </Heading>
          {history.length === 0 ? <Body muted>Nothing yet.</Body> : null}
          {history.map((t) => (
            <ListItem
              key={t.id}
              title={t.reason}
              subtitle={t.createdAt.replace('T', ' ').slice(0, 16)}
              right={
                <Text style={{ fontWeight: '800', color: t.amount >= 0 ? colors.success : colors.danger }}>
                  {t.amount >= 0 ? '+' : ''}
                  {t.amount} {unit}
                </Text>
              }
            />
          ))}
        </Card>
      ) : null}
    </Screen>
  );
}
