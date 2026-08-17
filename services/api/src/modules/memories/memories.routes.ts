import { Router } from "express";
import { prisma } from "../../database/prisma.js";
import { requireAuth } from "../../middleware/auth.js";

const router = Router();

router.get("/monthly/:year/:month", requireAuth, async (req, res) => {
  const collage = await prisma.monthlyCollage.findUnique({
    where: { userId_year_month: { userId: req.userId!, year: Number(req.params.year), month: Number(req.params.month) } }
  });
  res.json(collage);
});

router.get("/yearly/:year", requireAuth, async (req, res) => {
  const yearbook = await prisma.yearbook.findUnique({
    where: { userId_year: { userId: req.userId!, year: Number(req.params.year) } }
  });
  res.json(yearbook);
});

export default router;
