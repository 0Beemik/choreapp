import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { showInterstitialAtBreak, showRewarded } from '@/src/ads/ads';
import { PACING } from '@/src/ads/config';
import { useApp } from '@/src/state/AppContext';
import { Body, Button, Card, Heading, ListItem, Screen } from '@/src/ui/components';
import { colors, font, space } from '@/src/ui/theme';

const MENU = [
  { href: '/parent/week', icon: '📅', title: 'This week', subtitle: 'Excuse, move or mark chores done' },
  { href: '/parent/chores', icon: '🧹', title: 'Chores', subtitle: 'Add, edit, choose who does what' },
  { href: '/parent/members', icon: '👨‍👩‍👧', title: 'Family', subtitle: 'Kids, parents, avatars, allowance' },
  { href: '/parent/points', icon: '⭐', title: 'Points & allowance', subtitle: 'Bonuses, corrections, history' },
  { href: '/parent/settings', icon: '⚙️', title: 'Settings', subtitle: 'Rules, vacation, PIN' },
  { href: '/parent/devices', icon: '📱', title: 'Family devices', subtitle: 'Put chores on kids’ phones and tablets' },
] as const;

export default function ParentHome() {
  const { family, kids, services, refresh } = useApp();
  const [bonusUsed, setBonusUsed] = useState(0);
  const [busy, setBusy] = useState(false);
  const bonusKey = `rewarded:${services.deps.today()}`;

  useEffect(() => {
    services.deps.repos.appState.get(bonusKey).then((v) => setBonusUsed(Number(v ?? 0)));
  }, [services, bonusKey]);

  if (!family) return null;

  const familyBonus = async () => {
    setBusy(true);
    try {
      const earned = await showRewarded();
      if (!earned) {
        Alert.alert('No bonus this time', 'The video didn’t finish or none was available. Try again later.');
        return;
      }
      for (const kid of kids) {
        await services.points.adjust(family.id, kid.id, PACING.rewardedBonusPoints, 'Family bonus 🎬');
      }
      await services.deps.repos.appState.set(bonusKey, String(bonusUsed + 1));
      setBonusUsed(bonusUsed + 1);
      await refresh();
      Alert.alert('Bonus added!', `Every kid got +${PACING.rewardedBonusPoints} points.`);
    } finally {
      setBusy(false);
    }
  };

  // A natural break: the parent is finished. Leaving the area locks it (see _layout).
  const done = async () => {
    await showInterstitialAtBreak();
    router.dismissTo('/board');
  };

  return (
    <Screen>
      <Card>
        {MENU.map((m) => (
          <ListItem
            key={m.href}
            left={<Text style={{ fontSize: 28 }}>{m.icon}</Text>}
            title={m.title}
            subtitle={m.subtitle}
            right={<Text style={{ color: colors.textMuted, fontSize: font.large }}>›</Text>}
            onPress={() => router.push(m.href)}
          />
        ))}
      </Card>

      {kids.length > 0 ? (
        <Card style={{ backgroundColor: '#EEEAFE', borderColor: colors.primary }}>
          <Heading>🎬 Daily family bonus</Heading>
          <Body muted>
            Watch one short video and every kid gets +{PACING.rewardedBonusPoints} points. Helps keep the app free.
          </Body>
          <View style={{ marginTop: space.md }}>
            {bonusUsed >= PACING.rewardedPerDay ? (
              <Body>Already claimed today. Come back tomorrow!</Body>
            ) : (
              <Button title="Watch & give bonus" kind="secondary" onPress={familyBonus} busy={busy} />
            )}
          </View>
        </Card>
      ) : null}

      <Button title="Done — lock parent area" onPress={done} testID="parent-done" />
    </Screen>
  );
}
