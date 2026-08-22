import bcrypt from "bcryptjs";
import { Router } from "express";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import crypto from "node:crypto";
import { z } from "zod";
import { requireAuth } from "../../middleware/auth.js";
import { signAccessToken } from "../../services/jwt.js";
import { HttpError } from "../../utils/errors.js";
import {
  calculatePackPrice,
  dispatchOrderToPrintPartner,
  getPrintPricingInfo
} from "../../services/printPartner.service.js";
import {
  createPaymentOrder,
  verifyPaymentSignature
} from "../../services/payment.service.js";

type Privacy = "PUBLIC" | "FRIENDS";
type FrameStyle = "POLAROID" | "FILMSTRIP" | "TORN_PAPER" | "STICKER" | "MINIMAL" | "VINTAGE";

interface LocalUser {
  id: string;
  username: string;
  displayName: string;
  email: string;
  passwordHash: string;
  avatarUrl?: string | null;
  bio?: string | null;
  defaultPrivacy: Privacy;
  createdAt: string;
  updatedAt: string;
}

interface LocalFriendship {
  id: string;
  requesterId: string;
  receiverId: string;
  status: "PENDING" | "ACCEPTED" | "BLOCKED";
  createdAt: string;
  updatedAt: string;
}

interface LocalPost {
  id: string;
  userId: string;
  mediaType: "IMAGE" | "VIDEO";
  mediaUrl: string;
  thumbnailUrl?: string | null;
  caption?: string | null;
  locationName?: string | null;
  privacy: Privacy;
  frameStyle: FrameStyle;
  createdAt: string;
  expiresAt: string;
  archivedAt?: string | null;
  deletedAt?: string | null;
  reactions: Array<{ userId: string; type: string }>;
  comments: Array<{ id: string; userId: string; text: string; createdAt: string; updatedAt: string }>;
}

interface LocalDailyFrame {
  id: string;
  userId: string;
  date: string;
  title: string;
  subtitle: string;
  coverMediaUrl?: string | null;
  renderedImageUrl?: string | null;
  metadata: Record<string, unknown>;
  postIds: string[];
  createdAt: string;
  updatedAt: string;
}

interface LocalPrintOrder {
  id: string;
  orderId: string;
  userId: string;
  dateTitle: string;
  photoUrls: string[];
  shippingAddress: {
    name: string;
    addressLine1: string;
    city: string;
    zipCode: string;
    country: string;
  };
  totalPrice: string;
  status: "PENDING" | "SUBMITTED" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED" | "FAILED";
  partnerOrderId?: string | null;
  trackingNumber?: string | null;
  estimatedDelivery?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface LocalDb {
  users: LocalUser[];
  friendships: LocalFriendship[];
  posts: LocalPost[];
  dailyFrames: LocalDailyFrame[];
  printOrders: LocalPrintOrder[];
  notifications: Array<{ id: string; userId: string; type: string; title: string; message: string; read: boolean; metadata: Record<string, unknown>; createdAt: string }>;
  shareLinks: Array<Record<string, unknown>>;
}

const dbPath = resolve(process.cwd(), "services/api/.local/local-db.json");

function now() {
  return new Date().toISOString();
}

function id(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`;
}

function seedDb(): LocalDb {
  const createdAt = now();
  return {
    users: [
      {
        id: "user_demo",
        username: "arjun",
        displayName: "Arjun Rao",
        email: "arjun@frames.local",
        passwordHash: bcrypt.hashSync("password123", 10),
        avatarUrl: "https://i.pravatar.cc/160?u=arjun",
        bio: "Collecting ordinary magic.",
        defaultPrivacy: "FRIENDS",
        createdAt,
        updatedAt: createdAt
      }
    ],
    friendships: [],
    posts: [],
    dailyFrames: [],
    printOrders: [],
    notifications: [],
    shareLinks: []
  };
}


function readDb(): LocalDb {
  if (!existsSync(dbPath)) {
    mkdirSync(dirname(dbPath), { recursive: true });
    writeFileSync(dbPath, JSON.stringify(seedDb(), null, 2));
  }
  return JSON.parse(readFileSync(dbPath, "utf8")) as LocalDb;
}

function writeDb(db: LocalDb) {
  mkdirSync(dirname(dbPath), { recursive: true });
  writeFileSync(dbPath, JSON.stringify(db, null, 2));
}

function publicUser(user: LocalUser) {
  const { passwordHash: _passwordHash, ...safeUser } = user;
  return safeUser;
}

function friendIds(db: LocalDb, userId: string) {
  return db.friendships
    .filter((friendship) => friendship.status === "ACCEPTED" && (friendship.requesterId === userId || friendship.receiverId === userId))
    .map((friendship) => (friendship.requesterId === userId ? friendship.receiverId : friendship.requesterId));
}

function formatPost(db: LocalDb, post: LocalPost) {
  const user = db.users.find((item) => item.id === post.userId);
  return {
    ...post,
    user: user ? publicUser(user) : null,
    reactionCount: post.reactions.length,
    commentCount: post.comments.length
  };
}

function dailyTitle(date: string) {
  return new Date(`${date}T00:00:00.000Z`).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
}

function generateDailyFrame(db: LocalDb, userId: string, date: string) {
  const postIds = db.posts.filter((post) => post.userId === userId && post.createdAt.slice(0, 10) === date && !post.deletedAt).map((post) => post.id);
  if (postIds.length === 0) return null;
  const existing = db.dailyFrames.find((frame) => frame.userId === userId && frame.date === date);
  const firstPost = db.posts.find((post) => post.id === postIds[0]);
  const frame: LocalDailyFrame = {
    id: existing?.id ?? id("daily"),
    userId,
    date,
    title: dailyTitle(date),
    subtitle: "A day worth remembering.",
    coverMediaUrl: firstPost?.mediaUrl ?? null,
    renderedImageUrl: null,
    metadata: { template: postIds.length > 2 ? "polaroid-chaos" : "quiet-journal", postCount: postIds.length },
    postIds,
    createdAt: existing?.createdAt ?? now(),
    updatedAt: now()
  };
  db.dailyFrames = [frame, ...db.dailyFrames.filter((item) => item.id !== frame.id && !(item.userId === userId && item.date === date))];
  db.notifications.unshift({ id: id("notification"), userId, type: "daily_frame_ready", title: "Your daily Frame is ready", message: "A fresh memory card landed in your archive.", read: false, metadata: { dailyFrameId: frame.id }, createdAt: now() });
  return frame;
}

const router = Router();

router.post("/auth/register", async (req, res) => {
  const body = z.object({
    username: z.string().min(3),
    displayName: z.string().min(1),
    email: z.string().email(),
    password: z.string().min(8)
  }).parse(req.body);
  const db = readDb();
  if (db.users.some((user) => user.email === body.email.toLowerCase() || user.username === body.username.toLowerCase())) {
    throw new HttpError(409, "User already exists", "USER_EXISTS");
  }
  const createdAt = now();
  const user: LocalUser = {
    id: id("user"),
    username: body.username.toLowerCase(),
    displayName: body.displayName,
    email: body.email.toLowerCase(),
    passwordHash: await bcrypt.hash(body.password, 10),
    avatarUrl: `https://i.pravatar.cc/160?u=${encodeURIComponent(body.email)}`,
    bio: "",
    defaultPrivacy: "FRIENDS",
    createdAt,
    updatedAt: createdAt
  };
  db.users.push(user);
  writeDb(db);
  res.status(201).json({ user: publicUser(user), accessToken: signAccessToken(user.id), refreshToken: `local.${user.id}` });
});

router.post("/auth/login", async (req, res) => {
  const body = z.object({ email: z.string().email(), password: z.string().min(1) }).parse(req.body);
  const db = readDb();
  const user = db.users.find((item) => item.email === body.email.toLowerCase());
  if (!user || !(await bcrypt.compare(body.password, user.passwordHash))) throw new HttpError(401, "Invalid email or password", "INVALID_CREDENTIALS");
  res.json({ user: publicUser(user), accessToken: signAccessToken(user.id), refreshToken: `local.${user.id}` });
});

router.post("/auth/refresh", (req, res) => {
  const refreshToken = z.object({ refreshToken: z.string() }).parse(req.body).refreshToken;
  const userId = refreshToken.split(".")[1];
  if (!userId) throw new HttpError(401, "Invalid refresh token", "INVALID_REFRESH_TOKEN");
  res.json({ accessToken: signAccessToken(userId), refreshToken });
});

router.post("/auth/logout", requireAuth, (_req, res) => res.status(204).send());

router.get("/users/me", requireAuth, (req, res) => {
  const db = readDb();
  const user = db.users.find((item) => item.id === req.userId);
  if (!user) throw new HttpError(404, "User not found", "USER_NOT_FOUND");
  res.json(publicUser(user));
});

router.patch("/users/me", requireAuth, (req, res) => {
  const body = z.object({ displayName: z.string().min(1).optional(), bio: z.string().nullable().optional(), defaultPrivacy: z.enum(["PUBLIC", "FRIENDS"]).optional() }).parse(req.body);
  const db = readDb();
  const user = db.users.find((item) => item.id === req.userId);
  if (!user) throw new HttpError(404, "User not found", "USER_NOT_FOUND");
  Object.assign(user, body, { updatedAt: now() });
  writeDb(db);
  res.json(publicUser(user));
});

router.get("/feed", requireAuth, (req, res) => {
  const db = readDb();
  const friends = friendIds(db, req.userId!);
  const items = db.posts
    .filter((post) => !post.deletedAt && !post.archivedAt && new Date(post.expiresAt) > new Date())
    .filter((post) => post.userId === req.userId || post.privacy === "PUBLIC" || (post.privacy === "FRIENDS" && friends.includes(post.userId)))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((post) => formatPost(db, post));
  res.json({ items, nextCursor: null });
});

router.post("/posts", requireAuth, (req, res) => {
  const body = z.object({
    mediaType: z.enum(["IMAGE", "VIDEO"]),
    mediaUrl: z.string().url(),
    thumbnailUrl: z.string().url().optional(),
    caption: z.string().max(240).optional(),
    locationName: z.string().max(120).optional(),
    privacy: z.enum(["PUBLIC", "FRIENDS"]),
    frameStyle: z.enum(["POLAROID", "FILMSTRIP", "TORN_PAPER", "STICKER", "MINIMAL", "VINTAGE"]).default("POLAROID")
  }).parse(req.body);
  const db = readDb();
  const post: LocalPost = {
    id: id("post"),
    userId: req.userId!,
    mediaType: body.mediaType,
    mediaUrl: body.mediaUrl,
    thumbnailUrl: body.thumbnailUrl,
    caption: body.caption,
    locationName: body.locationName,
    privacy: body.privacy,
    frameStyle: body.frameStyle,
    createdAt: now(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    archivedAt: null,
    deletedAt: null,
    reactions: [],
    comments: []
  };
  db.posts.unshift(post);
  writeDb(db);
  res.status(201).json(formatPost(db, post));
});

router.get("/posts/:id", requireAuth, (req, res) => {
  const db = readDb();
  const post = db.posts.find((item) => item.id === req.params.id && !item.deletedAt);
  if (!post) throw new HttpError(404, "Post not found", "POST_NOT_FOUND");
  res.json(formatPost(db, post));
});

router.post("/posts/:id/reactions", requireAuth, (req, res) => {
  const type = z.object({ type: z.string().default("heart") }).parse(req.body).type;
  const db = readDb();
  const post = db.posts.find((item) => item.id === req.params.id && !item.deletedAt);
  if (!post) throw new HttpError(404, "Post not found", "POST_NOT_FOUND");
  if (!post.reactions.some((reaction) => reaction.userId === req.userId && reaction.type === type)) post.reactions.push({ userId: req.userId!, type });
  writeDb(db);
  res.status(201).json({ postId: post.id, userId: req.userId, type });
});

router.post("/posts/:id/comments", requireAuth, (req, res) => {
  const text = z.object({ text: z.string().min(1).max(500) }).parse(req.body).text;
  const db = readDb();
  const post = db.posts.find((item) => item.id === req.params.id && !item.deletedAt);
  if (!post) throw new HttpError(404, "Post not found", "POST_NOT_FOUND");
  const comment = { id: id("comment"), userId: req.userId!, text, createdAt: now(), updatedAt: now() };
  post.comments.push(comment);
  writeDb(db);
  res.status(201).json(comment);
});

router.get("/archive", requireAuth, (req, res) => {
  const db = readDb();
  const items = db.dailyFrames
    .filter((frame) => frame.userId === req.userId)
    .map((frame) => ({ ...frame, posts: frame.postIds.map((postId) => db.posts.find((post) => post.id === postId)).filter(Boolean).map((post) => formatPost(db, post as LocalPost)) }));
  res.json({ items, nextCursor: null });
});

router.get("/archive/daily/:date", requireAuth, (req, res) => {
  const db = readDb();
  const frame = db.dailyFrames.find((item) => item.userId === req.userId && item.date === req.params.date);
  if (!frame) return res.json(null);
  res.json({ ...frame, posts: frame.postIds.map((postId) => db.posts.find((post) => post.id === postId)).filter(Boolean).map((post) => formatPost(db, post as LocalPost)) });
});

router.post("/dev/simulate-expiration", requireAuth, (req, res) => {
  const db = readDb();
  const posts = db.posts.filter((post) => post.userId === req.userId && !post.deletedAt && !post.archivedAt);
  for (const post of posts) {
    post.expiresAt = now();
    post.archivedAt = now();
    generateDailyFrame(db, req.userId!, post.createdAt.slice(0, 10));
  }
  writeDb(db);
  res.json({ archivedPosts: posts.length, generatedDailyFrames: db.dailyFrames.filter((frame) => frame.userId === req.userId).length });
});

router.post("/uploads/presign", requireAuth, (req, res) => {
  const mimeType = z.object({ mimeType: z.string().regex(/^(image|video)\//), size: z.number().max(100 * 1024 * 1024) }).parse(req.body).mimeType;
  const extension = mimeType.includes("video") ? "mp4" : "jpg";
  const key = `local/${req.userId}/${crypto.randomUUID()}.${extension}`;
  res.json({ uploadUrl: `http://localhost:3001/local-upload/${key}`, mediaUrl: `https://picsum.photos/seed/${encodeURIComponent(key)}/900/1200` });
});

router.get("/notifications", requireAuth, (req, res) => {
  const db = readDb();
  res.json({ items: db.notifications.filter((item) => item.userId === req.userId), nextCursor: null });
});

// Print APIs (Local JSON DB mode)
router.get("/print/pricing", (_req, res) => {
  res.json(getPrintPricingInfo());
});

router.get("/print/orders", requireAuth, (req, res) => {
  const db = readDb();
  const orders = (db.printOrders || []).filter((order) => order.userId === req.userId);
  res.json({ items: orders });
});

router.get("/print/orders/:id", requireAuth, (req, res) => {
  const db = readDb();
  const order = (db.printOrders || []).find(
    (item) => item.userId === req.userId && (item.id === req.params.id || item.orderId === req.params.id)
  );
  if (!order) throw new HttpError(404, "Print order not found", "ORDER_NOT_FOUND");
  res.json(order);
});

router.post("/print/orders", requireAuth, async (req, res) => {
  const body = z
    .object({
      dateTitle: z.string().min(1),
      photoUrls: z.array(z.string()).min(1),
      shippingName: z.string().min(1),
      shippingAddress: z.string().min(1),
      city: z.string().min(1),
      zipCode: z.string().min(1),
      country: z.string().optional().default("IN"),
      totalPrice: z.string().optional(),
      productType: z.enum(["POLAROID_PACK", "FRIDGE_MAGNETS", "SCRAPBOOK_ALBUM", "KEEPSAKE_CAPSULE"]).optional(),
      quantity: z.number().optional().default(1),
      magnetTypes: z.array(z.string()).optional(),
      giftNote: z.string().optional()
    })
    .parse(req.body);

  const db = readDb();
  if (!db.printOrders) db.printOrders = [];

  const productType = body.productType || "POLAROID_PACK";
  const orderId = `FRM-PRINT-${Math.floor(100000 + Math.random() * 900000)}`;
  const finalPrice = body.totalPrice || calculatePackPrice(body.photoUrls.length, productType);
  const currentTime = now();

  const dispatchResult = await dispatchOrderToPrintPartner(
    orderId,
    {
      name: body.shippingName,
      address: body.shippingAddress,
      city: body.city,
      zip: body.zipCode,
      country: body.country
    },
    body.photoUrls,
    productType
  );


  const printOrder: LocalPrintOrder & { productType?: string; quantity?: number; magnetTypes?: string[]; giftNote?: string } = {
    id: id("print_order"),
    orderId,
    userId: req.userId!,
    dateTitle: body.dateTitle,
    photoUrls: body.photoUrls,
    shippingAddress: {
      name: body.shippingName,
      addressLine1: body.shippingAddress,
      city: body.city,
      zipCode: body.zipCode,
      country: body.country
    },
    totalPrice: finalPrice,
    status: dispatchResult.success ? "SUBMITTED" : "FAILED",
    partnerOrderId: dispatchResult.partnerOrderId,
    trackingNumber: dispatchResult.trackingNumber,
    estimatedDelivery: dispatchResult.estimatedDelivery,
    productType,
    quantity: body.quantity,
    magnetTypes: body.magnetTypes,
    giftNote: body.giftNote,
    createdAt: currentTime,
    updatedAt: currentTime
  };

  db.printOrders.unshift(printOrder as any);

  const productLabel =
    productType === "FRIDGE_MAGNETS"
      ? "Ceramic Fridge Magnets"
      : productType === "SCRAPBOOK_ALBUM"
      ? "Hardcover Scrapbook"
      : productType === "KEEPSAKE_CAPSULE"
      ? "Keepsake Tin Capsule"
      : "Polaroid Print Pack";

  db.notifications.unshift({
    id: id("notification"),
    userId: req.userId!,
    type: "print_order_placed",
    title: `${productLabel} Placed 📦`,
    message: `Your physical ${productLabel} order is confirmed. Tracking ID: ${orderId}`,
    read: false,
    metadata: {
      orderId,
      trackingNumber: printOrder.trackingNumber,
      estimatedDelivery: printOrder.estimatedDelivery,
      productType
    },
    createdAt: currentTime
  });

  writeDb(db);
  res.status(201).json(printOrder);
});

router.post("/print/orders/:id/simulate-status", requireAuth, (req, res) => {
  const body = z
    .object({
      status: z.enum(["SUBMITTED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "FAILED"])
    })
    .parse(req.body);

  const db = readDb();
  if (!db.printOrders) db.printOrders = [];
  const order = db.printOrders.find((o) => o.id === req.params.id || o.orderId === req.params.id);

  if (!order) throw new HttpError(404, "Order not found", "ORDER_NOT_FOUND");

  order.status = body.status;
  if (!order.trackingNumber) {
    order.trackingNumber = `TRK-SIM-${Math.floor(1000000 + Math.random() * 9000000)}`;
  }
  order.updatedAt = now();

  if (["SHIPPED", "DELIVERED"].includes(body.status)) {
    db.notifications.unshift({
      id: id("notification"),
      userId: order.userId,
      type: `print_order_${body.status.toLowerCase()}`,
      title: body.status === "SHIPPED" ? "Order Shipped! 🚚" : "Order Delivered! 🎉",
      message:
        body.status === "SHIPPED"
          ? `Your physical order has shipped. Tracking number: ${order.trackingNumber || order.orderId}`
          : `Your physical order for ${order.dateTitle} has been delivered!`,
      read: false,
      metadata: { orderId: order.orderId, trackingNumber: order.trackingNumber },
      createdAt: now()
    });
  }

  writeDb(db);
  res.json({ ok: true, orderId: order.orderId, status: order.status, trackingNumber: order.trackingNumber });
});

router.post("/print/orders/:id/cancel", requireAuth, (req, res) => {
  const db = readDb();
  if (!db.printOrders) db.printOrders = [];
  const order = db.printOrders.find((o) => o.id === req.params.id || o.orderId === req.params.id);

  if (!order) throw new HttpError(404, "Order not found", "ORDER_NOT_FOUND");

  if (order.status === "SHIPPED" || order.status === "DELIVERED") {
    throw new HttpError(400, "Cannot cancel an order that has already shipped", "ORDER_ALREADY_SHIPPED");
  }

  order.status = "CANCELLED";
  order.updatedAt = now();
  writeDb(db);

  res.json({ ok: true, orderId: order.orderId, status: "CANCELLED" });
});

router.post("/print/webhook", (req, res) => {
  const body = z
    .object({
      merchantReference: z.string(),
      status: z.enum(["SUBMITTED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "FAILED"]),
      trackingNumber: z.string().optional(),
      estimatedDelivery: z.string().optional()
    })
    .parse(req.body);

  const db = readDb();
  if (!db.printOrders) db.printOrders = [];
  const order = db.printOrders.find((o) => o.orderId === body.merchantReference);

  if (!order) throw new HttpError(404, "Order reference not found", "ORDER_NOT_FOUND");

  order.status = body.status;
  if (body.trackingNumber) order.trackingNumber = body.trackingNumber;
  if (body.estimatedDelivery) order.estimatedDelivery = body.estimatedDelivery;
  order.updatedAt = now();

  if (["SHIPPED", "DELIVERED"].includes(body.status)) {
    db.notifications.unshift({
      id: id("notification"),
      userId: order.userId,
      type: `print_order_${body.status.toLowerCase()}`,
      title: body.status === "SHIPPED" ? "Order Shipped! 🚚" : "Order Delivered! 🎉",
      message:
        body.status === "SHIPPED"
          ? `Your physical order has shipped. Tracking number: ${order.trackingNumber || order.orderId}`
          : `Your physical order for ${order.dateTitle} has been delivered!`,
      read: false,
      metadata: { orderId: order.orderId, trackingNumber: order.trackingNumber },
      createdAt: now()
    });
  }

  writeDb(db);
  res.json({ ok: true, orderId: order.orderId, status: order.status });
});

// POST /payments/create-order or /print/create-payment-order
router.post(["/payments/create-order", "/print/create-payment-order"], async (req, res) => {
  const schema = z.object({
    amountInPaise: z.number().positive(),
    currency: z.string().default("INR"),
    receipt: z.string(),
    notes: z.record(z.string()).optional(),
    productType: z.string().optional(),
    provider: z.enum(["RAZORPAY", "STRIPE", "UPI_DIRECT"]).default("RAZORPAY")
  });

  const body = schema.parse(req.body);
  const order = await createPaymentOrder({
    amountInPaise: body.amountInPaise,
    currency: body.currency,
    receipt: body.receipt,
    notes: body.notes,
    provider: body.provider as any
  });

  res.json(order);
});

// POST /payments/verify or /print/verify-payment
router.post(["/payments/verify", "/print/verify-payment"], async (req, res) => {
  const schema = z.object({
    paymentOrderId: z.string(),
    paymentId: z.string(),
    signature: z.string().optional(),
    orderId: z.string().optional()
  });

  const body = schema.parse(req.body);
  const result = verifyPaymentSignature(body);
  res.json(result);
});

export default router;


