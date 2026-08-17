import type { NextFunction, Request, Response } from "express";
import { prisma } from "../database/prisma.js";
import { HttpError } from "../utils/errors.js";

export async function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  if (!req.userId) throw new HttpError(401, "Missing authenticated user", "UNAUTHENTICATED");
  const user = await prisma.user.findUnique({ where: { id: req.userId }, select: { role: true } });
  if (!user || user.role !== "ADMIN") throw new HttpError(403, "Administrator access required", "ADMIN_REQUIRED");
  next();
}
