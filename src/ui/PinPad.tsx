import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, font, radius, space } from './theme';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'];

/** Big-button 4-digit PIN entry. Calls onComplete once four digits are in. */
export function PinPad({
  title,
  error,
  onComplete,
}: {
  title: string;
  error?: string | null;
  onComplete: (pin: string) => void | Promise<void>;
}) {
  const [pin, setPin] = useState('');

  const press = async (k: string) => {
    if (k === '⌫') return setPin((p) => p.slice(0, -1));
    if (!k || pin.length >= 4) return;
    const next = pin + k;
    setPin(next);
    if (next.length === 4) {
      await onComplete(next);
      setPin('');
    }
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.dots} accessibilityLabel={`${pin.length} of 4 digits entered`}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={[styles.dot, i < pin.length && styles.dotFilled]} />
        ))}
      </View>
      <Text style={styles.error}>{error ?? ' '}</Text>
      <View style={styles.grid}>
        {KEYS.map((k, i) => (
          <Pressable
            key={i}
            disabled={!k}
            accessibilityRole="button"
            accessibilityLabel={k === '⌫' ? 'Delete' : k}
            onPress={() => press(k)}
            style={({ pressed }) => [styles.key, !k && { opacity: 0 }, pressed && { backgroundColor: colors.surfaceAlt }]}
          >
            <Text style={styles.keyText}>{k}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: space.md },
  title: { fontSize: font.large, fontWeight: '700', color: colors.text, textAlign: 'center' },
  dots: { flexDirection: 'row', gap: space.lg, marginVertical: space.sm },
  dot: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: colors.primary },
  dotFilled: { backgroundColor: colors.primary },
  error: { color: colors.danger, fontSize: font.body, minHeight: 22 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', width: 264, gap: space.md, justifyContent: 'center' },
  key: {
    width: 76,
    height: 64,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyText: { fontSize: 26, fontWeight: '700', color: colors.text },
});
