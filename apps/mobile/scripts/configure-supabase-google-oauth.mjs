process.env.GITHUB_OAUTH_ENABLED = "false";
await import("./configure-supabase-oauth.mjs");
