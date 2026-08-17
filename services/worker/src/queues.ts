import { Queue } from "bullmq";
import { Redis } from "ioredis";
import { env } from "./env.js";

export const connection = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });

export const queues = {
  expiration: new Queue("post-expiration", { connection }),
  dailyFrame: new Queue("daily-frame-generation", { connection }),
  monthlyCollage: new Queue("monthly-collage-generation", { connection }),
  yearbook: new Queue("yearbook-generation", { connection }),
  exports: new Queue("exports", { connection }),
  media: new Queue("media-processing", { connection }),
  notifications: new Queue("notifications", { connection })
};
