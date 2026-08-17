import bcrypt from "bcryptjs";
import { Router } from "express";
import crypto from "node:crypto";
import { z } from "zod";
import { prisma } from "../../database/prisma.js";
import { requireAuth } from "../../middleware/auth.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../../services/jwt.js";
import { HttpError } from "../../utils/errors.js";

const router = Router();

const registerSchema = z.object({
  username: z.string().min(3).max(24).regex(/^[a-z0-9_]+$/i),
  displayName: z.string().min(1).max(80),
  email: z.string().email(),
  password: z.string().min(8)
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

async function issueTokens(userId: string) {
  const rawRefresh = crypto.randomBytes(48).toString("base64url");
  const tokenHash = await bcrypt.hash(rawRefresh, 10);
  const stored = await prisma.refreshToken.create({
    data: { userId, tokenHash, expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }
  });
  return {
    accessToken: signAccessToken(userId),
    refreshToken: `${stored.id}.${rawRefresh}`
  };
}

router.post("/register", async (req, res) => {
  const body = registerSchema.parse(req.body);
  const passwordHash = await bcrypt.hash(body.password, 12);
  const user = await prisma.user.create({
    data: { username: body.username.toLowerCase(), displayName: body.displayName, email: body.email.toLowerCase(), passwordHash }
  });
  const tokens = await issueTokens(user.id);
  res.status(201).json({ user, ...tokens });
});

router.post("/login", async (req, res) => {
  const body = loginSchema.parse(req.body);
  const user = await prisma.user.findUnique({ where: { email: body.email.toLowerCase() } });
  if (!user || !(await bcrypt.compare(body.password, user.passwordHash))) {
    throw new HttpError(401, "Invalid email or password", "INVALID_CREDENTIALS");
  }
  res.json({ user, ...(await issueTokens(user.id)) });
});

router.post("/refresh", async (req, res) => {
  const token = z.object({ refreshToken: z.string() }).parse(req.body).refreshToken;
  const [tokenId, raw] = token.split(".");
  if (!tokenId || !raw) throw new HttpError(401, "Invalid refresh token", "INVALID_REFRESH_TOKEN");
  const stored = await prisma.refreshToken.findUnique({ where: { id: tokenId } });
  if (!stored || stored.revokedAt || stored.expiresAt < new Date() || !(await bcrypt.compare(raw, stored.tokenHash))) {
    throw new HttpError(401, "Invalid refresh token", "INVALID_REFRESH_TOKEN");
  }
  await prisma.refreshToken.update({ where: { id: tokenId }, data: { revokedAt: new Date() } });
  const signed = signRefreshToken(stored.userId, tokenId);
  verifyRefreshToken(signed);
  res.json(await issueTokens(stored.userId));
});

router.post("/logout", requireAuth, async (req, res) => {
  await prisma.refreshToken.updateMany({ where: { userId: req.userId, revokedAt: null }, data: { revokedAt: new Date() } });
  res.status(204).send();
});

router.post("/forgot-password", async (_req, res) => {
  res.status(202).json({ message: "If the account exists, password reset instructions will be sent." });
});

export default router;
