import type { PrismaClient } from "@prisma/client";
import type { Queue } from "bullmq";

export async function expirePosts(prisma: PrismaClient, dailyFrameQueue: Queue) {
  const expired = await prisma.post.findMany({
    where: { expiresAt: { lte: new Date() }, archivedAt: null, deletedAt: null },
    select: { id: true, userId: true, createdAt: true }
  });

  for (const post of expired) {
    await prisma.post.update({ where: { id: post.id }, data: { archivedAt: new Date() } });
    await dailyFrameQueue.add(
      "generate",
      { userId: post.userId, date: post.createdAt.toISOString() },
      { jobId: `daily-${post.userId}-${post.createdAt.toISOString().slice(0, 10)}`, attempts: 3, backoff: { type: "exponential", delay: 5000 } }
    );
  }

  return expired.length;
}
