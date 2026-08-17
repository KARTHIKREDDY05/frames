# Database

The canonical schema is [schema.prisma](../services/api/prisma/schema.prisma).

Core records:

- `User`: account, profile, and default privacy.
- `Friendship`: requester, receiver, and `PENDING`, `ACCEPTED`, or `BLOCKED`.
- `Post`: original media reference, 24-hour feed expiration, archive timestamp, privacy, and frame style.
- `DailyFrame`: user/date scrapbook card.
- `DailyFrameItem`: deterministic layout details for posts inside a card.
- `MonthlyCollage`: generated monthly summary.
- `Yearbook`: asynchronous yearly book with status.
- `Notification`: durable notification record.
- `RefreshToken`: hashed refresh-token storage for rotation.

Posts disappear from feed queries when `expiresAt <= now`, `archivedAt` is set, or `deletedAt` is set. Original media URLs remain untouched unless the owner deletes the post.
