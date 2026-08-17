import type { PrismaClient } from "@prisma/client";
import { dailyTemplates } from "@frames/templates";

function startOfUtcDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export async function generateDailyFrame(prisma: PrismaClient, userId: string, dateInput: Date) {
  const date = startOfUtcDay(dateInput);
  const next = new Date(date);
  next.setUTCDate(date.getUTCDate() + 1);

  const posts = await prisma.post.findMany({
    where: { userId, createdAt: { gte: date, lt: next }, deletedAt: null },
    orderBy: { createdAt: "asc" }
  });
  if (posts.length === 0) return null;

  const template = dailyTemplates[posts.length > 2 ? 0 : 1]!;
  const frame = await prisma.dailyFrame.upsert({
    where: { userId_date: { userId, date } },
    update: {
      coverMediaUrl: posts[0]!.mediaUrl,
      metadata: { template: template.id, postCount: posts.length }
    },
    create: {
      userId,
      date,
      title: date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" }),
      subtitle: "A day worth remembering.",
      coverMediaUrl: posts[0]!.mediaUrl,
      metadata: { template: template.id, postCount: posts.length }
    }
  });

  await prisma.dailyFrameItem.deleteMany({ where: { dailyFrameId: frame.id } });
  await prisma.dailyFrameItem.createMany({
    data: posts.map((post, index) => {
      const slot = template.slots[index % template.slots.length]!;
      return {
        dailyFrameId: frame.id,
        postId: post.id,
        position: index,
        rotation: slot.rotation,
        scale: slot.scale,
        decoration: slot.decoration
      };
    })
  });

  await prisma.notification.create({
    data: {
      userId,
      type: "daily_frame_ready",
      title: "Your daily Frame is ready",
      message: "A fresh memory card landed in your archive.",
      metadata: { dailyFrameId: frame.id }
    }
  });

  return frame;
}
