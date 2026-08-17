# Google Play Data Safety Draft

Use this as a starting point for the Google Play Data Safety form.

## Data Types

- Personal info: email address, username, display name, profile photo.
- Photos and videos: user-uploaded memories.
- App activity: posts, reactions, comments, friend requests, archive views, export actions.
- Approximate or precise location: optional, only when user adds location.
- Diagnostics: crashes, API errors, performance data.

## Purpose

- App functionality.
- Account management.
- Social features.
- User-generated content.
- Analytics and reliability.
- Security and fraud prevention.

## Sharing

Do not sell user data. Share media only according to the user-selected privacy setting or explicit share links.

## Security

- Passwords are hashed.
- Auth routes use JWT access tokens and refresh-token rotation.
- Backend enforces privacy.
- Media URLs should be signed for private access.

Confirm final answers with legal/product review before submitting to Google Play.
