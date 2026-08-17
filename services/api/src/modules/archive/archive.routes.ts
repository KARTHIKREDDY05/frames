import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../database/prisma.js";
import { requireAuth } from "../../middleware/auth.js";
import { generateDailyFrameForDate } from "../../services/archiveGeneration.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

const router = Router();

router.get("/", requireAuth, asyncHandler(async (req, res) => {
  const frames = await prisma.dailyFrame.findMany({
    where: { userId: req.userId },
    orderBy: { date: "desc" },
    include: { items: { include: { post: { include: { user: true, _count: { select: { reactions: true, comments: true } } } } } } },
    take: 60
  });
  res.json({ items: frames, nextCursor: null });
}));

router.get("/daily/:date", requireAuth, asyncHandler(async (req, res) => {
  const date = new Date(`${req.params.date}T00:00:00.000Z`);
  const frame = await prisma.dailyFrame.findUnique({
    where: { userId_date: { userId: req.userId!, date } },
    include: { items: { include: { post: { include: { user: true, _count: { select: { reactions: true, comments: true } } } } } } }
  });
  res.json(frame);
}));

router.post("/daily/:date/regenerate", requireAuth, asyncHandler(async (req, res) => {
  const dateParam = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).parse(req.params.date);
  const frame = await generateDailyFrameForDate(prisma, req.userId!, new Date(`${dateParam}T00:00:00.000Z`));
  res.status(frame ? 200 : 404).json(frame ?? { error: { code: "NO_POSTS_FOR_DATE", message: "No posts exist for this date" } });
}));

export default router;
