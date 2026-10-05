import { useEffect, useState } from 'react';
import { Animated, Easing, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import type { Badge } from '../models';
import { colors, font, radius, space } from './theme';

export interface CelebrationInfo {
  name: string;
  points: number;
  badges: Badge[];
}

const CONFETTI = ['🎉', '⭐', '✨', '🎊', '💫', '🌟'];

export function Celebration({ info, onDone }: { info: CelebrationInfo | null; onDone: () => void }) {
  const [pop] = useState(() => new Animated.Value(0));
  const [fall] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!info) return;
    pop.setValue(0);
    fall.setValue(0);
    Animated.parallel([
      Animated.spring(pop, { toValue: 1, friction: 5, useNativeDriver: true }),
      Animated.timing(fall, { toValue: 1, duration: 1600, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]).start();
    // Plain points celebrations get out of the way on their own; badges wait for a tap.
    if (info.badges.length === 0) {
      const t = setTimeout(onDone, 1600);
      return () => clearTimeout(t);
    }
  }, [info, pop, fall, onDone]);

  if (!info) return null;
  return (
    <Modal transparent animationType="fade" visible onRequestClose={onDone}>
      <Pressable style={styles.backdrop} onPress={onDone} accessibilityLabel="Close celebration">
        {CONFETTI.map((c, i) => (
          <Animated.Text
            key={i}
            style={[
              styles.confetti,
              {
                left: `${10 + i * 15}%`,
                transform: [{ translateY: fall.interpolate({ inputRange: [0, 1], outputRange: [-60, 520 + (i % 3) * 60] }) }],
                opacity: fall.interpolate({ inputRange: [0, 0.8, 1], outputRange: [1, 1, 0] }),
              },
            ]}
          >
            {c}
          </Animated.Text>
        ))}
        <Animated.View style={[styles.card, { transform: [{ scale: pop }] }]}>
          <Text style={styles.big}>🎉</Text>
          <Text style={styles.title}>Great job, {info.name}!</Text>
          <Text style={styles.points}>+{info.points} points</Text>
          {info.badges.map((b) => (
            <View key={b.id} style={styles.badge}>
              <Text style={{ fontSize: 40 }}>{b.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.badgeName}>New badge: {b.name}</Text>
                <Text style={styles.badgeDesc}>
                  {b.description}
                  {b.bonusPoints ? ` · +${b.bonusPoints} bonus` : ''}
                </Text>
              </View>
            </View>
          ))}
          {info.badges.length > 0 ? <Text style={styles.tap}>Tap to continue</Text> : null}
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(30,20,60,0.45)', alignItems: 'center', justifyContent: 'center', padding: space.xl },
  confetti: { position: 'absolute', top: 0, fontSize: 34 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: space.xl,
    alignItems: 'center',
    gap: space.sm,
    width: '100%',
    maxWidth: 380,
  },
  big: { fontSize: 64 },
  title: { fontSize: font.title, fontWeight: '800', color: colors.text, textAlign: 'center' },
  points: { fontSize: font.hero, fontWeight: '900', color: colors.success },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    padding: space.md,
    alignSelf: 'stretch',
  },
  badgeName: { fontSize: font.body, fontWeight: '800', color: colors.text },
  badgeDesc: { fontSize: font.small, color: colors.textMuted },
  tap: { color: colors.textMuted, marginTop: space.sm },
});
