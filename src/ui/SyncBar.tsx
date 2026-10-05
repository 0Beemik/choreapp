import { Pressable, StyleSheet, Text } from 'react-native';
import { useSync } from '../state/SyncContext';
import { colors, font, radius, space } from './theme';

function ago(ts: string | null): string {
  if (!ts) return 'never';
  const [d, t] = ts.split('T');
  const [y, m, day] = d.split('-').map(Number);
  const [h, mi, s] = t.split(':').map(Number);
  const mins = Math.round((Date.now() - new Date(y, m - 1, day, h, mi, s).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  return hrs < 24 ? `${hrs} h ago` : `${Math.round(hrs / 24)} d ago`;
}

/** On a joined device: is it in touch with the family's main device? Tap to sync now. */
export function SyncBar() {
  const { mode, memberState, link, syncNow } = useSync();
  if (mode !== 'member') return null;
  const { status, pending, lastSyncAt, refused } = memberState;

  let text: string;
  let tone: 'ok' | 'warn' | 'bad' = 'ok';
  if (status === 'removed') {
    text = 'This device was removed from the family. Tap ⚙️ to set it up again.';
    tone = 'bad';
  } else if (status === 'offline') {
    text = `Can’t reach ${link?.familyName ?? 'the main device'}. ${pending ? `${pending} change${pending === 1 ? '' : 's'} will sync when you’re home.` : 'Showing saved chores.'}`;
    tone = 'warn';
  } else if (status === 'idle') {
    text = 'Connecting to the main device…';
  } else {
    text = `✓ Up to date · synced ${ago(lastSyncAt)}${pending ? ` · ${pending} waiting` : ''}`;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Sync status: ${text.replace(/\.+$/, '')}. Tap to sync now.`}
      onPress={syncNow}
      style={[styles.bar, tone === 'warn' && styles.warn, tone === 'bad' && styles.bad]}
    >
      <Text style={styles.text}>{text}</Text>
      {refused.map((r, i) => (
        <Text key={i} style={[styles.text, { color: colors.danger }]}>
          Not saved: {r}
        </Text>
      ))}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: { backgroundColor: colors.successSoft, borderRadius: radius.md, padding: space.md },
  warn: { backgroundColor: colors.warningSoft },
  bad: { backgroundColor: colors.dangerSoft },
  text: { fontSize: font.small, color: colors.text, fontWeight: '600' },
});
