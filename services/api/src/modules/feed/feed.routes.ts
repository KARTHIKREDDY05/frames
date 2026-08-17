import { Router } from "express";
import { prisma } from "../../database/prisma.js";
import { requireAuth } from "../../middleware/auth.js";
import { getFriendIds } from "../../services/privacy.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

const router = Router();

router.get("/", requireAuth, asyncHandler(async (req, res) => {
  const friendIds = await getFriendIds(prisma, req.userId!);
  const posts = await prisma.post.findMany({
    where: {
      deletedAt: null,
      archivedAt: null,
      expiresAt: { gt: new Date() },
      OR: [
        { privacy: "PUBLIC" },
        { userId: req.userId },
        { privacy: "FRIENDS", userId: { in: friendIds } }
      ]
    },
    orderBy: { createdAt: "desc" },
    include: { user: true, _count: { select: { reactions: true, comments: true } } },
    take: 30
  });
  res.json({ items: posts, nextCursor: null });
}));

export default router;
