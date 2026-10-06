import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { searchChoreIcons } from '../lib/choreIcons';
import { colors, font, radius, space } from './theme';

/** Shows the chosen picture; tapping opens a full-screen, searchable picker. */
export function ChoreIconPicker({ value, onChange }: { value: string; onChange: (emoji: string) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const groups = searchChoreIcons(query);

  const close = () => {
    setOpen(false);
    setQuery('');
  };

  return (
    <View style={{ marginBottom: space.md }}>
      <Text style={styles.label}>Picture</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Picture ${value}. Change picture`}
        onPress={() => setOpen(true)}
        style={({ pressed }) => [styles.current, pressed && { opacity: 0.75 }]}
      >
        <View style={styles.currentIcon}>
          <Text style={{ fontSize: 34 }}>{value}</Text>
        </View>
        <Text style={styles.change}>Change picture ›</Text>
      </Pressable>

      <Modal visible={open} animationType="slide" onRequestClose={close}>
        <SafeAreaProvider>
          <SafeAreaView style={styles.sheet} edges={['top', 'bottom']}>
            <View style={styles.header}>
              <Text style={styles.title}>Pick a picture</Text>
              <Pressable accessibilityRole="button" onPress={close} hitSlop={12}>
                <Text style={styles.done}>Done</Text>
              </Pressable>
            </View>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search: toilet, dishes, lawn, dog…"
              placeholderTextColor={colors.textMuted}
              style={styles.search}
              autoCorrect={false}
              returnKeyType="search"
              accessibilityLabel="Search pictures"
            />
            <ScrollView contentContainerStyle={styles.list} keyboardShouldPersistTaps="handled">
              {groups.length === 0 ? (
                <Text style={styles.empty}>No pictures match “{query}”. Try another word, like “clean” or “yard”.</Text>
              ) : null}
              {groups.map((group) => (
                <View key={group.title} style={{ marginBottom: space.lg }}>
                  <Text style={styles.label}>{group.title}</Text>
                  <View style={styles.grid}>
                    {group.icons.map((icon) => (
                      <Pressable
                        key={icon.emoji}
                        accessibilityRole="button"
                        accessibilityLabel={icon.words.split(' ').slice(0, 2).join(' ')}
                        accessibilityState={{ selected: icon.emoji === value }}
                        onPress={() => {
                          onChange(icon.emoji);
                          close();
                        }}
                        style={[styles.cell, icon.emoji === value && styles.cellSelected]}
                      >
                        <Text style={{ fontSize: 30 }}>{icon.emoji}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              ))}
            </ScrollView>
          </SafeAreaView>
        </SafeAreaProvider>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: font.small, fontWeight: '700', color: colors.textMuted, marginBottom: space.xs, textTransform: 'uppercase' },
  current: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  currentIcon: {
    width: 64,
    height: 64,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  change: { color: colors.primary, fontWeight: '700', fontSize: font.body },
  sheet: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
  title: { fontSize: font.large, fontWeight: '800', color: colors.text },
  done: { color: colors.primary, fontWeight: '800', fontSize: font.body },
  search: {
    marginHorizontal: space.lg,
    marginBottom: space.md,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    fontSize: font.body,
    color: colors.text,
  },
  list: { paddingHorizontal: space.lg, paddingBottom: space.xxl },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  cell: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellSelected: { borderColor: colors.primary, borderWidth: 3, backgroundColor: colors.surfaceAlt },
  empty: { color: colors.textMuted, fontSize: font.body, textAlign: 'center', marginTop: space.xl },
});
