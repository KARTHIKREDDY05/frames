import { z } from "zod";

export const serverEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(3001),
  DATABASE_URL: z.string().min(1).default("postgresql://frames:frames@localhost:5432/frames"),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  JWT_SECRET: z.string().min(8).default("dev-access-secret"),
  JWT_REFRESH_SECRET: z.string().min(8).default("dev-refresh-secret"),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().default("us-east-1"),
  AWS_BUCKET_NAME: z.string().default("frames-local"),
  CDN_URL: z.string().default("http://localhost:3001/media"),
  SENTRY_DSN: z.string().optional(),
  DEMO_MODE: z.coerce.boolean().default(true),
  LOCAL_JSON_DB: z.coerce.boolean().default(false)
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export function loadServerEnv(env: Record<string, string | undefined>): ServerEnv {
  return serverEnvSchema.parse(env);
}
