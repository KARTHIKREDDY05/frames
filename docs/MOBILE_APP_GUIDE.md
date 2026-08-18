# Frames Mobile App Guide

Frames is built as an Expo React Native app. The same `apps/mobile` codebase can run as:

- an installable Android app (`.apk`) for friend/testing copies
- a Play Store Android App Bundle (`.aab`) for official release
- a web test build on Vercel

## Build Types

### Preview APK

Use this when you want a downloadable file you can send to friends before publishing.

```bash
cd apps/mobile
eas login
eas init
pnpm build:apk
```

EAS returns a build page and an `.apk` download link. Send that APK link or file to testers. Android users may need to allow installing apps from their browser/file manager.

If browser login is awkward, create an Expo access token and set:

```powershell
$env:EXPO_TOKEN="your-expo-token"
cd apps/mobile
pnpm build:apk
```

### Production AAB

Use this for Play Store upload.

```bash
cd apps/mobile
pnpm build:aab
```

The Play Store expects `.aab`, not `.apk`, for new official apps.

### Submit To Play Store

After the Google Play Console app and service account are configured:

```bash
cd apps/mobile
pnpm submit:android
```

## Important App Files

### `apps/mobile/app.json`

This is the native app identity.

Changing this affects install/build behavior:

- `expo.name`: app name shown to users
- `expo.slug`: Expo project slug
- `expo.scheme`: deep link scheme, currently `frames://`
- `expo.version`: user-facing app version
- `expo.icon`: launcher icon
- `expo.splash`: splash screen
- `expo.android.package`: Android package name, currently `app.frames.mobile`
- `expo.android.versionCode`: Android release number
- `expo.android.permissions`: camera, gallery, location, notifications
- `expo.ios.bundleIdentifier`: iOS bundle id

Do not casually change `android.package` after testers install the app. Android treats a changed package name as a different app.

### `apps/mobile/eas.json`

This controls cloud builds.

- `development`: internal dev client APK
- `preview`: shareable APK for testers
- `production`: Play Store AAB
- `env`: public build-time environment variables

If Supabase OAuth is enabled later, set:

```json
"EXPO_PUBLIC_ENABLED_OAUTH_PROVIDERS": "google,github"
```

### `apps/mobile/package.json`

This defines commands.

- `pnpm dev`: starts Expo
- `pnpm web`: starts web preview
- `pnpm build`: exports web build
- `pnpm build:apk`: creates tester APK
- `pnpm build:aab`: creates Play Store bundle
- `pnpm submit:android`: submits to Play Store
- `pnpm lint`: TypeScript check

### `apps/mobile/app/`

This folder is the app's screens. Expo Router maps files to routes.

- `index.tsx`: first-time intro/onboarding
- `login.tsx`: email/password login
- `register.tsx`: account creation and email verification
- `auth/callback.tsx`: Supabase email/OAuth redirect callback
- `(tabs)/_layout.tsx`: bottom tab navigation
- `(tabs)/home.tsx`: feed
- `(tabs)/search.tsx`: friend search
- `(tabs)/camera.tsx`: camera/gallery capture
- `(tabs)/archive.tsx`: archive
- `(tabs)/memories.tsx`: monthly/yearly memories
- `(tabs)/profile.tsx`: current user profile
- `settings.tsx`: profile edit, privacy, avatar
- `notifications.tsx`: follow requests
- `user/[id].tsx`: another user's profile
- `comments/[id].tsx`: post comments
- `share.tsx`: share link screen
- `export.tsx`: export options

Changing files here changes what users see and tap.

### `apps/mobile/components/`

Reusable UI pieces.

- `AppIcon.tsx`: Frames-themed icon system
- `FrameButton.tsx`: main button component
- `FrameCard.tsx`: post/frame card
- `PaperBackground.tsx`: app background
- `PrivacySelector.tsx`: public/friends selector
- `ReactionButton.tsx`: like/comment/share row

Changing components affects every screen that uses them.

### `apps/mobile/services/`

External integrations.

- `supabase.ts`: Supabase Auth, profiles, search, follows
- `api.ts`: older HTTP API helper

Most current account/profile/friend behavior goes through `supabase.ts`.

### `apps/mobile/store/`

Local app state.

- `appStore.ts`: Zustand state for current user, cached posts, intro state, local fallback actions

If you change persistence name/version here, testers may lose cached local app state, which is useful when clearing placeholders.

### `apps/mobile/assets/`

Native visual assets.

- `icon.png`: launcher icon
- `adaptive-icon.png`: Android adaptive icon foreground
- `splash.png`: splash screen image

Changing these affects installed app branding and splash screen.

### `packages/types/`

Shared TypeScript data types used by app/services.

If you add or rename fields like `profileVisibility`, update types here so screens and services agree.

### `packages/ui/`

Shared design tokens such as colors.

Changing colors here can affect the whole app.

### `docs/`

Project documentation:

- `PLAY_STORE_RELEASE.md`: Play Store steps
- `SUPABASE.md`: database/auth setup
- `DATA_FLOW.md`: how data moves
- `ADMIN_AND_EXTERNAL_USER_VIEWS.md`: admin/user view explanation
- `MOBILE_APP_GUIDE.md`: this guide

## Before Sending An APK

Run:

```bash
cd apps/mobile
pnpm lint
pnpm build:apk
```

Then test on a phone:

- install APK
- create account with required password
- verify email
- log in
- camera permission
- gallery permission
- profile edit/avatar
- search users
- send/accept follow request
- post frame
- like/comment/share
- archive/memories
- logout/login again

## OAuth Reality

The app code can show and launch OAuth buttons, but Supabase must first have each provider enabled with real provider credentials.

Required outside code:

- Google Cloud OAuth client id/secret
- GitHub OAuth app client id/secret
- Supabase Auth provider configuration
- Allowed redirect URL: `https://frames-test-build.vercel.app/auth/callback`
- Mobile deep link redirect for installed builds: `frames://auth/callback`

Until those provider credentials exist, email/password is the correct login path.

Once credentials exist, configure Supabase from the repo:

```powershell
$env:SUPABASE_ACCESS_TOKEN="your-supabase-access-token"
$env:GOOGLE_OAUTH_CLIENT_ID="..."
$env:GOOGLE_OAUTH_CLIENT_SECRET="..."
$env:GITHUB_OAUTH_CLIENT_ID="..."
$env:GITHUB_OAUTH_CLIENT_SECRET="..."
cd apps/mobile
pnpm configure:oauth
```

Then enable the buttons in `apps/mobile/eas.json` and Vercel/env builds:

```text
EXPO_PUBLIC_ENABLED_OAUTH_PROVIDERS=google,github
```

### Creating A Google OAuth Project

If you do not see an existing Google Cloud project, create one:

1. Open `https://console.cloud.google.com/projectcreate`
2. Name it `Frames`
3. Open `https://console.cloud.google.com/auth/overview`
4. Configure the OAuth consent screen as an external app
5. Open `https://console.cloud.google.com/apis/credentials`
6. Create Credentials -> OAuth client ID
7. Application type: Web application
8. Authorized redirect URI:

```text
https://fjhfmxpuyijwinvmqsch.supabase.co/auth/v1/callback
```

Copy the Client ID and Client Secret into `GOOGLE_OAUTH_CLIENT_ID` and `GOOGLE_OAUTH_CLIENT_SECRET`.
