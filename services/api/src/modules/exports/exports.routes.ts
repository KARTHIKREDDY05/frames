import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../../middleware/auth.js";

const router = Router();

router.post("/pdf", requireAuth, async (req, res) => {
  const body = z.object({ year: z.number().int().min(2000).max(2100) }).parse(req.body);
  res.status(202).json({ jobId: `pdf-${req.userId}-${body.year}`, status: "queued" });
});

router.post("/video", requireAuth, async (req, res) => {
  const body = z.object({ year: z.number().int().min(2000).max(2100) }).parse(req.body);
  res.status(202).json({ jobId: `video-${req.userId}-${body.year}`, status: "queued" });
});

export default router;
