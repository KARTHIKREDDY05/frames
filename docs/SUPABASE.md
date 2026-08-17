# Supabase Setup

Frames now has a real Supabase project:

- Project name: `frames`
- Project ref: `fjhfmxpuyijwinvmqsch`
- Region: `ap-south-1`
- API URL: `https://fjhfmxpuyijwinvmqsch.supabase.co`
- Postgres host: `db.fjhfmxpuyijwinvmqsch.supabase.co`
- Postgres version: `17`

The Frames schema has been applied to Supabase Postgres with migration:

```text
20260817172402 init_frames_schema
```

Tables created:

```text
User
RefreshToken
Friendship
Post
Reaction
Comment
DailyFrame
DailyFrameItem
MonthlyCollage
Yearbook
ShareLink
Notification
```

Access hardening migration:

```text
admin_role_and_rls
```

This adds `User.role` with `USER` and `ADMIN`, then enables RLS on every public app table.

## Backend Connection

Set this in the API hosting provider:

```text
DATABASE_URL=postgresql://postgres:<DATABASE_PASSWORD>@db.fjhfmxpuyijwinvmqsch.supabase.co:5432/postgres?sslmode=require
```

Get `<DATABASE_PASSWORD>` from Supabase Dashboard:

```text
Project Settings -> Database -> Connection string
```

Do not commit the password.

## Smoke Test After API Deployment

Once the API is deployed with `DATABASE_URL`, test through the API so password hashing and token creation are real:

```bash
curl -X POST https://api.your-domain.com/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"karthik","displayName":"Karthik","email":"karthik@example.com","password":"password123"}'
```

Then create a post, fetch `/feed`, and call `/dev/simulate-expiration` only in non-production environments.

## Client Rule

The mobile and desktop apps should call the Frames API, not Supabase tables directly.

Use:

```text
EXPO_PUBLIC_API_URL=https://api.your-domain.com
```

The Supabase publishable key is only for future direct Supabase features such as public storage reads or Supabase Auth. Do not use it for private app data tables.

## Security Advisory

Supabase initially reported a critical advisory: Row Level Security was disabled on all public app tables.

Because Frames enforces privacy in the Express backend, the safest production posture is:

1. Do not expose direct table access from mobile/desktop clients.
2. Use the backend service only.
3. Enable RLS before exposing any Supabase client-side access.

RLS has now been enabled through the app migration. Current access model:

- External mobile/desktop users access app data through the Express API.
- Admin users access all app data through `/admin/*` API routes.
- Direct Supabase table access from anon/authenticated clients is blocked unless future RLS policies are explicitly added.

SQL applied:

```sql
ALTER TABLE public.User ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.RefreshToken ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.Friendship ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.Post ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.Reaction ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.Comment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.DailyFrame ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.DailyFrameItem ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.MonthlyCollage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.Yearbook ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ShareLink ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.Notification ENABLE ROW LEVEL SECURITY;
```

Do not run that blindly if mobile/desktop clients need direct Supabase reads. Enabling RLS without policies blocks anon/authenticated client access. The current backend-only Prisma design can continue to work with direct database credentials while RLS protects PostgREST access.
