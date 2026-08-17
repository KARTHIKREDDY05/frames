# Administrator and External User Views

Frames now has two access perspectives.

## Administrator

Administrators are backend users with:

```text
User.role = ADMIN
```

Admin-only API routes:

```text
GET /admin/overview
GET /admin/users
GET /admin/users/:id
PATCH /admin/users/:id/role
GET /admin/posts
GET /admin/storage-map
```

What an administrator can see:

- All users and profile metadata.
- All posts, including active, archived, and deleted status.
- All friendship records.
- All comments and reactions.
- Daily Frames, monthly collages, yearbooks.
- Notifications and share links.
- A storage map explaining where each data type lives.

What an administrator should not see by default:

- Plaintext passwords. Only password hashes are stored.
- Raw media bytes in PostgreSQL. Media lives in object storage.
- Refresh token plaintext. Only refresh-token hashes are stored.

## External App User

External users are normal app users with:

```text
User.role = USER
```

They use the public app API:

```text
POST /auth/register
POST /auth/login
GET /users/me
PATCH /users/me
GET /feed
POST /posts
POST /posts/:id/reactions
POST /posts/:id/comments
GET /archive
GET /archive/daily/:date
GET /notifications
```

What an external user can see:

- Their own profile.
- Their own active and archived posts.
- Public active posts from others.
- Friends-only active posts only from accepted friends.
- Their own private archive.
- Their own generated Daily Frames.
- Their own notifications.

What an external user cannot see:

- Another user's private archive.
- Friends-only posts from non-friends.
- Deleted posts.
- Admin routes.
- Password hashes or refresh-token hashes.

## How Data Is Stored When an External User Uses Frames

Example: a user registers, posts a photo, receives a reaction, and the post expires.

1. `POST /auth/register`

Stored in PostgreSQL:

```text
User
RefreshToken
```

`User.passwordHash` stores a bcrypt hash, not the password.

2. User uploads media

Stored in object storage:

```text
original image/video
thumbnail
feed optimized media
```

Stored in PostgreSQL:

```text
Post.mediaUrl
Post.thumbnailUrl
```

Postgres stores URLs/keys, not the media file itself.

3. `POST /posts`

Stored in PostgreSQL:

```text
Post.userId
Post.mediaType
Post.mediaUrl
Post.caption
Post.locationName
Post.privacy
Post.frameStyle
Post.createdAt
Post.expiresAt
```

4. A friend reacts or comments

Stored in PostgreSQL:

```text
Reaction
Comment
```

5. 24 hours pass

Updated in PostgreSQL:

```text
Post.archivedAt
```

Created in PostgreSQL:

```text
DailyFrame
DailyFrameItem
Notification
```

6. User opens archive

The API reads:

```text
DailyFrame
DailyFrameItem
Post
```

Then returns only records the authenticated user owns.
