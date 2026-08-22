import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import morgan from "morgan";
import archiveRoutes from "./modules/archive/archive.routes.js";
import adminRoutes from "./modules/admin/admin.routes.js";
import authRoutes from "./modules/auth/auth.routes.js";
import devRoutes from "./modules/dev/dev.routes.js";
import exportsRoutes from "./modules/exports/exports.routes.js";
import feedRoutes from "./modules/feed/feed.routes.js";
import friendshipsRoutes from "./modules/friendships/friendships.routes.js";
import memoriesRoutes from "./modules/memories/memories.routes.js";
import notificationsRoutes from "./modules/notifications/notifications.routes.js";
import postsRoutes from "./modules/posts/posts.routes.js";
import searchRoutes from "./modules/search/search.routes.js";
import shareRoutes from "./modules/share/share.routes.js";
import uploadsRoutes from "./modules/uploads/uploads.routes.js";
import usersRoutes from "./modules/users/users.routes.js";
import printRoutes from "./modules/print/print.routes.js";
import { errorHandler } from "./utils/errors.js";
import { env } from "./runtime/env.js";
import localRoutes from "./modules/local/local.routes.js";

export function createApp() {
  const app = express();
  app.use(helmet());
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json({ limit: "1mb" }));
  app.use(rateLimit({ windowMs: 60_000, limit: 120 }));
  app.use(morgan("dev"));

  app.get("/health", (_req, res) => res.json({ ok: true, service: "frames-api" }));
  app.get("/ready", async (_req, res) => {
    if (env.LOCAL_JSON_DB) return res.json({ ok: true, database: "local-json" });
    try {
      const { prisma } = await import("./database/prisma.js");
      await prisma.$queryRaw`SELECT 1`;
      return res.json({ ok: true, database: "postgres" });
    } catch {
      return res.status(503).json({ ok: false, database: "unavailable" });
    }
  });
  if (env.LOCAL_JSON_DB) {
    app.use(localRoutes);
    app.use(errorHandler);
    return app;
  }

  app.use("/auth", authRoutes);
  app.use("/admin", adminRoutes);
  app.use("/users", usersRoutes);
  app.use("/friendships", friendshipsRoutes);
  app.use("/feed", feedRoutes);
  app.use("/posts", postsRoutes);
  app.use("/archive", archiveRoutes);
  app.use("/memories", memoriesRoutes);
  app.use("/search", searchRoutes);
  app.use("/share", shareRoutes);
  app.use("/uploads", uploadsRoutes);
  app.use("/notifications", notificationsRoutes);
  app.use("/exports", exportsRoutes);
  app.use("/print", printRoutes);
  if (env.NODE_ENV !== "production") app.use("/dev", devRoutes);
  app.use(errorHandler);
  return app;
}
