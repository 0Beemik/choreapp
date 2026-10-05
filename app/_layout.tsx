import { Stack, SplashScreen } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { initAds } from '@/src/ads/ads';
import { AppProvider } from '@/src/state/AppContext';
import { colors } from '@/src/ui/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [error, setError] = useState<Error | null>(null);

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
      <AppProvider onReady={() => SplashScreen.hideAsync()} onError={setError}>
        <StatusBar style="dark" />
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
          <Stack.Screen name="parent" options={{ headerShown: false }} />
        </Stack>
      </AppProvider>
    </SafeAreaProvider>
  );
}
