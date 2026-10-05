import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';
import { AVATAR_COLORS, AVATAR_EMOJIS } from '@/src/lib/presets';
import type { Role } from '@/src/models';
import { UserFacingError } from '@/src/services';
import { useApp } from '@/src/state/AppContext';
import { Avatar, Button, Card, EmojiPicker, ErrorText, Field, Row, Screen } from '@/src/ui/components';

export default function Member() {
  const params = useLocalSearchParams<{ id?: string; role?: Role }>();
  const { family, members, services, refresh } = useApp();
  const existing = members.find((m) => m.id === params.id);
  const role: Role = existing?.role ?? params.role ?? 'child';
  const isKid = role === 'child';

  const [name, setName] = useState(existing?.name ?? '');
  const [age, setAge] = useState(existing && existing.age > 0 ? String(existing.age) : '');
  const [emoji, setEmoji] = useState(existing?.avatarEmoji ?? AVATAR_EMOJIS[members.length % AVATAR_EMOJIS.length]);
  const [color, setColor] = useState(existing?.avatarColor ?? AVATAR_COLORS[members.length % AVATAR_COLORS.length]);
  const [allowance, setAllowance] = useState(existing?.allowanceRate ? String(existing.allowanceRate) : '');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!family) return null;

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      const allowanceRate = allowance.trim() ? Number(allowance) : 0;
      if (!Number.isFinite(allowanceRate) || allowanceRate < 0) throw new UserFacingError('Allowance must be a dollar amount.');
      const fields = {
        name,
        age: isKid ? Number(age) : 0,
        role,
        avatarEmoji: emoji,
        avatarColor: color,
        allowanceRate: isKid ? Math.round(allowanceRate * 100) / 100 : 0,
      };
      if (existing) await services.family.updateMember({ ...existing, ...fields });
      else if (isKid) await services.family.addKidAndReshuffle(family.id, fields);
      else await services.family.addMember(family.id, fields);
      await refresh();
      router.back();
    } catch (e) {
      setError(e instanceof UserFacingError ? e.message : 'Could not save. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const remove = () => {
    if (!existing) return;
    Alert.alert(`Remove ${existing.name}?`, 'Their points and history will be deleted. Their chores go to the other kids.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await services.family.removeMember(existing);
            await refresh();
            router.back();
          } catch (e) {
            Alert.alert('Can’t remove', e instanceof UserFacingError ? e.message : 'Please try again.');
          }
        },
      },
    ]);
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: existing ? existing.name : isKid ? 'New kid' : 'New parent' }} />
      <Card>
        <Row style={{ alignItems: 'flex-start' }}>
          <Avatar user={{ avatarEmoji: emoji, avatarColor: color }} size={64} />
          <Field label="Name" value={name} onChangeText={setName} style={{ minWidth: 180 }} />
        </Row>
        {isKid ? (
          <>
            <Field label="Age" value={age} onChangeText={(t) => setAge(t.replace(/\D/g, ''))} keyboardType="number-pad" maxLength={2} />
            <Field
              label="Weekly allowance if every chore is done ($, optional)"
              value={allowance}
              onChangeText={(t) => setAllowance(t.replace(/[^\d.]/g, ''))}
              keyboardType="decimal-pad"
              placeholder="0"
            />
          </>
        ) : null}
        <EmojiPicker label="Avatar" options={AVATAR_EMOJIS} value={emoji} onChange={setEmoji} />
        <EmojiPicker label="Color" options={AVATAR_COLORS} value={color} onChange={setColor} background={(c) => c} />
        <ErrorText>{error}</ErrorText>
        <Button title="Save" onPress={save} busy={busy} />
      </Card>
      {existing ? <Button title={`Remove ${existing.name}`} kind="danger" onPress={remove} /> : null}
    </Screen>
  );
}
