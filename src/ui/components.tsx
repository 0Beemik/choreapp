import { type ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import type { User } from '../models';
import { colors, font, radius, space } from './theme';

export function Screen({
  children,
  scroll = true,
  edges = ['bottom'],
  footer,
}: {
  children: ReactNode;
  scroll?: boolean;
  edges?: Edge[];
  footer?: ReactNode;
}) {
  return (
    <SafeAreaView style={styles.screen} edges={edges}>
      {scroll ? (
        <ScrollView contentContainerStyle={styles.scrollBody} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.scrollBody, { flex: 1 }]}>{children}</View>
      )}
      {footer}
    </SafeAreaView>
  );
}

type ButtonKind = 'primary' | 'secondary' | 'danger' | 'ghost';

export function Button({
  title,
  onPress,
  kind = 'primary',
  disabled,
  busy,
  style,
  testID,
}: {
  title: string;
  onPress: () => void;
  kind?: ButtonKind;
  disabled?: boolean;
  busy?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}) {
  const palette = {
    primary: { bg: colors.primary, fg: colors.primaryText, border: colors.primary },
    secondary: { bg: colors.surface, fg: colors.primary, border: colors.primary },
    danger: { bg: colors.surface, fg: colors.danger, border: colors.danger },
    ghost: { bg: 'transparent', fg: colors.primary, border: 'transparent' },
  }[kind];
  const inactive = disabled || busy;
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!inactive }}
      onPress={onPress}
      disabled={inactive}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: palette.bg, borderColor: palette.border, opacity: inactive ? 0.5 : pressed ? 0.8 : 1 },
        style,
      ]}
    >
      {busy ? (
        <ActivityIndicator color={palette.fg} />
      ) : (
        <Text style={[styles.buttonText, { color: palette.fg }]}>{title}</Text>
      )}
    </Pressable>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Title({ children }: { children: ReactNode }) {
  return <Text style={styles.title}>{children}</Text>;
}

export function Heading({ children }: { children: ReactNode }) {
  return <Text style={styles.heading}>{children}</Text>;
}

export function Body({ children, muted, center }: { children: ReactNode; muted?: boolean; center?: boolean }) {
  return (
    <Text style={[styles.body, muted && { color: colors.textMuted }, center && { textAlign: 'center' }]}>
      {children}
    </Text>
  );
}

export function Field({ label, error, ...input }: TextInputProps & { label: string; error?: string | null }) {
  return (
    <View style={{ marginBottom: space.md }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.textMuted}
        {...input}
        style={[styles.input, error ? { borderColor: colors.danger } : null, input.style]}
        accessibilityLabel={label}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

export function ErrorText({ children }: { children: ReactNode }) {
  if (!children) return null;
  return <Text style={[styles.error, { marginBottom: space.md }]}>{children}</Text>;
}

export function Avatar({ user, size = 48 }: { user: Pick<User, 'avatarEmoji' | 'avatarColor'>; size?: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: user.avatarColor,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ fontSize: size * 0.55 }}>{user.avatarEmoji}</Text>
    </View>
  );
}

export function Choice<T extends string | number>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  label?: string;
}) {
  return (
    <View style={{ marginBottom: space.md }}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.choiceRow}>
        {options.map((o) => {
          const selected = o.value === value;
          return (
            <Pressable
              key={String(o.value)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => onChange(o.value)}
              style={[styles.choice, selected && styles.choiceSelected]}
            >
              <Text style={[styles.choiceText, selected && { color: colors.primaryText }]}>{o.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/** Like Choice, but any number of options can be on at once. */
export function MultiChoice<T extends string | number>({
  options,
  values,
  onToggle,
  label,
  hint,
}: {
  options: { value: T; label: string }[];
  values: T[];
  onToggle: (v: T) => void;
  label?: string;
  /** Shown after the label, e.g. "(pick as many as you need)". */
  hint?: string;
}) {
  return (
    <View style={{ marginBottom: space.md }}>
      {label ? (
        <Text style={styles.label}>
          {label}
          {hint ? <Text style={styles.labelHint}> {hint}</Text> : null}
        </Text>
      ) : null}
      <View style={styles.choiceRow}>
        {options.map((o) => {
          const selected = values.includes(o.value);
          return (
            <Pressable
              key={String(o.value)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: selected }}
              onPress={() => onToggle(o.value)}
              style={[styles.choice, selected && styles.choiceSelected]}
            >
              <Text style={[styles.choiceText, selected && { color: colors.primaryText }]}>
                {selected ? '✓ ' : ''}
                {o.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function EmojiPicker({
  options,
  value,
  onChange,
  label,
  background,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
  label: string;
  background?: (o: string) => string;
}) {
  return (
    <View style={{ marginBottom: space.md }}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.emojiGrid}>
        {options.map((o) => (
          <Pressable
            key={o}
            accessibilityRole="button"
            accessibilityLabel={`${label} ${o}`}
            accessibilityState={{ selected: o === value }}
            onPress={() => onChange(o)}
            style={[
              styles.emojiCell,
              background ? { backgroundColor: background(o) } : null,
              o === value && styles.emojiSelected,
            ]}
          >
            {background ? null : <Text style={{ fontSize: 26 }}>{o}</Text>}
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export function Row({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap: space.md }, style]}>{children}</View>;
}

export function ListItem({
  left,
  title,
  subtitle,
  right,
  onPress,
}: {
  left?: ReactNode;
  title: string;
  subtitle?: string;
  right?: ReactNode;
  onPress?: () => void;
}) {
  const content = (
    <Row style={styles.listItem}>
      {left}
      <View style={{ flex: 1 }}>
        <Text style={styles.listTitle}>{title}</Text>
        {subtitle ? <Text style={styles.listSubtitle}>{subtitle}</Text> : null}
      </View>
      {right}
    </Row>
  );
  if (!onPress) return content;
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
      {content}
    </Pressable>
  );
}

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  scrollBody: { padding: space.lg, paddingBottom: space.xxl, gap: space.md },
  button: {
    minHeight: 50,
    paddingHorizontal: space.xl,
    borderRadius: radius.pill,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { fontSize: font.body, fontWeight: '700' },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: space.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: { fontSize: font.title, fontWeight: '800', color: colors.text },
  heading: { fontSize: font.large, fontWeight: '700', color: colors.text, marginBottom: space.sm },
  body: { fontSize: font.body, color: colors.text, lineHeight: 22 },
  label: { fontSize: font.small, fontWeight: '700', color: colors.textMuted, marginBottom: space.xs, textTransform: 'uppercase' },
  labelHint: { fontWeight: '400', textTransform: 'none' },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    paddingVertical: space.md,
    fontSize: font.large,
    color: colors.text,
  },
  error: { color: colors.danger, fontSize: font.small, marginTop: space.xs },
  choiceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  choice: {
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  choiceSelected: { backgroundColor: colors.primary },
  choiceText: { color: colors.primary, fontWeight: '700', fontSize: font.body },
  emojiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  emojiCell: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
  },
  emojiSelected: { borderColor: colors.primary, borderWidth: 3 },
  listItem: { paddingVertical: space.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  listTitle: { fontSize: font.body, fontWeight: '700', color: colors.text },
  listSubtitle: { fontSize: font.small, color: colors.textMuted, marginTop: 2 },
});
