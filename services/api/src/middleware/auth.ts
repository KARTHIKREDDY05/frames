import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../runtime/env.js";
import { HttpError } from "../utils/errors.js";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.header("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) throw new HttpError(401, "Missing access token", "UNAUTHENTICATED");

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as { sub: string };
    req.userId = payload.sub;
    next();
  } catch {
    throw new HttpError(401, "Invalid access token", "UNAUTHENTICATED");
  }
}
