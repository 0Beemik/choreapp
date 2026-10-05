import { Redirect } from 'expo-router';
import { useApp } from '@/src/state/AppContext';

export default function Index() {
  const { family } = useApp();
  return <Redirect href={family ? '/board' : '/setup'} />;
}
