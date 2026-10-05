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

**Family devices (home Wi-Fi sync, Android)**
- The device that ran setup is the family's **main device** (a parent's phone or a kitchen tablet)
- Parent area → Family devices → Add a device shows a one-time 6-digit code (expires in 10 min,
  locks after 5 wrong tries). On the other phone: Join my family → it finds the main device on the
  Wi-Fi (or type the address shown) → enter code → choose whose device it is
- A kid's phone shows only that kid and can only tick off that kid's chores (enforced on the main
  device); a "whole family" device shows everyone
- Taps on a kid's phone show instantly (confetti included), are saved on the phone, and sync when
  both devices are home. A chore done on time still counts if it syncs the next day
- Parent tools stay on the main device. Parents can remove any device

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
npm test                  # 40 integration tests (incl. hub ↔ phone sync) on real SQLite
npm run typecheck
npm run lint
npx expo-doctor
```

> On this machine port 8081 is used by another service. If the app shows "Unable to load script",
> start Metro on another port (`npx expo start --port 8090`) and run
> `adb reverse tcp:8081 tcp:8090`.

## How sync works

No server and no accounts. The main device runs a tiny HTTP server on the home network
(port 47821) and announces itself with mDNS (`_familychores._tcp`). Other devices:

1. pair once with the 6-digit code and get a device token (only its hash is stored on the main device);
2. every 30 s while open, on app focus, and right after a tap, send queued actions
   (`complete` / `undo` / `skip`, each with a unique id and the time it happened) and receive the
   family data if it changed (a trigger-maintained version number avoids re-sending);
3. replace their local copy with the main device's data, then replay anything still unsent.

The main device applies each action through the same services its own screens use, exactly once.
The parent PIN never leaves the main device. Traffic is plain HTTP on the home network; the
device token is the protection, the same trust level as a printer or a Chromecast.

Code: `src/sync/` (protocol, hub, member, snapshot), `src/state/SyncContext.tsx`, and the native
Android module in `modules/lan-sync/` (HTTP server, mDNS, the background keep-alive service).

**Android limits to know:** after the main device's app is closed, a foreground service (with a
notification) keeps it reachable. Android 15+ allows that about 6 hours a day, reset each time the
app is opened, and deep sleep (Doze) can still pause it overnight. Kids' phones keep their taps
and sync next time. A plugged-in kitchen tablet as the main device is the most reliable setup.

**iOS:** not implemented yet (`modules/lan-sync` is Android-only; the Devices/Join screens say so).

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
  sync/              Home-Wi-Fi sync between the main device and family devices
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
6. **Foreground service declaration**: Play Console → App content → Foreground service
   permissions: declare `dataSync` ("keeps the family's main device reachable so kids' phones on
   the home Wi-Fi can sync chores"). Google may ask for a short video of the feature.
7. **Test sync on two real Android phones on a real home router.** It's verified on two emulators
   (pairing, kid taps, offline queue, background); automatic discovery (mDNS) could not be tested
   between emulators and needs a real network.
8. **Build & submit** with EAS: `npx eas-cli@latest build -p android` then `eas submit`.

## Known limits (v1)

- One family per device. Devices sync only on the same home Wi-Fi (no cloud). Android only.
- Parent tools only on the main device; the main device can't be moved to another phone yet.
- Avatars are emoji + colour (the old avataaars-based picker was not carried over).
- No push reminders yet.
