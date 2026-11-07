import { forWhom, groupNotices } from '../lib/noticeGroups';
import type { NotificationKind, User } from '../models';
import type { Services } from '../services';

// Per device, never synced: whether this device pops phone notifications, and how far it has got.
const ENABLED_KEY = 'phone_notifications';
const CHORES_KEY = 'phone_chore_updates';
const MARK_KEY = 'phone_notified_through';
/** More than this at once collapses into a summary, so a phone that was off for a day isn't flooded. */
const MAX_AT_ONCE = 4;

export interface PhoneNotice {
  id: string;
  title: string;
  body: string;
}

const TITLES: Record<NotificationKind, string> = {
  sale_bought: '⭐✓ Your chore sold!',
  sale_posted: '🏷️ New in the marketplace',
  sale_unsold: '🏷️ It didn’t sell',
  offer_posted: '🙋 New buy offer',
  handoff_request: '🤝 Someone wants your help',
  handoff_accepted: '✅ Deal done',
  handoff_closed: '🤝 Request closed',
  push_received: '📌 You’ve been pushed!',
  push_rejected: '↩️ Push sent back',
  payout: '🪙 Coins earned',
  refund: '↩️ Coins back',
  chore_done: '✅ Chore done',
};

export async function phoneNotificationsEnabled(services: Services): Promise<boolean> {
  return (await services.deps.repos.appState.get(ENABLED_KEY)) !== 'off';
}

export async function setPhoneNotificationsEnabled(services: Services, on: boolean): Promise<void> {
  await services.deps.repos.appState.set(ENABLED_KEY, on ? 'on' : 'off');
}

/** Parents' devices can mute "Ava finished…" pop-ups but keep marketplace ones (and vice versa). */
export async function choreUpdatesEnabled(services: Services): Promise<boolean> {
  return (await services.deps.repos.appState.get(CHORES_KEY)) !== 'off';
}

export async function setChoreUpdatesEnabled(services: Services, on: boolean): Promise<void> {
  await services.deps.repos.appState.set(CHORES_KEY, on ? 'on' : 'off');
}

/**
 * News for `viewerIds` that this device hasn't announced yet, grouped and capped, and marks it
 * announced. The very first call only sets the starting point, so old news is never replayed.
 */
export async function takeNewNotices(services: Services, viewerIds: string[], members: User[]): Promise<PhoneNotice[]> {
  const { appState, notifications } = services.deps.repos;
  const raw = await appState.get(MARK_KEY);
  if (!raw) {
    const at = services.deps.timestamp();
    // Anything already stored in this very second counts as old news too.
    const ids = (await notifications.forUsersSince(viewerIds, at)).map((n) => n.id);
    await appState.set(MARK_KEY, JSON.stringify({ at, ids }));
    return [];
  }
  const mark = JSON.parse(raw) as { at: string; ids: string[] };
  // Timestamps are to the second, so remember which ones at the marker second were already shown.
  const fresh = (await notifications.forUsersSince(viewerIds, mark.at)).filter((n) => !mark.ids.includes(n.id));
  if (fresh.length === 0) return [];

  const last = fresh[fresh.length - 1].createdAt;
  const idsAtLast = [...(last === mark.at ? mark.ids : []), ...fresh.filter((n) => n.createdAt === last).map((n) => n.id)];
  await appState.set(MARK_KEY, JSON.stringify({ at: last, ids: idsAtLast }));

  const shared = viewerIds.length > 1;
  const choresOn = await choreUpdatesEnabled(services);
  const groups = groupNotices(choresOn ? fresh : fresh.filter((n) => n.kind !== 'chore_done'));
  const notices = groups.map(({ note, userIds, text }) => ({
    id: note.id,
    title: shared ? `${TITLES[note.kind]} · ${forWhom(userIds, members)}` : TITLES[note.kind],
    body: withoutLeadingEmoji(text, TITLES[note.kind]),
  }));
  if (notices.length <= MAX_AT_ONCE) return notices;
  const shown = notices.slice(-(MAX_AT_ONCE - 1));
  return [
    { id: `summary-${last}`, title: '🔔 Family Chores', body: `${notices.length - shown.length} more updates waiting in the app.` },
    ...shown,
  ];
}

/** The title already starts with the news's emoji ("🙋 New buy offer"); don't repeat it in the body. */
function withoutLeadingEmoji(text: string, title: string): string {
  const space = text.indexOf(' ');
  const first = space > 0 ? text.slice(0, space) : '';
  return first && !/[A-Za-z0-9]/.test(first) && title.startsWith(first) ? text.slice(space + 1) : text;
}
