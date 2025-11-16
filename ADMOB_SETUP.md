# Google AdMob Setup Guide - Family Chores App

**Status:** Test mode only (requires production configuration)
**Last Updated:** 2025-11-16

This guide explains how to configure Google AdMob for monetization in the Family Chores App.

---

## 📋 Prerequisites

Before starting, ensure you have:
- [ ] Google Account
- [ ] Apple Developer Account (for iOS app ID)
- [ ] Google Play Developer Account (for Android package name)
- [ ] App published or ready to publish on app stores

---

## 🚀 Step 1: Create AdMob Account

1. Go to [https://admob.google.com](https://admob.google.com)
2. Sign in with your Google Account
3. Click "Get Started"
4. Accept AdMob Terms & Conditions
5. Select your country and timezone
6. Choose whether to receive AdMob updates and tips

---

## 📱 Step 2: Add Your Apps to AdMob

### For iOS:

1. In AdMob dashboard, click "Apps" → "Add App"
2. Select "iOS"
3. Choose "Yes" if app is published on App Store, or "No" if not yet published
4. If published: Enter your App Store URL
5. If not published: Enter app name
6. Click "Add"
7. **Copy the App ID** (format: `ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY`)

### For Android:

1. In AdMob dashboard, click "Apps" → "Add App"
2. Select "Android"
3. Choose "Yes" if app is published on Google Play, or "No" if not yet published
4. If published: Enter your Google Play URL
5. If not published: Enter app name and package name
6. Click "Add"
7. **Copy the App ID** (format: `ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY`)

---

## 🎯 Step 3: Create Ad Units

The Family Chores App uses **banner ads** displayed at the bottom of screens.

### Create Banner Ad Unit:

1. In AdMob, go to your app
2. Click "Ad units" tab
3. Click "Add ad unit"
4. Select "Banner"
5. Name it: "Family Chores Banner"
6. Click "Create ad unit"
7. **Copy the Ad Unit ID** (format: `ca-app-pub-XXXXXXXXXXXXXXXX/ZZZZZZZZZZ`)
8. Repeat for both iOS and Android apps

---

## ⚙️ Step 4: Configure app.json

Update `/family-chores-app/app.json` with your AdMob App IDs:

```json
{
  "expo": {
    "plugins": [
      [
        "react-native-google-mobile-ads",
        {
          "androidAppId": "ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY",
          "iosAppId": "ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY"
        }
      ]
    ]
  }
}
```

**Current values (MUST REPLACE):**
- `androidAppId`: `"ca-app-pub-xxxxxxxxxxxxxxxx~xxxxxxxxxx"` ❌
- `iosAppId`: `"ca-app-pub-xxxxxxxxxxxxxxxx~xxxxxxxxxx"` ❌

---

## 🔧 Step 5: Update Ad Unit IDs in Code

### Current Implementation (Test Mode):

File: `/family-chores-app/src/components/ads/AdView.tsx`

```typescript
import { TestIds, BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';

export const AdView: React.FC = () => {
  return (
    <BannerAd
      unitId={TestIds.BANNER}  // ❌ TEST MODE - No revenue!
      size={BannerAdSize.BANNER}
      requestOptions={{
        requestNonPersonalizedAdsOnly: true,
      }}
    />
  );
};
```

### Production Configuration:

Create environment-specific ad unit IDs:

**Option 1: Platform-specific IDs**

```typescript
import { Platform } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';

// REPLACE THESE WITH YOUR ACTUAL AD UNIT IDS
const AD_UNIT_IDS = {
  ios: 'ca-app-pub-XXXXXXXXXXXXXXXX/ZZZZZZZZZZ',
  android: 'ca-app-pub-XXXXXXXXXXXXXXXX/ZZZZZZZZZZ',
};

// Use test IDs in development, real IDs in production
const __DEV__ = process.env.NODE_ENV === 'development';

export const AdView: React.FC = () => {
  const unitId = __DEV__
    ? TestIds.BANNER
    : (Platform.OS === 'ios' ? AD_UNIT_IDS.ios : AD_UNIT_IDS.android);

  return (
    <BannerAd
      unitId={unitId}
      size={BannerAdSize.BANNER}
      requestOptions={{
        requestNonPersonalizedAdsOnly: true, // COPPA compliance
      }}
    />
  );
};
```

**Option 2: Environment Variables (Recommended)**

1. Create `.env` file (already gitignored):

```bash
ADMOB_IOS_BANNER_ID=ca-app-pub-XXXXXXXXXXXXXXXX/ZZZZZZZZZZ
ADMOB_ANDROID_BANNER_ID=ca-app-pub-XXXXXXXXXXXXXXXX/ZZZZZZZZZZ
```

2. Install env loader:

```bash
npm install react-native-dotenv --save-dev
```

3. Update `babel.config.js`:

```javascript
module.exports = {
  plugins: [
    ['module:react-native-dotenv', {
      moduleName: '@env',
      path: '.env',
    }]
  ]
};
```

4. Update `AdView.tsx`:

```typescript
import { ADMOB_IOS_BANNER_ID, ADMOB_ANDROID_BANNER_ID } from '@env';

const unitId = Platform.OS === 'ios'
  ? ADMOB_IOS_BANNER_ID
  : ADMOB_ANDROID_BANNER_ID;
```

---

## 👶 Step 6: COPPA Compliance (CRITICAL!)

**The Family Chores App targets children under 13. You MUST comply with COPPA regulations.**

### In AdMob Dashboard:

1. Go to "App settings" for each app
2. Under "App content", select:
   - ✅ "This app is directed at children under the age of 13"
3. Under "Ad content", ensure:
   - ✅ Only family-safe ads are enabled
   - ❌ Disable personalized ads
   - ❌ Disable ads based on user data

### In Code (Already Configured):

```typescript
requestOptions={{
  requestNonPersonalizedAdsOnly: true, // Required for COPPA compliance
}}
```

### Additional Steps:

- [ ] Review Google's [Families Policy](https://support.google.com/googleplay/android-developer/answer/9893335)
- [ ] Ensure privacy policy is available
- [ ] Do NOT collect personal information from users under 13
- [ ] Do NOT use persistent identifiers for children

---

## 📊 Step 7: Initialize AdMob SDK

AdMob must be initialized before showing ads. This should happen on app startup.

**File:** `/family-chores-app/App.tsx` (or app entry point)

```typescript
import mobileAds from 'react-native-google-mobile-ads';
import { useEffect } from 'react';

export default function App() {
  useEffect(() => {
    mobileAds()
      .initialize()
      .then(adapterStatuses => {
        console.log('AdMob initialized:', adapterStatuses);
      })
      .catch(error => {
        console.error('AdMob initialization failed:', error);
      });
  }, []);

  // ... rest of app
}
```

---

## 🧪 Step 8: Testing

### Test Ads (Current Setup):

The app currently uses `TestIds.BANNER` which shows Google-provided test ads. These:
- ✅ Display properly formatted ads
- ✅ Don't generate revenue
- ✅ Won't get your AdMob account banned for invalid traffic
- ❌ Don't represent actual production ad behavior

### Testing Production Ads:

**⚠️ WARNING: Never click your own live ads! This can get your AdMob account banned.**

#### Option 1: Test Devices (Recommended)

1. Get your device's advertising ID:
   - iOS: Settings → Privacy → Advertising → Copy "Advertising Identifier"
   - Android: Settings → Google → Ads → Copy "Advertising ID"

2. Configure test devices in code:

```typescript
import { AdsConsentDebugGeography } from 'react-native-google-mobile-ads';

mobileAds().setRequestConfiguration({
  testDeviceIdentifiers: [
    'YOUR-DEVICE-ID-HERE',
    'ANOTHER-DEVICE-ID',
  ],
});
```

#### Option 2: Use Test Suite App

- **iOS**: [Google Mobile Ads SDK Test Suite](https://apps.apple.com/app/google-mobile-ads-sdk-tester/id1489890889)
- **Android**: Search "Google Mobile Ads SDK Test Suite" on Play Store

---

## 💰 Step 9: Revenue Tracking

### Enable Analytics:

1. In AdMob dashboard, go to "Settings"
2. Link to Google Analytics (optional but recommended)
3. Enable "Ad network optimization"
4. Review mediation settings

### Monitor Performance:

- **Dashboard**: https://admob.google.com
- **Reports Tab**: View earnings, impressions, eCPM
- **Ad units**: Compare performance across different placements

### Expected Revenue (Estimates):

- **eCPM (Earnings per 1000 impressions)**: $0.50 - $3.00 (varies by country)
- **CTR (Click-through rate)**: 0.5% - 2%
- **Banner ads**: Lowest revenue but least intrusive

**For this app:**
- Target users: Families with children
- Ad placement: Bottom banner on dashboard/chore screens
- Estimated daily impressions: Depends on active users
- Est. monthly revenue: (Daily Active Users × Avg Sessions × Ad Impressions) × eCPM / 1000

---

## 🚨 Common Issues & Solutions

### Issue 1: "Ad failed to load: 3" (No fill)

**Causes:**
- New ad unit (wait 24-48 hours for inventory)
- Low eCPM region
- Too many ad requests
- App not published yet

**Solutions:**
- Wait for AdMob to build ad inventory
- Enable more ad networks in mediation
- Implement ad refresh properly (max every 60 seconds)

### Issue 2: Ads not showing

**Check:**
- [ ] AdMob initialized before ad request
- [ ] Correct ad unit ID (not test ID in production)
- [ ] Internet connection available
- [ ] App ID configured in app.json
- [ ] No ad blockers on test device

### Issue 3: Revenue stuck at $0

**Check:**
- [ ] Using production ad unit IDs (not TestIds.BANNER)
- [ ] Ads are actually displaying
- [ ] User location has ad inventory
- [ ] Ad impressions are being counted in AdMob dashboard

### Issue 4: Account suspended

**Reasons:**
- Clicking own ads
- Incentivizing ad clicks
- Invalid traffic
- Policy violations

**Prevention:**
- Use test devices during development
- Follow AdMob policies
- Don't encourage users to click ads
- Monitor traffic quality

---

## 📝 Pre-Launch Checklist

Before publishing with ads enabled:

- [ ] AdMob account fully approved
- [ ] iOS and Android apps added to AdMob
- [ ] Banner ad units created for both platforms
- [ ] App IDs configured in `app.json`
- [ ] Ad unit IDs updated in code (removed TestIds)
- [ ] COPPA compliance verified
- [ ] Privacy policy published and accessible
- [ ] AdMob SDK initialization added to app startup
- [ ] Test ads displaying correctly on both platforms
- [ ] Production ads tested with test devices
- [ ] Analytics/tracking configured (optional)
- [ ] Payment information added to AdMob account

---

## 🔗 Helpful Resources

- [AdMob Help Center](https://support.google.com/admob)
- [react-native-google-mobile-ads Docs](https://docs.page/invertase/react-native-google-mobile-ads)
- [AdMob Policy Center](https://support.google.com/admob/answer/6128543)
- [COPPA Compliance Guide](https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions)
- [Families Policy](https://support.google.com/googleplay/android-developer/answer/9893335)

---

## 📧 Support

For AdMob account issues: https://support.google.com/admob/gethelp

For react-native-google-mobile-ads issues: https://github.com/invertase/react-native-google-mobile-ads/issues

---

**Next Steps After Setup:**

1. Test thoroughly with test devices
2. Monitor first week of impressions closely
3. Adjust ad placement if user complaints
4. Consider adding interstitial or rewarded ads later
5. Review revenue reports weekly

**Estimated Setup Time:** 1-2 hours (excluding AdMob approval wait time)

---

**Status:** Ready for production configuration ✅
**Current Mode:** Test ads only (no revenue) ⚠️
