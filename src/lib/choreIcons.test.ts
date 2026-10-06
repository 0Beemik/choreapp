import { CHORE_ICON_GROUPS, searchChoreIcons } from './choreIcons';

const emojis = (q: string) => searchChoreIcons(q).flatMap((g) => g.icons.map((i) => i.emoji));

describe('chore pictures', () => {
  it('has lots of pictures and no duplicates', () => {
    const all = CHORE_ICON_GROUPS.flatMap((g) => g.icons.map((i) => i.emoji));
    expect(all.length).toBeGreaterThan(150);
    expect(new Set(all).size).toBe(all.length);
  });

  it('finds the closest picture for chores emoji has no picture of', () => {
    expect(emojis('toilet')).toContain('🚽');
    expect(emojis('Dishwasher')).toContain('🍽️');
    expect(emojis('mow')).toEqual(expect.arrayContaining(['🌱', '🚜']));
    expect(emojis('vacuum')).toContain('🧹');
    expect(emojis('lawn mower')).toContain('🚜');
    expect(emojis('zzzz-nothing')).toEqual([]);
    expect(searchChoreIcons('  ')).toBe(CHORE_ICON_GROUPS);
  });
});
