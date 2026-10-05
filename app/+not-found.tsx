import { router, Stack } from 'expo-router';
import { Body, Button, Screen, Title } from '@/src/ui/components';

export default function NotFound() {
  return (
    <Screen>
      <Stack.Screen options={{ title: 'Oops' }} />
      <Title>That page wandered off.</Title>
      <Body muted>Let&apos;s get you back to the chore board.</Body>
      <Button title="Go to chores" onPress={() => router.replace('/')} />
    </Screen>
  );
}
