# Architecture

Frames is a pnpm monorepo with a React Native Expo app, an Express API, background workers, shared type/design packages, and a deterministic scrapbook renderer.

```mermaid
flowchart LR
  app[React Native App] --> api[API Gateway / Express]
  api --> auth[Auth]
  api --> users[Users]
  api --> posts[Posts]
  api --> feed[Feed]
  api --> archive[Archive]
  api --> scrapbook[Scrapbook]
  api --> highlights[Highlights]
  api --> notifications[Notifications]
  api --> exports[Exports]
  auth --> pg[(PostgreSQL)]
  users --> pg
  posts --> pg
  feed --> pg
  archive --> pg
  scrapbook --> s3[(S3-compatible Storage)]
  api --> redis[(Redis)]
  posts --> queues[BullMQ Queues]
  queues --> workers[Workers]
  workers --> ffmpeg[FFmpeg]
  workers --> image[Image Processor]
  workers --> vision[Vision Service]
  workers --> scoring[Highlight Engine]
  workers --> pg
  workers --> s3
  s3 --> cdn[CDN]
  cdn --> app
```

The API owns privacy enforcement. Mobile and desktop/web clients share the same backend contracts and never read directly from PostgreSQL or object storage except through signed upload/download URLs.

Current backend launch priorities:

- Auth with refresh-token rotation.
- Friend requests, accepting, blocking, and removal.
- Feed visibility based on active 24-hour posts plus friendship/privacy.
- Private archive and deterministic daily Frame generation.
- Signed upload and confirmation hooks for media workers.
- Share-link records with revocation, expiring links, and password-hash support.
