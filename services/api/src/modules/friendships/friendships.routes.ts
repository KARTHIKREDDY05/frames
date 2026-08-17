import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../database/prisma.js";
import { requireAuth } from "../../middleware/auth.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { HttpError } from "../../utils/errors.js";

const router = Router();

router.get("/", requireAuth, asyncHandler(async (req, res) => {
  const friendships = await prisma.friendship.findMany({
    where: {
      OR: [{ requesterId: req.userId }, { receiverId: req.userId }]
    },
    include: { requester: true, receiver: true },
    orderBy: { updatedAt: "desc" }
  });

  res.json({
    items: friendships.map((friendship) => ({
      ...friendship,
      user: friendship.requesterId === req.userId ? friendship.receiver : friendship.requester
    })),
    nextCursor: null
  });
}));

router.post("/requests", requireAuth, asyncHandler(async (req, res) => {
  const receiverId = z.object({ receiverId: z.string().min(1) }).parse(req.body).receiverId;
  if (receiverId === req.userId) throw new HttpError(400, "Cannot send a friend request to yourself", "INVALID_FRIEND_REQUEST");

  const receiver = await prisma.user.findUnique({ where: { id: receiverId } });
  if (!receiver) throw new HttpError(404, "User not found", "USER_NOT_FOUND");

  const friendship = await prisma.friendship.upsert({
    where: { requesterId_receiverId: { requesterId: req.userId!, receiverId } },
    create: { requesterId: req.userId!, receiverId },
    update: { status: "PENDING" }
  });

  await prisma.notification.create({
    data: {
      userId: receiverId,
      type: "friend_request",
      title: "New friend request",
      message: "Someone wants to share Frames with you.",
      metadata: { requesterId: req.userId }
    }
  });

  res.status(201).json(friendship);
}));

router.patch("/:id", requireAuth, asyncHandler(async (req, res) => {
  const status = z.object({ status: z.enum(["ACCEPTED", "BLOCKED"]) }).parse(req.body).status;
  const friendship = await prisma.friendship.findUnique({ where: { id: req.params.id } });
  if (!friendship) throw new HttpError(404, "Friendship not found", "FRIENDSHIP_NOT_FOUND");
  if (friendship.receiverId !== req.userId && friendship.requesterId !== req.userId) throw new HttpError(403, "Cannot update this friendship", "FORBIDDEN");
  if (status === "ACCEPTED" && friendship.receiverId !== req.userId) throw new HttpError(403, "Only the receiver can accept a friend request", "FORBIDDEN");

  const updated = await prisma.friendship.update({ where: { id: friendship.id }, data: { status } });
  res.json(updated);
}));

router.delete("/:id", requireAuth, asyncHandler(async (req, res) => {
  const friendship = await prisma.friendship.findUnique({ where: { id: req.params.id } });
  if (!friendship) throw new HttpError(404, "Friendship not found", "FRIENDSHIP_NOT_FOUND");
  if (friendship.receiverId !== req.userId && friendship.requesterId !== req.userId) throw new HttpError(403, "Cannot remove this friendship", "FORBIDDEN");
  await prisma.friendship.delete({ where: { id: friendship.id } });
  res.status(204).send();
}));

export default router;
