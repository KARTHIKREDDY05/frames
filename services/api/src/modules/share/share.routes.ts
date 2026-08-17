import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../database/prisma.js";
import { requireAuth } from "../../middleware/auth.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

const router = Router();

router.post("/links", requireAuth, asyncHandler(async (req, res) => {
  const body = z.object({
    resourceType: z.enum(["daily_frame", "monthly_collage", "yearbook"]),
    resourceId: z.string().min(1),
    access: z.enum(["PUBLIC", "FRIENDS", "PASSWORD", "EXPIRING"]),
    password: z.string().min(6).optional(),
    expiresAt: z.string().datetime().optional()
  }).parse(req.body);

  const token = crypto.randomBytes(32).toString("base64url");
  const slug = crypto.randomBytes(8).toString("base64url");
  const link = await prisma.shareLink.create({
    data: {
      userId: req.userId!,
      resourceType: body.resourceType,
      resourceId: body.resourceId,
      access: body.access,
      slug,
      tokenHash: await bcrypt.hash(token, 10),
      passwordHash: body.password ? await bcrypt.hash(body.password, 10) : null,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : null
    }
  });

  const { tokenHash: _tokenHash, passwordHash: _passwordHash, ...safeLink } = link;
  res.status(201).json({ ...safeLink, url: `/share/${slug}?token=${token}` });
}));

router.get("/links", requireAuth, asyncHandler(async (req, res) => {
  const links = await prisma.shareLink.findMany({
    where: { userId: req.userId, revokedAt: null },
    orderBy: { createdAt: "desc" },
    take: 50
  });
  res.json({ items: links.map(({ tokenHash: _tokenHash, passwordHash: _passwordHash, ...link }) => link), nextCursor: null });
}));

router.delete("/links/:id", requireAuth, asyncHandler(async (req, res) => {
  await prisma.shareLink.updateMany({ where: { id: req.params.id, userId: req.userId }, data: { revokedAt: new Date() } });
  res.status(204).send();
}));

export default router;
