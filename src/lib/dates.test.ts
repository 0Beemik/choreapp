import { addDays, daysBetween, periodStartFor, weekIndex } from './dates';
import { currentStreak } from '../services/BadgeService';

describe('dates', () => {
  it('finds the start of the chore week for any rotation day', () => {
    expect(periodStartFor('2026-10-01', 'sunday')).toBe('2026-09-27'); // Thursday → prior Sunday
    expect(periodStartFor('2026-10-04', 'sunday')).toBe('2026-10-04'); // rotation day itself
    expect(periodStartFor('2026-10-01', 'thursday')).toBe('2026-10-01');
    expect(periodStartFor('2026-10-01', 'friday')).toBe('2026-09-25');
  });

  it('is immune to daylight-saving changes', () => {
    // US/Canada fall back on 1 Nov 2026.
    expect(addDays('2026-10-31', 2)).toBe('2026-11-02');
    expect(daysBetween('2026-10-31', '2026-11-07')).toBe(7);
    expect(weekIndex('2026-11-08') - weekIndex('2026-11-01')).toBe(1);
  });

  it('counts streaks back from today or yesterday', () => {
    expect(currentStreak(['2026-10-04', '2026-10-03', '2026-10-02'], '2026-10-04')).toBe(3);
    expect(currentStreak(['2026-10-03', '2026-10-02'], '2026-10-04')).toBe(2);
    expect(currentStreak(['2026-10-02'], '2026-10-04')).toBe(0);
  });
});
