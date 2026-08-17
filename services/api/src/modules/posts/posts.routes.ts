import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../database/prisma.js";
import { requireAuth } from "../../middleware/auth.js";
import { canViewPost } from "../../services/privacy.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { HttpError } from "../../utils/errors.js";

const router = Router();

const createPostSchema = z.object({
  mediaType: z.enum(["IMAGE", "VIDEO"]),
  mediaUrl: z.string().url(),
  thumbnailUrl: z.string().url().optional(),
  caption: z.string().max(240).optional(),
  locationName: z.string().max(120).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  privacy: z.enum(["PUBLIC", "FRIENDS"]),
  frameStyle: z.enum(["POLAROID", "FILMSTRIP", "TORN_PAPER", "STICKER", "MINIMAL", "VINTAGE"]).default("POLAROID")
});

function includeCounts() {
  return { user: true, _count: { select: { reactions: true, comments: true } } };
}

router.post("/", requireAuth, asyncHandler(async (req, res) => {
  const body = createPostSchema.parse(req.body);
  const post = await prisma.post.create({
    data: { ...body, userId: req.userId!, expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) },
    include: includeCounts()
  });
  res.status(201).json(post);
}));

router.get("/:id", requireAuth, asyncHandler(async (req, res) => {
  const post = await prisma.post.findFirst({ where: { id: req.params.id, deletedAt: null }, include: includeCounts() });
  if (!post) throw new HttpError(404, "Post not found", "POST_NOT_FOUND");
  if (!(await canViewPost(prisma, req.userId!, post))) throw new HttpError(403, "Cannot view this post", "FORBIDDEN");
  res.json(post);
}));

router.delete("/:id", requireAuth, asyncHandler(async (req, res) => {
  const post = await prisma.post.findUnique({ where: { id: req.params.id } });
  if (!post) throw new HttpError(404, "Post not found", "POST_NOT_FOUND");
  if (post.userId !== req.userId) throw new HttpError(403, "Only the owner can delete this post", "FORBIDDEN");
  await prisma.post.update({ where: { id: post.id }, data: { deletedAt: new Date() } });
  res.status(204).send();
}));

router.post("/:id/reactions", requireAuth, asyncHandler(async (req, res) => {
  const type = z.object({ type: z.string().min(1).max(32).default("heart") }).parse(req.body).type;
  const post = await prisma.post.findUnique({ where: { id: req.params.id } });
  if (!post || !(await canViewPost(prisma, req.userId!, post))) throw new HttpError(404, "Post not found", "POST_NOT_FOUND");
  const reaction = await prisma.reaction.upsert({
    where: { postId_userId_type: { postId: req.params.id, userId: req.userId!, type } },
    create: { postId: req.params.id, userId: req.userId!, type },
    update: {}
  });
  res.status(201).json(reaction);
}));

router.delete("/:id/reactions", requireAuth, asyncHandler(async (req, res) => {
  const type = z.object({ type: z.string().min(1).max(32).default("heart") }).parse(req.body).type;
  await prisma.reaction.deleteMany({ where: { postId: req.params.id, userId: req.userId, type } });
  res.status(204).send();
}));

router.get("/:id/comments", requireAuth, asyncHandler(async (req, res) => {
  const post = await prisma.post.findUnique({ where: { id: req.params.id } });
  if (!post || !(await canViewPost(prisma, req.userId!, post))) throw new HttpError(404, "Post not found", "POST_NOT_FOUND");
  const comments = await prisma.comment.findMany({
    where: { postId: req.params.id },
    include: { user: true },
    orderBy: { createdAt: "asc" },
    take: 100
  });
  res.json({ items: comments, nextCursor: null });
}));

router.post("/:id/comments", requireAuth, asyncHandler(async (req, res) => {
  const text = z.object({ text: z.string().min(1).max(500) }).parse(req.body).text;
  const post = await prisma.post.findUnique({ where: { id: req.params.id } });
  if (!post || !(await canViewPost(prisma, req.userId!, post))) throw new HttpError(404, "Post not found", "POST_NOT_FOUND");
  const comment = await prisma.comment.create({ data: { postId: req.params.id, userId: req.userId!, text } });
  res.status(201).json(comment);
}));

export default router;
