import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { AVATAR_COLORS, AVATAR_EMOJIS, STARTER_CHORES } from '@/src/lib/presets';
import { UserFacingError, type MemberInput } from '@/src/services';
import { useApp } from '@/src/state/AppContext';
import {
  Avatar,
  Body,
  Button,
  Card,
  EmojiPicker,
  ErrorText,
  Field,
  Heading,
  ListItem,
  Row,
  Screen,
  Title,
} from '@/src/ui/components';
import { PinPad } from '@/src/ui/PinPad';
import { colors, font, radius, space } from '@/src/ui/theme';

type Step = 'family' | 'parent' | 'pin' | 'confirmPin' | 'kids' | 'chores';
const ORDER: Step[] = ['family', 'parent', 'pin', 'confirmPin', 'kids', 'chores'];

interface KidDraft {
  name: string;
  age: string;
  avatarEmoji: string;
  avatarColor: string;
}

const newKid = (i: number): KidDraft => ({
  name: '',
  age: '',
  avatarEmoji: AVATAR_EMOJIS[i % AVATAR_EMOJIS.length],
  avatarColor: AVATAR_COLORS[i % AVATAR_COLORS.length],
});

export default function Setup() {
  const { services, refresh } = useApp();
  const [step, setStep] = useState<Step>('family');
  const [familyName, setFamilyName] = useState('');
  const [parentName, setParentName] = useState('');
  const [pin, setPin] = useState('');
  const [kids, setKids] = useState<MemberInput[]>([]);
  const [draft, setDraft] = useState<KidDraft>(newKid(0));
  const [picked, setPicked] = useState(() => new Set(STARTER_CHORES.slice(0, 5).map((c) => c.name)));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const go = (s: Step) => {
    setError(null);
    setStep(s);
  };
  const back = () => go(ORDER[Math.max(0, ORDER.indexOf(step) - 1)]);
  const progress = `Step ${Math.min(ORDER.indexOf(step), 4) + 1} of 5`;

  const addKid = () => {
    const age = Number(draft.age);
    if (!draft.name.trim()) return setError('What is your kid’s name?');
    if (!Number.isInteger(age) || age < 1 || age > 25) return setError('Enter an age between 1 and 25.');
    setKids([...kids, { name: draft.name.trim(), age, role: 'child', avatarEmoji: draft.avatarEmoji, avatarColor: draft.avatarColor }]);
    setDraft(newKid(kids.length + 1));
    setError(null);
  };

  const finish = async () => {
    setBusy(true);
    setError(null);
    try {
      await services.family.setup({
        familyName,
        parent: { name: parentName, age: 0, role: 'parent' },
        pin,
        kids,
        chores: STARTER_CHORES.filter((c) => picked.has(c.name)),
      });
      await refresh();
      router.replace('/board');
    } catch (e) {
      setError(e instanceof UserFacingError ? e.message : 'Could not save. Please try again.');
      setBusy(false);
    }
  };

  if (step === 'pin' || step === 'confirmPin') {
    return (
      <Screen edges={['top', 'bottom']}>
        <Text style={stepStyle}>{progress}</Text>
        <Title>{step === 'pin' ? 'Pick a parent PIN' : 'Type it once more'}</Title>
        <Body muted>Kids use the chore board freely. This 4-digit PIN keeps the parent settings just for you.</Body>
        <PinPad
          title={step === 'pin' ? 'New PIN' : 'Confirm PIN'}
          error={error}
          onComplete={(entered) => {
            if (step === 'pin') {
              setPin(entered);
              go('confirmPin');
            } else if (entered === pin) {
              go('kids');
            } else {
              setPin('');
              setStep('pin');
              setError('Those didn’t match. Let’s try again.');
            }
          }}
        />
        <Button title="Back" kind="ghost" onPress={() => go('parent')} />
      </Screen>
    );
  }

  return (
    <Screen edges={['top', 'bottom']}>
      <Text style={stepStyle}>{progress}</Text>

      {step === 'family' && (
        <>
          <Text style={{ fontSize: 56, textAlign: 'center' }}>🏡</Text>
          <Title>Welcome! Let’s get your family set up.</Title>
          <Body muted>Takes about a minute. Everything stays on this device.</Body>
          <Field label="Family name" value={familyName} onChangeText={setFamilyName} placeholder="The Johnsons" autoFocus />
          <ErrorText>{error}</ErrorText>
          <Button
            title="Next"
            onPress={() => (familyName.trim().length < 2 ? setError('Family name needs at least 2 characters.') : go('parent'))}
          />
        </>
      )}

      {step === 'parent' && (
        <>
          <Title>Who’s the parent in charge?</Title>
          <Field label="Your name" value={parentName} onChangeText={setParentName} placeholder="Mom" autoFocus />
          <ErrorText>{error}</ErrorText>
          <Button title="Next" onPress={() => (parentName.trim() ? go('pin') : setError('Please enter your name.'))} />
          <Button title="Back" kind="ghost" onPress={back} />
        </>
      )}

      {step === 'kids' && (
        <>
          <Title>Add your kids</Title>
          <Body muted>Kids 6 and under get a bigger, picture-first view.</Body>
          {kids.map((k, i) => (
            <ListItem
              key={i}
              left={<Avatar user={{ avatarEmoji: k.avatarEmoji!, avatarColor: k.avatarColor! }} />}
              title={k.name}
              subtitle={`Age ${k.age}`}
              right={<Button title="Remove" kind="ghost" onPress={() => setKids(kids.filter((_, j) => j !== i))} />}
            />
          ))}
          <Card>
            <Heading>{kids.length ? 'Add another kid' : 'Add a kid'}</Heading>
            <Row style={{ alignItems: 'flex-start' }}>
              <Avatar user={draft} size={64} />
              <View style={{ flex: 1 }}>
                <Field label="Name" value={draft.name} onChangeText={(name) => setDraft({ ...draft, name })} placeholder="Ava" />
                <Field
                  label="Age"
                  value={draft.age}
                  onChangeText={(age) => setDraft({ ...draft, age: age.replace(/\D/g, '') })}
                  keyboardType="number-pad"
                  placeholder="8"
                  maxLength={2}
                />
              </View>
            </Row>
            <EmojiPicker label="Avatar" options={AVATAR_EMOJIS} value={draft.avatarEmoji} onChange={(avatarEmoji) => setDraft({ ...draft, avatarEmoji })} />
            <EmojiPicker
              label="Color"
              options={AVATAR_COLORS}
              value={draft.avatarColor}
              onChange={(avatarColor) => setDraft({ ...draft, avatarColor })}
              background={(c) => c}
            />
            <ErrorText>{error}</ErrorText>
            <Button title="Add kid" kind="secondary" onPress={addKid} />
          </Card>
          <Button
            title="Next"
            disabled={kids.length === 0}
            onPress={() => go('chores')}
          />
          <Button title="Back" kind="ghost" onPress={() => go('pin')} />
        </>
      )}

      {step === 'chores' && (
        <>
          <Title>Pick some starter chores</Title>
          <Body muted>They rotate between your kids every week. You can add your own any time.</Body>
          <View style={{ gap: space.sm }}>
            {STARTER_CHORES.map((c) => {
              const on = picked.has(c.name);
              return (
                <Pressable
                  key={c.name}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: on }}
                  onPress={() => {
                    const next = new Set(picked);
                    if (on) next.delete(c.name);
                    else next.add(c.name);
                    setPicked(next);
                  }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: space.md,
                    padding: space.md,
                    borderRadius: radius.md,
                    borderWidth: 2,
                    borderColor: on ? colors.primary : colors.border,
                    backgroundColor: on ? '#EEEAFE' : colors.surface,
                  }}
                >
                  <Text style={{ fontSize: 28 }}>{c.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: font.body, fontWeight: '700', color: colors.text }}>{c.name}</Text>
                    <Text style={{ color: colors.textMuted }}>{c.frequency === 'daily' ? 'Every day' : 'Once a week'}</Text>
                  </View>
                  <Text style={{ fontSize: 22, color: on ? colors.primary : colors.border }}>{on ? '✓' : '○'}</Text>
                </Pressable>
              );
            })}
          </View>
          <ErrorText>{error}</ErrorText>
          <Button title="Start chores!" onPress={finish} busy={busy} testID="finish-setup" />
          <Button title="Back" kind="ghost" onPress={back} />
        </>
      )}
    </Screen>
  );
}

const stepStyle = { color: colors.textMuted, fontWeight: '700' as const, fontSize: font.small };
