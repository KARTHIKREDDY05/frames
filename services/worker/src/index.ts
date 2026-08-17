import { PrismaClient } from "@prisma/client";
import { Worker } from "bullmq";
import { connection, queues } from "./queues.js";
import { expirePosts } from "./jobs/expiration.js";
import { generateDailyFrame } from "./jobs/dailyFrame.js";

const prisma = new PrismaClient();

new Worker("post-expiration", () => expirePosts(prisma, queues.dailyFrame), { connection });
new Worker("daily-frame-generation", (job) => generateDailyFrame(prisma, job.data.userId, new Date(job.data.date)), { connection });

await queues.expiration.add("scan", {}, { repeat: { every: 60_000 }, jobId: "post-expiration-scan" });

console.log("Frames worker started");
