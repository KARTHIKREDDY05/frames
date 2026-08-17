# API

The OpenAPI 3.1 contract is in [openapi.yaml](./openapi.yaml).

Implemented first-pass route groups:

- `/admin`: administrator overview, user inspection, role management, post inspection, and storage map.
- `/auth`: register, login, refresh, logout, forgot password.
- `/users`: current user, profile updates, public profile lookup, friend request.
- `/friendships`: list, request, accept, block, remove.
- `/feed`: active 24-hour feed.
- `/posts`: create, detail, delete, reactions, comments.
- `/archive`: private daily archive.
- `/search/archive`: private archive search by caption, location, title, subtitle, and year.
- `/memories`: monthly and yearly reads.
- `/uploads`: signed upload URL abstraction.
- `/notifications`: list and mark read.
- `/exports`: queue PDF/video exports.
- `/share`: create, list, and revoke share links.
- `/dev/simulate-expiration`: local-only endpoint to test the 24-hour archive flow.
