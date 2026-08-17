# Production Security Checklist

- Hash passwords with bcrypt or Argon2.
- Rotate refresh tokens and store only hashes.
- Enforce privacy and ownership on every backend route.
- Use Helmet, CORS allowlists, and rate limits.
- Validate all inputs with Zod.
- Use Prisma query APIs instead of raw SQL by default.
- Use signed upload and download URLs.
- Validate MIME type and file size before upload confirmation.
- Run moderation hooks before public distribution.
- Never include media contents in analytics payloads.
- Keep archives private unless explicit sharing is created.
