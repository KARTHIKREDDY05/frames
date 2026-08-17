import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../database/prisma.js";
import { requireAuth } from "../../middleware/auth.js";
import { requireAdmin } from "../../middleware/admin.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

const router = Router();

router.use(requireAuth, requireAdmin);

router.get("/overview", asyncHandler(async (_req, res) => {
  const [users, posts, activePosts, archivedPosts, comments, reactions, dailyFrames, monthlyCollages, yearbooks, notifications, shareLinks] = await Promise.all([
    prisma.user.count(),
    prisma.post.count({ where: { deletedAt: null } }),
    prisma.post.count({ where: { deletedAt: null, archivedAt: null, expiresAt: { gt: new Date() } } }),
    prisma.post.count({ where: { deletedAt: null, OR: [{ archivedAt: { not: null } }, { expiresAt: { lte: new Date() } }] } }),
    prisma.comment.count(),
    prisma.reaction.count(),
    prisma.dailyFrame.count(),
    prisma.monthlyCollage.count(),
    prisma.yearbook.count(),
    prisma.notification.count(),
    prisma.shareLink.count({ where: { revokedAt: null } })
  ]);

  res.json({
    users,
    posts,
    activePosts,
    archivedPosts,
    comments,
    reactions,
    dailyFrames,
    monthlyCollages,
    yearbooks,
    notifications,
    shareLinks
  });
}));

router.get("/users", asyncHandler(async (req, res) => {
  const query = z.object({ q: z.string().optional() }).parse(req.query);
  const users = await prisma.user.findMany({
    where: query.q
      ? {
          OR: [
            { username: { contains: query.q, mode: "insensitive" } },
            { displayName: { contains: query.q, mode: "insensitive" } },
            { email: { contains: query.q, mode: "insensitive" } }
          ]
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      username: true,
      displayName: true,
      email: true,
      avatarUrl: true,
      bio: true,
      defaultPrivacy: true,
      role: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { posts: true, comments: true, reactions: true, dailyFrames: true, notifications: true } }
    }
  });
  res.json({ items: users, nextCursor: null });
}));

router.get("/users/:id", asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    include: {
      posts: { orderBy: { createdAt: "desc" }, take: 25, include: { _count: { select: { reactions: true, comments: true } } } },
      dailyFrames: { orderBy: { date: "desc" }, take: 25 },
      monthly: { orderBy: [{ year: "desc" }, { month: "desc" }], take: 12 },
      yearbooks: { orderBy: { year: "desc" } },
      notifications: { orderBy: { createdAt: "desc" }, take: 25 },
      requested: true,
      received: true
    }
  });
  res.json(user);
}));

router.patch("/users/:id/role", asyncHandler(async (req, res) => {
  const body = z.object({ role: z.enum(["USER", "ADMIN"]) }).parse(req.body);
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: { role: body.role },
    select: { id: true, username: true, email: true, role: true }
  });
  res.json(user);
}));

router.get("/posts", asyncHandler(async (req, res) => {
  const query = z.object({ status: z.enum(["active", "archived", "deleted", "all"]).default("all") }).parse(req.query);
  const posts = await prisma.post.findMany({
    where:
      query.status === "active"
        ? { deletedAt: null, archivedAt: null, expiresAt: { gt: new Date() } }
        : query.status === "archived"
          ? { deletedAt: null, OR: [{ archivedAt: { not: null } }, { expiresAt: { lte: new Date() } }] }
          : query.status === "deleted"
            ? { deletedAt: { not: null } }
            : undefined,
    include: { user: true, _count: { select: { reactions: true, comments: true } } },
    orderBy: { createdAt: "desc" },
    take: 100
  });
  res.json({ items: posts, nextCursor: null });
}));

router.get("/storage-map", asyncHandler(async (_req, res) => {
  res.json({
    postgres: {
      User: "account, profile, privacy defaults, admin/user role",
      Friendship: "friend requests, accepted friends, blocks",
      Post: "media URL/key, caption, privacy, 24-hour expiration, archive/delete timestamps",
      Reaction: "one reaction per user/post/type",
      Comment: "post comments",
      DailyFrame: "generated daily scrapbook card metadata",
      DailyFrameItem: "post layout positions inside DailyFrame",
      MonthlyCollage: "monthly generated memory metadata",
      Yearbook: "yearly generated book metadata and export URLs",
      ShareLink: "explicit sharing links with token/password hashes",
      Notification: "durable user notifications"
    },
    objectStorage: {
      originals: "photos/videos uploaded by users",
      thumbnails: "feed and archive thumbnails",
      renders: "scrapbook card/collage/yearbook preview images",
      exports: "PDF and video montage output"
    }
  });
}));

export default router;
