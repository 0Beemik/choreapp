// All chore scheduling works on the family's *local* calendar. A chore finished at
// 8pm in Toronto belongs to that day, not to the next UTC day, so never derive
// day keys from toISOString().

export type DayKey = string; // 'YYYY-MM-DD' in local time

export const WEEKDAYS = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
] as const;
export type Weekday = (typeof WEEKDAYS)[number];

const pad = (n: number) => String(n).padStart(2, '0');

export function dayKey(date: Date): DayKey {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/**
 * Local wall-clock timestamp, 'YYYY-MM-DDTHH:mm:ss'. Stored this way so the first ten
 * characters are always the local DayKey, which SQL range queries rely on.
 */
export function localTimestamp(date: Date): string {
  return `${dayKey(date)}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export function fromDayKey(key: DayKey): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(key: DayKey, days: number): DayKey {
  const d = fromDayKey(key);
  d.setDate(d.getDate() + days);
  return dayKey(d);
}

/** Whole days from a to b (b - a), immune to DST shifts. */
export function daysBetween(a: DayKey, b: DayKey): number {
  const ua = Date.UTC(...ymd(a));
  const ub = Date.UTC(...ymd(b));
  return Math.round((ub - ua) / 86_400_000);
}

function ymd(key: DayKey): [number, number, number] {
  const [y, m, d] = key.split('-').map(Number);
  return [y, m - 1, d];
}

/** First day of the chore week containing `today`, given the family's rotation day. */
export function periodStartFor(today: DayKey, rotationDay: Weekday): DayKey {
  const dow = fromDayKey(today).getDay();
  const target = WEEKDAYS.indexOf(rotationDay);
  return addDays(today, -((dow - target + 7) % 7));
}

export function periodEndFor(periodStart: DayKey): DayKey {
  return addDays(periodStart, 6);
}

/** Stable week counter used to rotate chores between kids. */
export function weekIndex(periodStart: DayKey): number {
  return Math.floor(daysBetween('2000-01-02', periodStart) / 7);
}

export function monthBounds(today: DayKey): { start: DayKey; end: DayKey } {
  const d = fromDayKey(today);
  const start = new Date(d.getFullYear(), d.getMonth(), 1);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return { start: dayKey(start), end: dayKey(end) };
}

export function daysInRange(start: DayKey, end: DayKey): DayKey[] {
  const out: DayKey[] = [];
  for (let k = start; k <= end; k = addDays(k, 1)) out.push(k);
  return out;
}

export function formatDay(key: DayKey): string {
  return fromDayKey(key).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}
