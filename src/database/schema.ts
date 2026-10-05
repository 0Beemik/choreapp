// Each entry upgrades the schema by one version (tracked in PRAGMA user_version).
// Never edit a shipped migration; append a new one.
export const MIGRATIONS: string[] = [
  `
  CREATE TABLE families (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    points_per_chore INTEGER NOT NULL DEFAULT 10,
    buyout_cost_percentage INTEGER NOT NULL DEFAULT 100,
    max_buyouts_per_month INTEGER NOT NULL DEFAULT 4,
    rotation_day TEXT NOT NULL DEFAULT 'sunday',
    missed_chore_penalty INTEGER NOT NULL DEFAULT 2,
    pin_hash TEXT NOT NULL,
    pin_salt TEXT NOT NULL,
    current_period_start TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE users (
    id TEXT PRIMARY KEY NOT NULL,
    family_id TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    age INTEGER NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('parent', 'child')),
    avatar_emoji TEXT NOT NULL,
    avatar_color TEXT NOT NULL,
    allowance_rate REAL NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  );

  CREATE TABLE chores (
    id TEXT PRIMARY KEY NOT NULL,
    family_id TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    icon TEXT NOT NULL,
    frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly')),
    points INTEGER,
    fixed_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    rotation_offset INTEGER NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL
  );

  CREATE TABLE chore_assignments (
    id TEXT PRIMARY KEY NOT NULL,
    family_id TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    chore_id TEXT NOT NULL REFERENCES chores(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    period_start TEXT NOT NULL,
    due_date TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending'
      CHECK (status IN ('pending', 'completed', 'bought_out', 'missed', 'excused')),
    completed_at TEXT,
    points_awarded INTEGER NOT NULL DEFAULT 0,
    points_spent INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    UNIQUE (chore_id, due_date)
  );
  CREATE INDEX idx_assignments_family_period ON chore_assignments(family_id, period_start);
  CREATE INDEX idx_assignments_user ON chore_assignments(user_id, status);

  CREATE TABLE point_transactions (
    id TEXT PRIMARY KEY NOT NULL,
    family_id TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assignment_id TEXT REFERENCES chore_assignments(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN ('earned', 'spent', 'penalty', 'bonus', 'adjustment')),
    amount INTEGER NOT NULL,
    reason TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE INDEX idx_points_user ON point_transactions(user_id, created_at);

  CREATE TABLE badges (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL,
    criteria TEXT NOT NULL,
    threshold INTEGER NOT NULL,
    bonus_points INTEGER NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE user_badges (
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    badge_id TEXT NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
    earned_at TEXT NOT NULL,
    PRIMARY KEY (user_id, badge_id)
  );

  CREATE TABLE vacations (
    id TEXT PRIMARY KEY NOT NULL,
    family_id TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL
  );

  CREATE TABLE app_state (
    key TEXT PRIMARY KEY NOT NULL,
    value TEXT NOT NULL
  );

  INSERT INTO badges (id, name, description, icon, criteria, threshold, bonus_points, sort_order) VALUES
    ('first_chore',  'First Step',     'Finish your very first chore',          '🌱', 'completions',     1,    5, 1),
    ('chores_25',    'Helping Hand',   'Finish 25 chores',                      '🤝', 'completions',     25,  10, 2),
    ('chores_100',   'Chore Champion', 'Finish 100 chores',                     '🏆', 'completions',     100, 25, 3),
    ('points_100',   'Century',        'Earn 100 points',                       '💯', 'lifetime_points', 100,  0, 4),
    ('points_500',   'High Roller',    'Earn 500 points',                       '💎', 'lifetime_points', 500,  0, 5),
    ('points_1000',  'Legend',         'Earn 1,000 points',                     '👑', 'lifetime_points', 1000, 0, 6),
    ('streak_3',     'On a Roll',      'Do a chore 3 days in a row',            '🔥', 'streak_days',     3,    5, 7),
    ('streak_7',     'Unstoppable',    'Do a chore 7 days in a row',            '⚡', 'streak_days',     7,   15, 8),
    ('perfect_week', 'Perfect Week',   'Finish every chore in a week',          '⭐', 'perfect_week',    1,   10, 9),
    ('weekly_winner','Top of the Week','Earn the most points in a week',        '🥇', 'weekly_winner',   1,   10, 10);
  `,
];
