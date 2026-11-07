# Family Chores: handoff (written 2026-11-06)

Read this first when coming back to the project. It says where everything is, what's done, and
what's next. (Claude: also read the memory files. They hold the same facts plus working rules.)

## Where things stand

- **Play Store:** the app is created in Play Console as `com.beemik.familychores`. Version 1.2.0
  (versionCode 1) has been uploaded. The store listing assets are made.
  **Waiting on: 12+ testers in a closed test for 14 days.** After that, apply for production access.
- **beemik.com:** live on Cloudflare (Worker `beemik-com`, repo `0Beemik/beemik.com`, branch `main`).
  Pushing to `main` deploys automatically.
- **Code:** version 1.2 (coins, marketplace, notifications, countertop mode and the new package
  name) is on branch `feature/coins-market`. It is still **uncommitted**: about 50 changed or new
  files, and only this machine has a copy. The uploaded AAB was built from this code.
  → **First thing to do:** if family testing went fine, commit it (Brent's call) so it's backed up.

## Where the files are

| What | Where |
|---|---|
| App code | `~/Documents/Projects/choreapp` (Expo SDK 57, React Native; `android/` is generated, gitignored) |
| Release files | `~/Documents/Projects/choreapp/releases/` (inside the project, gitignored) |
| ├ AAB uploaded to Play | `FamilyChores-1.2.0-vc1.aab` |
| ├ Store listing | `store-listing/listing-text.md`, `app-icon-512.png`, `feature-graphic-1024x500.png`, `screenshots/` (phone ×6, 7" ×4, 10" ×4, Chromebook ×4) |
| └ Promo video | `video/FamilyChores-GooglePlay-promo-v2.mp4` (no "coming soon" pill) + `promo-CREDITS.txt` (music credit must go in the YouTube description) |
| Upload key | `~/.android-keys/familychores-upload.jks`, alias `upload`; passwords in `~/.gradle/gradle.properties` (`FAMILYCHORES_UPLOAD_*`). **Back these up.** Losing them means asking Play support for a key reset. |
| Studio site | `~/Documents/Projects/beemik.com` (Astro). Brand kit in `brand/` |

## Key URLs and IDs

- Privacy policy: https://beemik.com/familychores/privacy/
- Support page: https://beemik.com/familychores/support/
- Developer website: https://beemik.com
- app-ads.txt: https://beemik.com/app-ads.txt (`google.com, pub-4594870786304846, DIRECT, f08c47fec0942fa0`)
- Contact email: support@beemik.com
- AdMob app ID: `ca-app-pub-4594870786304846~6565493984` (ad unit IDs are in `app.json` → `extra.adUnits`)
- Old GitHub Pages (`0beemik.github.io`, choreapp `site` branch) only redirect to beemik.com now.

## Checklist: confirm each item, since some may have been done without being noted

Play Console:
- [ ] App content → Privacy policy = `https://beemik.com/familychores/privacy/`
- [ ] Store settings → Website = `https://beemik.com`, email = `support@beemik.com`
- [ ] Foreground service declaration: **Network processing → Other**, with description + demo video link
- [ ] Data safety form (no data collected off-device. AdMob collects device and usage data for ads)
- [ ] Advertising ID declaration = **No** (AD_ID permission is removed)
- [ ] Target audience / Families policy, content rating questionnaire
- [ ] Store listing: text, icon, feature graphic, screenshots, YouTube URL
- [ ] Closed test track: tester list (a Google Group is easiest), opt-in link sent, 12+ opted in
- [ ] 14-day clock started on: ____________

Other:
- [ ] Cloudflare Email Routing for support@beemik.com set up and tested
- [ ] Promo v2 uploaded to YouTube (Public or Unlisted, music credit in description)
- [ ] AdMob: link the app to its Play listing once it's published
- [ ] After Play shows beemik.com as the website: delete `app-ads.txt` from the `0Beemik.github.io` repo
- [ ] Upload key + passwords backed up somewhere off this machine

## How to do things

- **New Play upload:** bump `expo.android.versionCode` in `app.json` →
  `npx expo prebuild --platform android` (only if native config changed) →
  `cd android && ./gradlew bundleRelease` → `android/app/build/outputs/bundle/release/app-release.aab`.
  Copy it into `releases/` with the version in the name.
- **Sideload test APK:** `cd android && ./gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a,armeabi-v7a`.
  Then commit the APK to the orphan `test-builds` branch. Phones download it from
  https://github.com/0Beemik/choreapp/raw/test-builds/choreapp-lan-sync-test.apk
  ⚠️ The APK sitting in `android/app/build/outputs/apk/release/` right now is a *debuggable x86_64
  screenshot build*. Don't ship it. Rebuild first.
- **Tests:** `npx jest`.
- **Emulators:** `Medium_Phone_API_36.0`, `Kid_Phone` (`~/Android/Sdk/emulator/emulator -avd …`).
  Tablet screenshots were made by changing the phone emulator with `adb shell wm size/density`.

## After launch (roadmap)

1. Production release once the 14-day test passes.
2. YouTube channel videos and shorts.
3. Family Chores 1.3: customizable avatars (outfits bought with coins, family home scene).
4. Other beemik.com projects: Grumps!, Better Flip (needs a new name), Elevator Games rework, CareerDNA app icon.
5. iOS later: needs a Swift port of `modules/lan-sync`.
6. Housekeeping: PR from `feature/lan-sync` (commit e506528) into `main` is still open.
