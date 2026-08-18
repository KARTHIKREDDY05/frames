# Play Store Release

Frames is prepared for Android release through Expo EAS.

Current official Expo guidance says Google Play submissions need a Google Play Developer account, an app created in Play Console, a package name in app config, EAS CLI auth, and a Google Service Account key for automated submission. Google Play releases use Android App Bundles (`.aab`) for new apps.

## Package Identity

- App name: `Frames`
- Android package: `app.frames.mobile`
- Version: `1.0.0`
- Version code: `1`

## Preview APK

Use this first when you want a downloadable Android app file to send to testers before official release.

```bash
cd apps/mobile
eas login
eas init
pnpm build:apk
```

The preview profile creates an Android APK.

## Production Build

```bash
cd apps/mobile
pnpm build:aab
```

The production profile creates an Android App Bundle.

## Submit

Create the app in Google Play Console first, then upload a Google Service Account key to EAS credentials.

```bash
cd apps/mobile
eas credentials --platform android
eas submit --platform android --profile production
```

The current `eas.json` submits to the internal testing track as a draft.

## Required Store Assets

- App icon: `apps/mobile/assets/icon.png`
- Adaptive icon: `apps/mobile/assets/adaptive-icon.png`
- Splash image: `apps/mobile/assets/splash.png`
- Short description: `apps/mobile/store-listing/android/en-US/short-description.txt`
- Full description: `apps/mobile/store-listing/android/en-US/full-description.txt`
- Privacy policy URL
- Phone screenshots
- Feature graphic
- Data Safety form
- Target audience declaration

## Backend Requirement

The current mobile build talks directly to Supabase for Auth, profile, search, and follow data:

```text
EXPO_PUBLIC_SUPABASE_URL=https://fjhfmxpuyijwinvmqsch.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable-key>
```

Do not ship Play Store builds with `LOCAL_JSON_DB=true`, placeholder API URLs, or disabled provider buttons shown as active OAuth options. Apple login is intentionally disabled for now; use Google/GitHub first.

See [MOBILE_APP_GUIDE.md](./MOBILE_APP_GUIDE.md) for folder-by-folder guidance.
