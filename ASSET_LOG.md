# Asset Log

This document outlines all the graphical and audio assets required for the Family Chores App. Providing these assets will ensure the application has a complete and polished user experience.

## 1. Graphics & Images

All image assets should be placed in the appropriate sub-directory within `family-chores-app/assets/images/`.

### 1.1. App Icons
These are the standard icons for the application itself.
- **Location:** `family-chores-app/assets/images/`
- **Files:**
  - `icon.png`: The main app icon. (Recommended: 1024x1024 px)
  - `adaptive-icon.png`: The adaptive icon for Android. (Foreground layer, 1024x1024 px)
  - `splash-icon.png`: The icon used for the splash screen. (Recommended: 1200x1200 px)
  - `favicon.png`: The icon for the browser tab if used on the web. (Recommended: 32x32 px)

### 1.2. User Avatars
Customizable images for each user profile.
- **Purpose:** To give each user a unique visual identity in the app.
- **Location:** `family-chores-app/assets/images/avatars/`
- **Format:** PNG or JPG
- **Dimensions:** Recommended 512x512 px.
- **Naming Convention:** `[username].png` (e.g., `john.png`, `sara.png`) or `user_[id].png`.
- **Note:** You will need a default avatar (`default.png`) for users who haven't selected one.

### 1.3. Badge Icons
Unique icons for each achievement or badge that can be earned.
- **Purpose:** To visually represent accomplishments in the gamification system.
- **Location:** `family-chores-app/assets/images/badges/`
- **Format:** SVG (recommended for scalability) or PNG (with transparent background).
- **Dimensions:** Recommended 256x256 px.
- **Naming Convention:** The `iconPath` property of a Badge will point to this file. A consistent naming scheme is best (e.g., `streak_5_days.svg`, `perfect_week.svg`).

### 1.4. Chore Icons
Visual representations for different types of chores.
- **Purpose:** To make chores easily identifiable at a glance.
- **Location:** `family-chores-app/assets/images/chores/`
- **Format:** SVG (recommended) or PNG.
- **Dimensions:** Recommended 128x128 px.
- **Naming Convention:** The `iconName` property of a Chore will reference this file. (e.g., `dishes.svg`, `trash.svg`, `laundry.svg`).

### 1.5. Celebration & Animation Assets
Graphics used in celebratory animations, like when a user earns a badge or levels up.
- **Purpose:** To enhance the user experience with rewarding visual feedback.
- **Location:** `family-chores-app/assets/images/animations/`
- **Examples:**
  - `confetti.png`
  - `star_particle.png`
  - `sparkle.png`
- **Format:** PNG (often small and numerous for particle effects).

---

## 2. Sound Effects

All audio assets should be placed in `family-chores-app/assets/sounds/`.

### 2.1. UI Interaction Sounds
Subtle sounds for common user interactions.
- **Purpose:** To provide auditory feedback for actions.
- **Location:** `family-chores-app/assets/sounds/ui/`
- **Format:** MP3 or WAV.
- **Examples:**
  - `button_click.mp3`: A generic click sound for buttons.
  - `toggle_switch.mp3`: Sound for a switch or checkbox.
  - `swoosh.mp3`: For screen transitions or panel expansions.

### 2.2. Notification Sounds
Sounds for alerts and notifications.
- **Purpose:** To draw the user's attention to important events.
- **Location:** `family-chores-app/assets/sounds/notifications/`
- **Format:** MP3 or WAV.
- **Examples:**
  - `new_assignment.mp3`: When new chores are assigned.
  - `reminder.mp3`: For chore reminders.

### 2.3. Reward & Celebration Sounds
Exciting sounds for positive reinforcement in the gamification system.
- **Purpose:** To make earning rewards feel satisfying.
- **Location:** `family-chores-app/assets/sounds/rewards/`
- **Format:** MP3 or WAV.
- **Examples:**
  - `chore_complete.mp3`: A short, satisfying sound for completing a chore.
  - `badge_unlocked.mp3`: A more elaborate sound for earning a badge.
  - `points_counter.mp3`: A sound of points ticking up.
  - `level_up.mp3`: A celebratory sound for reaching a new level or milestone.

### 2.4. Negative Feedback Sounds
Sounds for errors or invalid actions.
- **Purpose:** To alert the user when an action cannot be completed.
- **Location:** `family-chores-app/assets/sounds/feedback/`
- **Format:** MP3 or WAV.
- **Examples:**
  - `error.mp3`: A generic error sound.
  - `buyout_failed.mp3`: Specifically for when a user has insufficient points for a buyout.