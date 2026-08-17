import { Router } from "express";
import { prisma } from "../../database/prisma.js";
import { requireAuth } from "../../middleware/auth.js";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const notifications = await prisma.notification.findMany({ where: { userId: req.userId }, orderBy: { createdAt: "desc" }, take: 50 });
  res.json({ items: notifications, nextCursor: null });
});

router.patch("/:id/read", requireAuth, async (req, res) => {
  const notification = await prisma.notification.update({ where: { id: req.params.id }, data: { read: true } });
  res.json(notification);
});

export default router;
