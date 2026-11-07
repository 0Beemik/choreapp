import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, font, space } from './theme';

const LOGO = require('../../assets/images/splash-icon.png');
// Same size and place as the native splash (app.json → expo-splash-screen imageWidth), so the
// handover from Android's still splash to this animated one is seamless.
const LOGO_SIZE = 160;
/** From the app being ready to starting the fade into it. */
const TOTAL_MS = 1300;
const SPARKLES = [
  { emoji: '⭐', x: -110, y: -70, delay: 0 },
  { emoji: '🪙', x: 105, y: -55, delay: 90 },
  { emoji: '✨', x: -95, y: 60, delay: 180 },
  { emoji: '⭐', x: 115, y: 70, delay: 270 },
];

/**
 * A short animated intro on cold start: logo pops, sparkles appear, title fades in, then the
 * whole thing fades into the app. Starts when `ready` (the app has loaded); tap to skip.
 */
export function IntroSplash({ ready, onDone }: { ready: boolean; onDone: () => void }) {
  const [pop] = useState(() => new Animated.Value(0));
  const [rise] = useState(() => new Animated.Value(0));
  const [text] = useState(() => new Animated.Value(0));
  const [sparkles] = useState(() => SPARKLES.map(() => new Animated.Value(0)));
  const [fade] = useState(() => new Animated.Value(1));
  const finished = useRef(false);

  const finish = () => {
    if (finished.current) return;
    finished.current = true;
    Animated.timing(fade, { toValue: 0, duration: 280, easing: Easing.out(Easing.quad), useNativeDriver: true }).start(onDone);
  };

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    AccessibilityInfo.isReduceMotionEnabled()
      .catch(() => false)
      .then((reduce) => {
        if (cancelled) return;
        if (reduce) {
          text.setValue(1);
          timer = setTimeout(finish, 700);
          return;
        }
        Animated.parallel([
          Animated.spring(pop, { toValue: 1, friction: 4, tension: 120, useNativeDriver: true }),
          Animated.timing(rise, { toValue: 1, duration: 450, delay: 150, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          Animated.timing(text, { toValue: 1, duration: 400, delay: 350, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          ...sparkles.map((v, i) =>
            Animated.spring(v, { toValue: 1, friction: 5, tension: 140, delay: 250 + SPARKLES[i].delay, useNativeDriver: true }),
          ),
        ]).start();
        // A fixed length: springs take a while to settle completely, and nobody should wait for that.
        timer = setTimeout(finish, TOTAL_MS);
      });
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
    // Runs once, when the app becomes ready.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  const logoScale = pop.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.18, 1] });
  const lift = rise.interpolate({ inputRange: [0, 1], outputRange: [0, -50] });

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.root, { opacity: fade }]} pointerEvents={ready ? 'auto' : 'none'}>
      <Pressable style={styles.fill} onPress={finish} accessibilityRole="button" accessibilityLabel="Family Chores. Tap to continue">
        <Animated.View style={{ alignItems: 'center', transform: [{ translateY: lift }] }}>
          <View>
            {SPARKLES.map((s, i) => (
              <Animated.Text
                key={i}
                style={[
                  styles.sparkle,
                  {
                    opacity: sparkles[i],
                    transform: [
                      { translateX: s.x },
                      { translateY: s.y },
                      { scale: sparkles[i].interpolate({ inputRange: [0, 1], outputRange: [0.2, 1] }) },
                      { rotate: sparkles[i].interpolate({ inputRange: [0, 1], outputRange: ['-30deg', '0deg'] }) },
                    ],
                  },
                ]}
              >
                {s.emoji}
              </Animated.Text>
            ))}
            <Animated.View style={{ transform: [{ scale: logoScale }] }}>
              <Image source={LOGO} style={{ width: LOGO_SIZE, height: LOGO_SIZE }} />
            </Animated.View>
          </View>
          <Animated.View
            style={{ alignItems: 'center', opacity: text, transform: [{ translateY: text.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] }}
          >
            <Text style={styles.title}>Family Chores</Text>
            <Text style={styles.tagline}>Do chores. Earn coins. Win the week.</Text>
          </Animated.View>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: colors.bg, zIndex: 100, elevation: 100 },
  fill: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  sparkle: { position: 'absolute', left: LOGO_SIZE / 2 - 16, top: LOGO_SIZE / 2 - 18, fontSize: 30 },
  title: { fontSize: 34, fontWeight: '900', color: colors.primary, marginTop: space.md },
  tagline: { fontSize: font.body, fontWeight: '700', color: colors.textMuted, marginTop: space.xs },
});
