import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../../middleware/auth.js";
import { MediaStorageService } from "../../services/mediaStorage.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

const router = Router();
const media = new MediaStorageService();

router.post("/presign", requireAuth, asyncHandler(async (req, res) => {
  const body = z.object({ mimeType: z.string().regex(/^(image|video)\//), size: z.number().max(100 * 1024 * 1024) }).parse(req.body);
  res.json(await media.createUploadUrl(req.userId!, body.mimeType));
}));

router.post("/confirm", requireAuth, asyncHandler(async (req, res) => {
  const body = z.object({
    mediaUrl: z.string().url(),
    mimeType: z.string().regex(/^(image|video)\//),
    size: z.number().max(100 * 1024 * 1024)
  }).parse(req.body);

  res.status(202).json({
    status: "queued",
    mediaUrl: body.mediaUrl,
    jobs: ["thumbnail_generation", "metadata_extraction", "moderation"]
  });
}));

export default router;
