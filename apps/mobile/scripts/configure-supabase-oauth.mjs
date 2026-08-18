const projectRef = process.env.SUPABASE_PROJECT_REF ?? "fjhfmxpuyijwinvmqsch";
const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
const siteUrl = process.env.AUTH_SITE_URL ?? "https://frames-test-build.vercel.app";
const redirectUrls = process.env.AUTH_REDIRECT_URLS ?? [
  "https://frames-test-build.vercel.app/auth/callback",
  "https://frames-test-build.vercel.app/**",
  "frames://auth/callback"
].join(",");

const providers = {
  google: {
    enabled: process.env.GOOGLE_OAUTH_ENABLED ?? "true",
    clientId: process.env.GOOGLE_OAUTH_CLIENT_ID,
    secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET
  },
  github: {
    enabled: process.env.GITHUB_OAUTH_ENABLED ?? "true",
    clientId: process.env.GITHUB_OAUTH_CLIENT_ID,
    secret: process.env.GITHUB_OAUTH_CLIENT_SECRET
  }
};

const missing = [];
if (!accessToken) missing.push("SUPABASE_ACCESS_TOKEN");

for (const [name, config] of Object.entries(providers)) {
  if (config.enabled === "false") continue;
  if (!config.clientId) missing.push(`${name.toUpperCase()}_OAUTH_CLIENT_ID`);
  if (!config.secret) missing.push(`${name.toUpperCase()}_OAUTH_CLIENT_SECRET`);
}

if (missing.length > 0) {
  console.error(`Missing required environment variables:\n${missing.map((item) => `- ${item}`).join("\n")}`);
  process.exit(1);
}

const body = {};
body.site_url = siteUrl;
body.uri_allow_list = redirectUrls;

for (const [name, config] of Object.entries(providers)) {
  const enabled = config.enabled !== "false";
  body[`external_${name}_enabled`] = enabled;
  if (enabled) {
    body[`external_${name}_client_id`] = config.clientId;
    body[`external_${name}_secret`] = config.secret;
  }
}

const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/config/auth`, {
  method: "PATCH",
  headers: {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify(body)
});

const text = await response.text();
let payload;
try {
  payload = text ? JSON.parse(text) : null;
} catch {
  payload = text;
}

if (!response.ok) {
  console.error("Supabase OAuth configuration failed:");
  console.error(payload);
  process.exit(1);
}

console.log("Supabase OAuth providers configured:");
console.log(Object.keys(providers).filter((name) => providers[name].enabled !== "false").join(", "));
