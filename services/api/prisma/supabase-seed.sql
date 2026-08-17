-- Optional Supabase seed for smoke testing.
-- Passwords are intentionally not inserted here because the API hashes passwords.
-- Prefer seeding through POST /auth/register in the deployed API.

insert into "User" (
  "id",
  "username",
  "displayName",
  "email",
  "passwordHash",
  "avatarUrl",
  "bio",
  "defaultPrivacy",
  "createdAt",
  "updatedAt"
) values (
  'user_seed_arjun',
  'arjun',
  'Arjun Rao',
  'arjun@frames.local',
  '$2a$10$replace_with_api_created_hash',
  'https://i.pravatar.cc/160?u=arjun',
  'Collecting ordinary magic.',
  'FRIENDS',
  now(),
  now()
) on conflict ("email") do nothing;
