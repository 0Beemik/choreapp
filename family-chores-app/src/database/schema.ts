export const CREATE_TABLES_SQL = `
  CREATE TABLE IF NOT EXISTS families (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    settings_points_per_chore INTEGER DEFAULT 10,
    settings_buyout_cost_percentage INTEGER DEFAULT 20,
    settings_max_buyouts_per_month INTEGER DEFAULT 4,
    settings_rotation_day TEXT DEFAULT 'sunday'
  );

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY NOT NULL,
    family_id TEXT NOT NULL,
    name TEXT NOT NULL,
    avatar_path TEXT,
    age INTEGER NOT NULL,
    role TEXT CHECK(role IN ('parent', 'child')) NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE,
    allowance_rate DECIMAL(5,2) DEFAULT 0.00,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    preferences_notifications BOOLEAN DEFAULT TRUE,
    preferences_sound_effects BOOLEAN DEFAULT TRUE,
    preferences_interface_mode TEXT DEFAULT 'auto',
    FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS chores (
    id TEXT PRIMARY KEY NOT NULL,
    family_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    icon_name TEXT,
    category TEXT,
    estimated_minutes INTEGER DEFAULT 15,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS chore_assignments (
    id TEXT PRIMARY KEY NOT NULL,
    chore_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    assignment_type TEXT CHECK(assignment_type IN ('permanent', 'weekly', 'daily', 'monthly')) DEFAULT 'weekly',
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    status TEXT CHECK(status IN ('pending', 'completed', 'bought_out', 'overridden')) DEFAULT 'pending',
    completed_at DATETIME,
    points_awarded INTEGER DEFAULT 0,
    bought_out_at DATETIME,
    points_spent INTEGER DEFAULT 0,
    override_reason TEXT,
    overridden_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chore_id) REFERENCES chores(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS point_transactions (
    id TEXT PRIMARY KEY NOT NULL,
    user_id TEXT NOT NULL,
    assignment_id TEXT,
    transaction_type TEXT CHECK(transaction_type IN ('earned', 'deducted', 'spent', 'bonus', 'override')) NOT NULL,
    amount INTEGER NOT NULL,
    reason TEXT NOT NULL,
    badge_earned TEXT,
    leaderboard_position INTEGER,
    admin_override BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (assignment_id) REFERENCES chore_assignments(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS leaderboards (
    id TEXT PRIMARY KEY NOT NULL,
    family_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    period_type TEXT CHECK(period_type IN ('weekly', 'monthly', 'seasonal', 'yearly')) NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    total_points INTEGER DEFAULT 0,
    chore_count INTEGER DEFAULT 0,
    position INTEGER NOT NULL,
    badges_earned TEXT,
    bonus_points INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS badges (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    icon_name TEXT NOT NULL,
    criteria_type TEXT NOT NULL,
    criteria_value INTEGER NOT NULL,
    bonus_points INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE
  );

  CREATE TABLE IF NOT EXISTS user_badges (
    id TEXT PRIMARY KEY NOT NULL,
    user_id TEXT NOT NULL,
    badge_id TEXT NOT NULL,
    earned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    period_start DATE,
    period_end DATE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (badge_id) REFERENCES badges(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS ad_impressions (
    id TEXT PRIMARY KEY NOT NULL,
    ad_campaign_id TEXT NOT NULL,
    displayed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    family_id TEXT NOT NULL,
    display_duration_seconds INTEGER,
    clicked BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE
  );
`;
