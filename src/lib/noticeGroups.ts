import type { AppNotification, User } from '../models';

export interface NoticeGroup {
  note: AppNotification;
  /** Everyone it was for. */
  userIds: string[];
  /** What the group says: the note's own text, or a bundle like "Ava finished 3 chores". */
  text: string;
}

/**
 * Family-wide news ("Cal will do a chore for 4") is stored once per person; where several people
 * share a screen it shows once, with everyone it was for. A kid's finished chores on the same day
 * bundle into one line, so a morning list doesn't fill the bell (or buzz a parent five times).
 */
export function groupNotices(items: AppNotification[]): NoticeGroup[] {
  const groups: (NoticeGroup & { notes: AppNotification[] })[] = [];
  const byKey = new Map<string, NoticeGroup & { notes: AppNotification[] }>();
  for (const n of items) {
    const key =
      n.kind === 'chore_done'
        ? `chore_done|${(n.refId ?? '').split('|')[0]}|${n.createdAt.slice(0, 10)}`
        : `${n.kind}|${n.refId}|${n.text}`;
    const g = byKey.get(key);
    if (g) {
      if (!g.userIds.includes(n.userId)) g.userIds.push(n.userId);
      g.notes.push(n);
    } else {
      const fresh = { note: n, userIds: [n.userId], text: n.text, notes: [n] };
      byKey.set(key, fresh);
      groups.push(fresh);
    }
  }
  for (const g of groups) {
    if (g.note.kind === 'chore_done') g.text = choreBundleText(g.notes);
  }
  return groups.map(({ note, userIds, text }) => ({ note, userIds, text }));
}

function choreBundleText(notes: AppNotification[]): string {
  // One copy per parent is stored; count each finished chore once.
  const unique = [...new Map(notes.map((n) => [n.refId, n])).values()];
  if (unique.length === 1) return unique[0].text;
  const who = /^✅ (.+?) finished/.exec(unique[0].text)?.[1] ?? 'Someone';
  const names = unique.map((n) => /“(.+?)”/.exec(n.text)?.[1]).filter(Boolean);
  const listed = names.length > 3 ? `${names.slice(0, 3).join(', ')} +${names.length - 3} more` : names.join(', ');
  return `✅ ${who} finished ${unique.length} chores: ${listed}`;
}

/** "For everyone", or "For Ava & Ben". */
export function forWhom(userIds: string[], members: User[]): string {
  if (userIds.length > 1 && userIds.length >= members.length - 1) return 'For everyone';
  return `For ${userIds.map((id) => members.find((m) => m.id === id)?.name ?? 'someone').join(' & ')}`;
}
