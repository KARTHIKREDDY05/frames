import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../database/prisma.js";
import { requireAuth } from "../../middleware/auth.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

const router = Router();

router.get("/archive", requireAuth, asyncHandler(async (req, res) => {
  const query = z.object({ q: z.string().trim().min(1).max(120) }).parse(req.query).q;
  const numeric = Number(query);
  const posts = await prisma.post.findMany({
    where: {
      userId: req.userId,
      deletedAt: null,
      OR: [
        { caption: { contains: query, mode: "insensitive" } },
        { locationName: { contains: query, mode: "insensitive" } },
        Number.isFinite(numeric) ? { createdAt: { gte: new Date(Date.UTC(numeric, 0, 1)), lt: new Date(Date.UTC(numeric + 1, 0, 1)) } } : {}
      ]
    },
    include: { user: true, _count: { select: { reactions: true, comments: true } } },
    orderBy: { createdAt: "desc" },
    take: 50
  });

  const dailyFrames = await prisma.dailyFrame.findMany({
    where: {
      userId: req.userId,
      OR: [
        { title: { contains: query, mode: "insensitive" } },
        { subtitle: { contains: query, mode: "insensitive" } }
      ]
    },
    orderBy: { date: "desc" },
    take: 50
  });

  res.json({ posts, dailyFrames, nextCursor: null });
}));

export default router;
