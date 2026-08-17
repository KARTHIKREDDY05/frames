import { Router } from "express";
import { prisma } from "../../database/prisma.js";
import { requireAuth } from "../../middleware/auth.js";
import { generateDailyFrameForDate } from "../../services/archiveGeneration.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

const router = Router();

router.post("/simulate-expiration", requireAuth, asyncHandler(async (req, res) => {
  const posts = await prisma.post.findMany({
    where: { userId: req.userId, deletedAt: null, archivedAt: null },
    select: { id: true, createdAt: true }
  });

  await prisma.post.updateMany({
    where: { id: { in: posts.map((post) => post.id) } },
    data: { archivedAt: new Date(), expiresAt: new Date() }
  });

  const generated = [];
  for (const post of posts) {
    generated.push(await generateDailyFrameForDate(prisma, req.userId!, post.createdAt));
  }

  res.json({ archivedPosts: posts.length, generatedDailyFrames: generated.filter(Boolean).length });
}));

export default router;
