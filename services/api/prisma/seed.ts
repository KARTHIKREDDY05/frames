import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const image = (id: number) => `https://picsum.photos/seed/frames-${id}/900/1200`;

async function main() {
  const passwordHash = await bcrypt.hash("password123", 12);
  const names = ["Maya", "Noah", "Lena", "Arjun", "Sofia"];
  const users = await Promise.all(
    names.map((name) =>
      prisma.user.upsert({
        where: { email: `${name.toLowerCase()}@frames.local` },
        update: {},
        create: {
          username: name.toLowerCase(),
          displayName: name,
          email: `${name.toLowerCase()}@frames.local`,
          passwordHash,
          avatarUrl: `https://i.pravatar.cc/160?u=${name}`,
          bio: "Capturing the small beautiful bits.",
          defaultPrivacy: "FRIENDS"
        }
      })
    )
  );

  for (let i = 0; i < users.length; i += 1) {
    await prisma.post.create({
      data: {
        userId: users[i]!.id,
        mediaType: "IMAGE",
        mediaUrl: image(i),
        thumbnailUrl: image(i + 20),
        caption: ["Morning chai and sunlight.", "Tiny concert, giant feeling.", "A street corner I want to remember.", "Dinner ran late in the best way.", "Soft rain, loud laughs."][i],
        locationName: ["Hyderabad, India", "Austin, USA", "Lisbon, Portugal", "Bengaluru, India", "Tokyo, Japan"][i],
        privacy: i % 2 === 0 ? "PUBLIC" : "FRIENDS",
        frameStyle: ["POLAROID", "FILMSTRIP", "TORN_PAPER", "STICKER", "VINTAGE"][i] as any,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      }
    });
  }

  const owner = users[3]!;
  for (let d = 1; d <= 7; d += 1) {
    const date = new Date(Date.UTC(2026, 7, 17 - d));
    await prisma.dailyFrame.upsert({
      where: { userId_date: { userId: owner.id, date } },
      update: {},
      create: {
        userId: owner.id,
        date,
        title: date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" }),
        subtitle: "A day worth remembering.",
        coverMediaUrl: image(d + 40),
        renderedImageUrl: image(d + 50),
        metadata: { template: "polaroid-chaos", stats: { frames: 4, places: 2 } }
      }
    });
  }

  await prisma.monthlyCollage.upsert({
    where: { userId_year_month: { userId: owner.id, year: 2026, month: 8 } },
    update: {},
    create: { userId: owner.id, year: 2026, month: 8, title: "August Memories", coverUrl: image(70), renderedImageUrl: image(71), metadata: { frames: 31, places: 12, friends: 8 } }
  });

  await prisma.yearbook.upsert({
    where: { userId_year: { userId: owner.id, year: 2026 } },
    update: {},
    create: { userId: owner.id, year: 2026, title: "Arjun's Frames", coverUrl: image(80), status: "READY", metadata: { pages: 18 } }
  });

  await prisma.notification.create({
    data: { userId: owner.id, type: "daily_frame_ready", title: "Your daily Frame is ready", message: "Yesterday has landed in your archive." }
  });
}

main().finally(() => prisma.$disconnect());
