# Roadmap

## Phase 1 - MVP

Authentication, profiles, friends, photo/video posting, privacy, 24-hour feeds, archive, daily Frame cards, basic frame styles, notifications, and demo mode.

Immediate backend milestone:

- Run PostgreSQL and Redis locally or in managed dev.
- Apply Prisma migrations for `User`, `Friendship`, `Post`, `DailyFrame`, `ShareLink`, and related models.
- Replace browser-local mobile state with `/auth`, `/feed`, `/posts`, `/archive`, `/friendships`, `/uploads`, and `/dev/simulate-expiration`.
- Build the desktop/web client against the same API contract instead of duplicating logic.

## Phase 2

Monthly collages, highlight scoring v1, PDF export, search, and advanced scrapbook templates.

## Phase 3

Yearbook, video montage, face clustering, event detection, smart highlights, and advanced sharing.

## Phase 4

Performance, scaling, moderation, analytics, recommendations, ML improvements, CDN optimization, and cost controls.
