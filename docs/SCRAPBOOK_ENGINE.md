# Scrapbook Engine

The MVP renderer is deterministic and template-based. Templates live in `packages/templates`.

Input:

- User
- Date range
- Posts
- Template
- Theme

Output:

- Daily card metadata
- Monthly collage metadata
- Yearbook page metadata
- HTML suitable for PDF/image rendering

Workers generate and persist layout data before render jobs run. This keeps API requests fast and makes regeneration idempotent.
