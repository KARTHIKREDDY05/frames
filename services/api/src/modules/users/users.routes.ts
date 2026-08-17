import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../database/prisma.js";
import { requireAuth } from "../../middleware/auth.js";
import { getFriendIds } from "../../services/privacy.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { HttpError } from "../../utils/errors.js";

const router = Router();

router.get("/me", requireAuth, asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user) throw new HttpError(404, "User not found", "USER_NOT_FOUND");
  res.json(user);
}));

router.patch("/me", requireAuth, asyncHandler(async (req, res) => {
  const body = z.object({
    displayName: z.string().min(1).max(80).optional(),
    avatarUrl: z.string().url().nullable().optional(),
    bio: z.string().max(180).nullable().optional(),
    defaultPrivacy: z.enum(["PUBLIC", "FRIENDS"]).optional()
  }).parse(req.body);
  const user = await prisma.user.update({ where: { id: req.userId }, data: body });
  res.json(user);
}));

router.get("/:username", requireAuth, asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { username: req.params.username } });
  if (!user) throw new HttpError(404, "User not found", "USER_NOT_FOUND");
  const friendIds = await getFriendIds(prisma, req.userId!);
  const stats = {
    framesPosted: await prisma.post.count({ where: { userId: user.id, deletedAt: null } }),
    friends: friendIds.includes(user.id) ? friendIds.length : undefined,
    yearsArchived: await prisma.yearbook.count({ where: { userId: user.id } }),
    relationship: user.id === req.userId ? "SELF" : friendIds.includes(user.id) ? "FRIEND" : "NONE"
  };
  res.json({ ...user, stats });
}));

router.post("/:id/friend-request", requireAuth, asyncHandler(async (req, res) => {
  if (req.params.id === req.userId) throw new HttpError(400, "Cannot friend yourself", "INVALID_FRIEND_REQUEST");
  const friendship = await prisma.friendship.upsert({
    where: { requesterId_receiverId: { requesterId: req.userId!, receiverId: req.params.id } },
    create: { requesterId: req.userId!, receiverId: req.params.id },
    update: { status: "PENDING" }
  });
  res.status(201).json(friendship);
}));

export default router;
