import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { forWhom, groupNotices } from '@/src/lib/noticeGroups';
import type { AppNotification } from '@/src/models';
import { useApp } from '@/src/state/AppContext';
import { useSync } from '@/src/state/SyncContext';
import { Body, Button, Card, Screen } from '@/src/ui/components';
import { colors, font, space } from '@/src/ui/theme';

export default function Notifications() {
  const { members, coins, services } = useApp();
  const { ownerId } = useSync();
  const [items, setItems] = useState<AppNotification[]>([]);
  // A kid's own phone shows theirs; shared devices show the whole family's.
  const viewerIds = ownerId ? [ownerId] : members.map((m) => m.id);
  const key = viewerIds.join(',');

  useFocusEffect(
    useCallback(() => {
      let live = true;
      services.notifications.list(key.split(',').filter(Boolean)).then((list) => {
        if (live) setItems(list);
        services.notifications.markSeen().catch(() => undefined);
      });
      return () => {
        live = false;
      };
      // coins: reload when anything settles while the screen is open.
    }, [services, key, coins]), // eslint-disable-line react-hooks/exhaustive-deps
  );

  const groups = groupNotices(items);
  return (
    <Screen>
      <Button title="🏪 Open the marketplace" kind="secondary" onPress={() => router.push('/market')} />
      {items.length === 0 ? <Body muted>No notifications yet. When someone buys, sells or pushes a chore, it shows up here.</Body> : null}
      {items.length > 0 ? (
        <Card>
          {groups.map(({ note, userIds, text }) => (
            <View key={note.id} style={styles.row}>
              <Text style={styles.text}>{text}</Text>
              <Text style={styles.meta}>
                {ownerId ? '' : `${forWhom(userIds, members)} · `}
                {note.createdAt.replace('T', ' ').slice(5, 16)}
              </Text>
            </View>
          ))}
        </Card>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { paddingVertical: space.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  text: { fontSize: font.body, color: colors.text },
  meta: { fontSize: font.small, color: colors.textMuted, marginTop: 2 },
});
