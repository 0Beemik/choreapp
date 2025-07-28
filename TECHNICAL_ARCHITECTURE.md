# TECHNICAL_ARCHITECTURE.md

## System Overview

### Architecture Pattern
**Standalone Local Application** with optional cloud backup
- Local-first data storage with SQLite
- No internet connectivity required for core functionality
- Optional cloud sync for data backup and device migration
- Offline-only operation with rich local advertisements

### Technology Stack

#### Frontend (Mobile Application)
- **Framework:** React Native with Expo
- **State Management:** Redux Toolkit for app state
- **Navigation:** React Navigation v6
- **UI Components:** React Native Elements + Custom Components
- **Styling:** Styled Components with responsive design
- **Animations:** React Native Reanimated v3
- **Local Database:** SQLite with react-native-sqlite-storage
- **Data Persistence:** SQLite with automatic migrations

#### Cloud Sync (Optional)
- **iOS:** iCloud Documents API for seamless backup
- **Android:** Google Drive API for data backup
- **Format:** JSON export/import for cross-platform compatibility
- **Conflict Resolution:** Timestamp-based with user confirmation

#### Advertisement System
- **Ad Content:** Pre-packaged rich media ads bundled with app updates
- **Categories:** Family products, cleaning supplies, school supplies, clothing
- **Rotation:** Time-based and context-aware ad display
- **Analytics:** Local tracking with periodic aggregated reporting
- **Content Updates:** New ad content delivered through app store updates

#### Platform Optimization
- **Kitchen Tablet:** Optimized for always-on display and family use
- **Power Management:** Efficient battery usage for continuous operation
- **Touch Targets:** Large, family-friendly interface elements
- **Multi-User:** Simultaneous family member interactions

## Data Architecture

### Local SQLite Schema

#### Core Data Models

```sql
-- Family table
CREATE TABLE families (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    settings_points_per_chore INTEGER DEFAULT 10,
    settings_buyout_cost_percentage INTEGER DEFAULT 20,
    settings_max_buyouts_per_month INTEGER DEFAULT 4,
    settings_rotation_day TEXT DEFAULT 'sunday'
);

-- Users table
CREATE TABLE users (
    id TEXT PRIMARY KEY,
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
    FOREIGN KEY (family_id) REFERENCES families(id)
);

-- Chores table
CREATE TABLE chores (
    id TEXT PRIMARY KEY,
    family_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    icon_name TEXT,
    category TEXT,
    estimated_minutes INTEGER DEFAULT 15,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (family_id) REFERENCES families(id)
);

-- Chore assignments table
CREATE TABLE chore_assignments (
    id TEXT PRIMARY KEY,
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
    FOREIGN KEY (chore_id) REFERENCES chores(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Point transactions table
CREATE TABLE point_transactions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    assignment_id TEXT,
    transaction_type TEXT CHECK(transaction_type IN ('earned', 'deducted', 'spent', 'bonus', 'override')) NOT NULL,
    amount INTEGER NOT NULL,
    reason TEXT NOT NULL,
    badge_earned TEXT,
    leaderboard_position INTEGER,
    admin_override BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (assignment_id) REFERENCES chore_assignments(id)
);

-- Leaderboards table
CREATE TABLE leaderboards (
    id TEXT PRIMARY KEY,
    family_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    period_type TEXT CHECK(period_type IN ('weekly', 'monthly', 'seasonal', 'yearly')) NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    total_points INTEGER DEFAULT 0,
    chore_count INTEGER DEFAULT 0,
    position INTEGER NOT NULL,
    badges_earned TEXT, -- JSON array of badge names
    bonus_points INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (family_id) REFERENCES families(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Badges table
CREATE TABLE badges (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    icon_name TEXT NOT NULL,
    criteria_type TEXT NOT NULL, -- 'completion_streak', 'perfect_week', 'points_milestone'
    criteria_value INTEGER NOT NULL,
    bonus_points INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE
);

-- User badges table (earned badges)
CREATE TABLE user_badges (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    badge_id TEXT NOT NULL,
    earned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    period_start DATE,
    period_end DATE,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (badge_id) REFERENCES badges(id)
);

-- Advertisement tracking table
CREATE TABLE ad_impressions (
    id TEXT PRIMARY KEY,
    ad_campaign_id TEXT NOT NULL,
    displayed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    family_id TEXT NOT NULL,
    display_duration_seconds INTEGER,
    clicked BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (family_id) REFERENCES families(id)
);
```

### Database Indexes for Performance

```sql
-- Performance indexes
CREATE INDEX idx_users_family_id ON users(family_id);
CREATE INDEX idx_chores_family_id ON chores(family_id);
CREATE INDEX idx_assignments_user_period ON chore_assignments(user_id, period_start, period_end);
CREATE INDEX idx_assignments_status ON chore_assignments(status);
CREATE INDEX idx_points_user_date ON point_transactions(user_id, created_at);
CREATE INDEX idx_leaderboards_family_period ON leaderboards(family_id, period_type, period_start);
CREATE INDEX idx_user_badges_user_id ON user_badges(user_id);
```

## Application Architecture

### State Management Structure

```typescript
interface AppState {
  family: {
    current: Family | null;
    members: User[];
    settings: FamilySettings;
  };
  chores: {
    available: Chore[];
    assignments: ChoreAssignment[];
    currentWeek: Date;
  };
  points: {
    transactions: PointTransaction[];
    userTotals: Record<string, number>;
    leaderboard: LeaderboardEntry[];
  };
  ui: {
    expandedUser: string | null;
    adminModalOpen: boolean;
    selectedPeriod: 'weekly' | 'monthly' | 'seasonal' | 'yearly';
    blurBackground: boolean;
  };
  sync: {
    lastBackup: Date | null;
    pendingSync: boolean;
    syncEnabled: boolean;
  };
  ads: {
    currentCampaign: AdCampaign | null;
    displayStartTime: Date | null;
    impressionCount: number;
  };
}
```

### Core Business Logic

#### Chore Assignment Engine
```typescript
class ChoreAssignmentEngine {
  // Generate weekly assignments based on rotation rules
  generateWeeklyAssignments(familyId: string, weekStart: Date): ChoreAssignment[];
  
  // Handle chore rotation logic
  rotateChores(familyId: string, rotationType: 'weekly' | 'daily' | 'monthly'): void;
  
  // Calculate buyout eligibility and cost
  calculateBuyoutCost(userId: string, choreId: string): number | null;
  
  // Process chore completion and award points
  completeChore(assignmentId: string): PointTransaction;
}
```

#### Points & Allowance Calculator
```typescript
class PointsCalculator {
  // Calculate current point totals for user
  getUserCurrentPoints(userId: string): number;
  
  // Generate leaderboard for specified period
  generateLeaderboard(familyId: string, period: LeaderboardPeriod): LeaderboardEntry[];
  
  // Calculate allowance based on points and rate
  calculateAllowance(userId: string, periodStart: Date, periodEnd: Date): number;
  
  // Check and award badges
  checkBadgeEligibility(userId: string): Badge[];
}
```

#### Age-Adaptive Interface Controller
```typescript
class InterfaceController {
  // Determine interface mode based on user age
  getInterfaceModeForAge(age: number): 'simple' | 'standard' | 'advanced';
  
  // Generate age-appropriate chore display
  getChoreDisplayForUser(chore: Chore, userAge: number): ChoreDisplay;
  
  // Calculate optimal touch target sizes
  getTouchTargetSize(userAge: number): number;
}
```

## Cloud Sync Architecture

### Backup Data Structure
```json
{
  "version": "1.0",
  "exported_at": "2025-01-15T10:30:00Z",
  "family": {
    "id": "family_123",
    "name": "The Smith Family",
    "settings": { ... }
  },
  "users": [ ... ],
  "chores": [ ... ],
  "assignments": [ ... ],
  "points": [ ... ],
  "leaderboards": [ ... ],
  "badges": [ ... ]
}
```

### Sync Implementation
- **Export:** Full family data export to JSON format
- **Cloud Storage:** Platform-specific APIs (iCloud/Google Drive)
- **Import:** Restore from backup with conflict resolution
- **Migration:** Automatic schema updates during import
- **Verification:** Data integrity checks post-restore

## Advertisement System

### Ad Content Structure
```typescript
interface AdCampaign {
  id: string;
  name: string;
  category: 'cleaning' | 'school' | 'clothing' | 'family_activities';
  content: {
    imageUrl: string;
    videoUrl?: string;
    title: string;
    description: string;
    callToAction: string;
    targetUrl?: string;
  };
  targeting: {
    seasonality: string[]; // 'back_to_school', 'spring_cleaning'
    familySize: { min: number; max: number };
    ageRanges: number[];
  };
  schedule: {
    startDate: Date;
    endDate: Date;
    rotationMinutes: number;
  };
  metrics: {
    impressions: number;
    clicks: number;
    displayTime: number;
  };
}
```

### Ad Display Logic
- **Rotation:** Time-based rotation in family information section
- **Targeting:** Basic demographic targeting (family size, child ages)
- **Frequency:** Balanced display to avoid ad fatigue
- **Analytics:** Local impression and engagement tracking
- **Content Updates:** New campaigns delivered via app updates

## Data Lifecycle Management

### Automatic Data Cleanup
```typescript
class DataLifecycleManager {
  // Remove data older than 1 year
  cleanupOldData(): void {
    const cutoffDate = new Date();
    cutoffDate.setFullYear(cutoffDate.getFullYear() - 1);
    
    // Archive old assignments, points, leaderboards
    this.archiveOldAssignments(cutoffDate);
    this.cleanupOldPointTransactions(cutoffDate);
    this.removeOldLeaderboards(cutoffDate);
  }
  
  // Optimize database performance
  optimizeDatabase(): void {
    // VACUUM SQLite database
    // Rebuild indexes
    // Analyze query performance
  }
  
  // Generate storage usage report
  getStorageUsage(): StorageReport;
}
```

### Database Migration System
```typescript
interface Migration {
  version: number;
  description: string;
  up: (db: SQLiteDatabase) => Promise<void>;
  down: (db: SQLiteDatabase) => Promise<void>;
}

class MigrationManager {
  private migrations: Migration[] = [
    {
      version: 1,
      description: "Initial schema",
      up: async (db) => { /* Create initial tables */ },
      down: async (db) => { /* Drop tables */ }
    },
    {
      version: 2,
      description: "Add badge system",
      up: async (db) => { /* Add badge tables */ },
      down: async (db) => { /* Remove badge tables */ }
    }
  ];
  
  async migrate(db: SQLiteDatabase): Promise<void> {
    const currentVersion = await this.getCurrentVersion(db);
    const targetVersion = this.migrations.length;
    
    for (let i = currentVersion; i < targetVersion; i++) {
      await this.migrations[i].up(db);
    }
  }
}
```

## Performance Optimization

### Database Performance
- **Connection Management:** Single persistent connection
- **Query Optimization:** Prepared statements for frequent queries
- **Batch Operations:** Bulk inserts for initial data setup
- **Index Strategy:** Strategic indexes for common query patterns
- **Cache Strategy:** In-memory caching for current week data

### UI Performance
- **Lazy Loading:** Deferred loading of historical data
- **Virtual Lists:** Efficient rendering of large chore lists
- **Image Optimization:** Compressed avatars and icons
- **Animation Performance:** Native driver for smooth animations
- **Memory Management:** Proper cleanup of unused components

### Storage Optimization
- **Data Compression:** JSON compression for large datasets
- **Image Formats:** WebP with PNG fallbacks
- **Asset Bundling:** Efficient packaging of static assets
- **Cache Management:** Automatic cleanup of temporary files

## Security & Privacy

### Local Data Protection
- **SQLite Encryption:** Database encryption at rest (optional)
- **File System:** Secure app sandbox storage
- **Backup Encryption:** Encrypted cloud backups
- **Access Control:** Optional PIN protection for admin functions

### Privacy Compliance
- **No Data Collection:** Zero personal data transmitted
- **Local Analytics:** Aggregated usage statistics only
- **Child Privacy:** COPPA-compliant design
- **Parental Control:** Full admin override capabilities

### App Security
- **Code Obfuscation:** Protection against reverse engineering
- **Certificate Pinning:** Secure ad content delivery
- **Integrity Checks:** App signature verification
- **Safe Browsing:** Curated ad content only

## Testing Strategy

### Unit Testing
- **Business Logic:** Point calculations, chore assignments
- **Data Layer:** SQLite operations and migrations
- **State Management:** Redux store operations
- **Utilities:** Helper functions and algorithms

### Integration Testing
- **Database Operations:** Full CRUD operation tests
- **Cloud Sync:** Backup and restore functionality
- **Ad System:** Campaign rotation and tracking
- **Migration:** Database schema evolution

### UI Testing
- **Age Interfaces:** Different age group interactions
- **Responsive Design:** Various screen sizes and orientations
- **Accessibility:** Touch target sizes and contrast
- **Performance:** Animation smoothness and responsiveness

### Family Testing
- **Real Family Usage:** Beta testing with actual families
- **Multi-User Scenarios:** Concurrent family member usage
- **Edge Cases:** Large families, data corruption scenarios
- **Usability:** Age-appropriate interface validation

## Deployment & Distribution

### App Store Optimization
- **Metadata:** Family-friendly descriptions and keywords
- **Screenshots:** Age-diverse family usage scenarios
- **Privacy Labels:** Clear data usage declarations
- **Age Ratings:** Appropriate content ratings

### Release Management
- **Version Control:** Semantic versioning for updates
- **Staged Rollout:** Gradual deployment to detect issues
- **Rollback Strategy:** Quick revert capability
- **Update Notifications:** In-app update prompts

### Platform Considerations
- **iOS:** App Store guidelines for family apps
- **Android:** Google Play family policy compliance
- **Tablet Optimization:** Kitchen display optimization
- **Accessibility:** Platform accessibility standards

## Monitoring & Analytics

### App Performance Monitoring
- **Crash Reporting:** Anonymous crash data collection
- **Performance Metrics:** App launch time, memory usage
- **Database Performance:** Query execution times
- **User Experience:** Interface responsiveness metrics

### Business Intelligence
- **Usage Patterns:** Feature adoption and engagement
- **Family Demographics:** Anonymous family composition data
- **Chore Completion Rates:** App effectiveness metrics
- **Ad Performance:** Campaign effectiveness measurement

### Operational Metrics
- **App Store Performance:** Download and rating trends
- **Technical Health:** Error rates and performance degradation
- **User Feedback:** Review analysis and feature requests
- **Market Analysis:** Competitive positioning data
