import { router, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { useApp } from '@/src/state/AppContext';
import { Button, Screen } from '@/src/ui/components';
import { PinPad } from '@/src/ui/PinPad';
import { colors } from '@/src/ui/theme';

export default function ParentLayout() {
  const { parentUnlocked, unlockParent, lockParent } = useApp();
  const [error, setError] = useState<string | null>(null);

  // Leaving the parent area any way at all (back button, gesture) locks it again.
  useEffect(() => lockParent, [lockParent]);

  if (!parentUnlocked) {
    return (
      <Screen edges={['top', 'bottom']}>
        <PinPad
          title="Parents only — enter your PIN"
          error={error}
          onComplete={async (pin) => {
            const ok = await unlockParent(pin);
            setError(ok ? null : 'That PIN isn’t right.');
          }}
        />
        <Button title="Back to chores" kind="ghost" onPress={() => router.back()} />
      </Screen>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.primary,
        headerTitleStyle: { color: colors.text, fontWeight: '800' },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Parent area' }} />
      <Stack.Screen name="week" options={{ title: 'This week' }} />
      <Stack.Screen name="members" options={{ title: 'Family' }} />
      <Stack.Screen name="member" options={{ title: 'Family member' }} />
      <Stack.Screen name="chores" options={{ title: 'Chores' }} />
      <Stack.Screen name="chore" options={{ title: 'Chore' }} />
      <Stack.Screen name="points" options={{ title: 'Points & allowance' }} />
      <Stack.Screen name="settings" options={{ title: 'Settings' }} />
    </Stack>
  );
}
