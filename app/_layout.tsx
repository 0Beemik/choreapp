import { Stack, SplashScreen } from 'expo-router';
import * as NativeSplash from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { initAds } from '@/src/ads/ads';
import { AppProvider } from '@/src/state/AppContext';
import { SyncProvider } from '@/src/state/SyncContext';
import { IntroSplash } from '@/src/ui/IntroSplash';
import { PhoneNotifications } from '@/src/notify/PhoneNotifications';
import { CountertopKeepAwake } from '@/src/ui/Countertop';
// Registers the background check-in task; it must be defined when the app starts.
import '@/src/notify/background';
import { colors } from '@/src/ui/theme';

SplashScreen.preventAutoHideAsync();
// The animated intro already shows the same logo in the same place, so cut straight to it
// (a fade would show both logos at once).
NativeSplash.setOptions({ fade: false });

export default function RootLayout() {
  const [error, setError] = useState<Error | null>(null);
  const [ready, setReady] = useState(false);
  const [introDone, setIntroDone] = useState(false);

  useEffect(() => {
    initAds();
  }, []);

  if (error) {
    SplashScreen.hideAsync();
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: colors.bg }}>
        <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 8 }}>
          Something went wrong opening your chores.
        </Text>
        <Text style={{ color: colors.textMuted, textAlign: 'center' }}>{error.message}</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <AppProvider
        onReady={() => {
          setReady(true);
          SplashScreen.hideAsync();
        }}
        onError={setError}
      >
        <SyncProvider>
          <StatusBar style="dark" />
          <PhoneNotifications />
          <CountertopKeepAwake />
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: colors.bg },
              headerTintColor: colors.primary,
              headerTitleStyle: { color: colors.text, fontWeight: '800' },
              headerShadowVisible: false,
              contentStyle: { backgroundColor: colors.bg },
            }}
          >
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="setup" options={{ headerShown: false }} />
            <Stack.Screen name="board" options={{ headerShown: false }} />
            <Stack.Screen name="kid/[id]" options={{ title: '' }} />
            <Stack.Screen name="leaderboard" options={{ title: 'Leaderboard' }} />
            <Stack.Screen name="market" options={{ title: 'Marketplace' }} />
            <Stack.Screen name="notifications" options={{ title: 'Notifications' }} />
            <Stack.Screen name="parent" options={{ headerShown: false }} />
            <Stack.Screen name="join" options={{ title: 'Join your family' }} />
          </Stack>
        </SyncProvider>
      </AppProvider>
      {/* Covers the app from the first frame, so Android's still splash hands straight over to it. */}
      {introDone ? null : <IntroSplash ready={ready} onDone={() => setIntroDone(true)} />}
    </SafeAreaProvider>
  );
}
