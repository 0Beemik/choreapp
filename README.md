# Family Chores

A chore chart for the whole family. Parents set it up once; kids tap their chores off on a shared
phone or tablet, earn points and badges, and chores rotate between kids every week. Free, paid for
by ads. All data stays on the device (no accounts, no servers).

## What it does

**Kids (no PIN needed)**
- Chore board: today's daily chores plus this week's weekly chores, one card per kid
- Tap to complete → points, confetti, new badges; tap again to undo a mistake
- Skip a chore by spending points (cost and monthly limit set by parents)
- Kids 6 and under get a bigger, picture-first layout (no skip button)
- Leaderboard (week / month / all time) and a profile with badges, streak, allowance, history

**Parents (4-digit PIN, auto-locks after 15 min or on leaving)**
- This week: mark done, excuse (sick day), move a chore to another kid, undo
- Chores: add/edit/delete; daily or weekly; rotate weekly between kids or always the same kid; custom points
- Family: add/edit/remove kids and parents, avatars, weekly allowance per kid
- Points: give/take points with a reason, full history, allowance earned this week
- Settings: points per chore, missed-chore penalty, skip cost and limit, week start day,
  vacation mode, change PIN, erase everything

**Automatic**
- New week on the family's chosen day: chores re-dealt, rotating between kids
- Undone chores become "missed" at the end of their day/week and cost a small penalty
  (never during vacation)
- 10 badges: first chore, 25/100 chores, 100/500/1000 points, 3/7-day streaks, perfect week, top of the week

## Ads

| Placement | Format | When |
|---|---|---|
| Board, leaderboard, kid profile | Anchored adaptive banner | Always (collapses if nothing fills) |
| Leaving the parent area | Full-screen interstitial (video-capable) | At most every 5 min, never in the first minute of a session, never during a kid's chore flow |
| Parent area "Daily family bonus" | Rewarded video (opt-in) | Once a day; every kid gets +5 points |

Kids use this app, so it falls under **Google Play's Families policy and COPPA**. Every request is
tagged child-directed and under-age-of-consent, capped at G-rated, non-personalized, with contextual
keywords (family, household, cleaning, home, parenting). See `src/ads/config.ts`. Don't change
`CHILD_DIRECTED` without legal advice. Consent (Google UMP) is gathered before the SDK starts.

## Running it

Requires Node 20+, JDK 17, Android SDK (or Xcode for iOS). Ads are a native module, so this does
**not** run in Expo Go; it needs a development build.

```bash
npm install
npx expo run:android      # builds, installs and starts the app (first build ~5 min)
npx expo run:ios          # macOS only
```

Checks:

```bash
npm test                  # 25 integration tests against a real SQLite engine
npm run typecheck
npm run lint
npx expo-doctor
```

> On this machine port 8081 is used by another service. If the app shows "Unable to load script",
> start Metro on another port (`npx expo start --port 8090`) and run
> `adb reverse tcp:8081 tcp:8090`.

## Code map

```
app/                 Screens (Expo Router: every file is a route)
  setup.tsx          First-run wizard
  board.tsx          Kids' chore board (home)
  kid/[id].tsx       Kid profile
  leaderboard.tsx
  parent/            PIN-gated parent area (_layout.tsx is the gate)
src/
  services/          All product rules (rotation, badges, buyouts, allowance…)
  repositories/      SQL, one file per table
  database/          Connection + schema migrations (PRAGMA user_version)
  state/AppContext   Loads data for screens, parent session
  ads/               AdMob setup, pacing, banner
  ui/                Shared components and theme
  lib/               Local-calendar date math, presets, crypto
```

Schema changes: append a new string to `MIGRATIONS` in `src/database/schema.ts`. Never edit a
shipped one.

## Before publishing: checklist

1. **AdMob account**: create the app in AdMob for Android and iOS, then put the real IDs in
   `app.json`:
   - App IDs: `plugins → react-native-google-mobile-ads → androidAppId / iosAppId` **and** the
     top-level `"react-native-google-mobile-ads"` block (the library's Android build reads both;
     leaving the second one out breaks the Android build).
   - Ad unit IDs: `expo.extra.adUnits.android|ios.{banner, interstitial, rewarded}`.
     Until these are set, release builds show Google test ads and earn nothing.
   - In AdMob, mark the app as directed at children / mixed audience and enable only
     Families-certified ad sources.
2. **Privacy policy URL** (required by both stores for apps with ads and kids).
3. **Play Console**: target audience includes under-13 → complete the Families questionnaire and
   Data safety form (data stays on device; the ads SDK collects device identifiers).
4. **App icon/branding**: `assets/images/*` are simple generated placeholders; replace with final art.
5. **Store listing**: screenshots, description, content rating questionnaire.
6. **Build & submit** with EAS: `npx eas-cli@latest build -p android` then `eas submit`.

## Known limits (v1)

- One family per device; no sync between phones (everything is local).
- Avatars are emoji + colour (the old avataaars-based picker was not carried over).
- No push reminders yet.
