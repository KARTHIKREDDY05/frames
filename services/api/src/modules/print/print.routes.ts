import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../database/prisma.js";
import { requireAuth } from "../../middleware/auth.js";
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

const router = Router();

// GET /print/pricing - Return pricing tiers and options
router.get("/pricing", (_req, res) => {
  res.json(getPrintPricingInfo());
});

// GET /print/orders - Fetch user print order history
router.get("/orders", requireAuth, async (req, res) => {
  const orders = await prisma.printOrder.findMany({
    where: { userId: req.userId! },
    orderBy: { createdAt: "desc" }
  });

  const formatted = orders.map((order) => ({
    id: order.id,
    orderId: order.orderId,
    userId: order.userId,
    dateTitle: order.dateTitle,
    photoUrls: order.photoUrls,
    shippingAddress: {
      name: order.shippingName,
      addressLine1: order.shippingAddress,
      city: order.city,
      zipCode: order.zipCode,
      country: order.country
    },
    totalPrice: order.totalPrice,
    status: order.status,
    partnerOrderId: order.partnerOrderId,
    trackingNumber: order.trackingNumber,
    estimatedDelivery: order.estimatedDelivery?.toISOString() || null,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString()
  }));

  res.json({ items: formatted });
});

// GET /print/orders/:id - Fetch single order details
router.get("/orders/:id", requireAuth, async (req, res) => {
  const order = await prisma.printOrder.findFirst({
    where: {
      userId: req.userId!,
      OR: [{ id: req.params.id }, { orderId: req.params.id }]
    }
  });

  if (!order) {
    throw new HttpError(404, "Print order not found", "ORDER_NOT_FOUND");
  }

  res.json({
    id: order.id,
    orderId: order.orderId,
    userId: order.userId,
    dateTitle: order.dateTitle,
    photoUrls: order.photoUrls,
    shippingAddress: {
      name: order.shippingName,
      addressLine1: order.shippingAddress,
      city: order.city,
      zipCode: order.zipCode,
      country: order.country
    },
    totalPrice: order.totalPrice,
    status: order.status,
    partnerOrderId: order.partnerOrderId,
    trackingNumber: order.trackingNumber,
    estimatedDelivery: order.estimatedDelivery?.toISOString() || null,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString()
  });
});

// POST /print/orders - Create & dispatch photo print order
router.post("/orders", requireAuth, async (req, res) => {
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

  const productType = body.productType || "POLAROID_PACK";
  const orderId = `FRM-PRINT-${Math.floor(100000 + Math.random() * 900000)}`;
  const finalPrice = body.totalPrice || calculatePackPrice(body.photoUrls.length, productType);

  // Create initial PENDING order record
  const order = await prisma.printOrder.create({
    data: {
      orderId,
      userId: req.userId!,
      dateTitle: body.dateTitle,
      photoUrls: body.photoUrls,
      shippingName: body.shippingName,
      shippingAddress: body.shippingAddress,
      city: body.city,
      zipCode: body.zipCode,
      country: body.country,
      totalPrice: finalPrice,
      status: "PENDING"
    }
  });

  // Dispatch to print partner API
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


  // Update order status with partner response
  const updatedOrder = await prisma.printOrder.update({
    where: { id: order.id },
    data: {
      status: dispatchResult.success ? "SUBMITTED" : "FAILED",
      partnerOrderId: dispatchResult.partnerOrderId,
      trackingNumber: dispatchResult.trackingNumber,
      estimatedDelivery: dispatchResult.estimatedDelivery ? new Date(dispatchResult.estimatedDelivery) : null,
      metadata: {
        productType,
        quantity: body.quantity,
        magnetTypes: body.magnetTypes,
        giftNote: body.giftNote,
        ...((dispatchResult.rawPayload as any) || {})
      }
    }
  });

  // Create user in-app notification
  const productLabel =
    productType === "FRIDGE_MAGNETS"
      ? "Ceramic Fridge Magnets"
      : productType === "SCRAPBOOK_ALBUM"
      ? "Hardcover Scrapbook"
      : productType === "KEEPSAKE_CAPSULE"
      ? "Keepsake Tin Capsule"
      : "Polaroid Print Pack";

  await prisma.notification.create({
    data: {
      userId: req.userId!,
      type: "print_order_placed",
      title: `${productLabel} Placed 📦`,
      message: `Your physical ${productLabel} order is confirmed. Tracking ID: ${orderId}`,
      metadata: {
        orderId,
        trackingNumber: updatedOrder.trackingNumber,
        estimatedDelivery: updatedOrder.estimatedDelivery
      }
    }
  });

  res.status(201).json({
    id: updatedOrder.id,
    orderId: updatedOrder.orderId,
    userId: updatedOrder.userId,
    dateTitle: updatedOrder.dateTitle,
    photoUrls: updatedOrder.photoUrls,
    shippingAddress: {
      name: updatedOrder.shippingName,
      addressLine1: updatedOrder.shippingAddress,
      city: updatedOrder.city,
      zipCode: updatedOrder.zipCode,
      country: updatedOrder.country
    },
    totalPrice: updatedOrder.totalPrice,
    status: updatedOrder.status,
    partnerOrderId: updatedOrder.partnerOrderId,
    trackingNumber: updatedOrder.trackingNumber,
    estimatedDelivery: updatedOrder.estimatedDelivery?.toISOString() || null,
    productType,
    quantity: body.quantity,
    magnetTypes: body.magnetTypes,
    createdAt: updatedOrder.createdAt.toISOString(),
    updatedAt: updatedOrder.updatedAt.toISOString()
  });
});

// POST /print/orders/:id/simulate-status - Test simulation endpoint for status changes
router.post("/orders/:id/simulate-status", requireAuth, async (req, res) => {
  const body = z
    .object({
      status: z.enum(["SUBMITTED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "FAILED"])
    })
    .parse(req.body);

  const order = await prisma.printOrder.findFirst({
    where: {
      userId: req.userId!,
      OR: [{ id: req.params.id }, { orderId: req.params.id }]
    }
  });

  if (!order) {
    throw new HttpError(404, "Order not found", "ORDER_NOT_FOUND");
  }

  const updatedOrder = await prisma.printOrder.update({
    where: { id: order.id },
    data: {
      status: body.status,
      trackingNumber: order.trackingNumber || `TRK-SIM-${Math.floor(1000000 + Math.random() * 9000000)}`
    }
  });

  res.json({
    ok: true,
    orderId: updatedOrder.orderId,
    status: updatedOrder.status,
    trackingNumber: updatedOrder.trackingNumber
  });
});

// POST /print/orders/:id/cancel - Cancel order
router.post("/orders/:id/cancel", requireAuth, async (req, res) => {
  const order = await prisma.printOrder.findFirst({
    where: {
      userId: req.userId!,
      OR: [{ id: req.params.id }, { orderId: req.params.id }]
    }
  });

  if (!order) {
    throw new HttpError(404, "Order not found", "ORDER_NOT_FOUND");
  }

  if (order.status === "SHIPPED" || order.status === "DELIVERED") {
    throw new HttpError(400, "Cannot cancel an order that has already shipped", "ORDER_ALREADY_SHIPPED");
  }

  const updatedOrder = await prisma.printOrder.update({
    where: { id: order.id },
    data: { status: "CANCELLED" }
  });

  res.json({ ok: true, orderId: updatedOrder.orderId, status: "CANCELLED" });
});

// POST /print/webhook - Print Partner webhook callbacks
router.post("/webhook", async (req, res) => {
  const body = z
    .object({
      merchantReference: z.string(),
      status: z.enum(["SUBMITTED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "FAILED"]),
      trackingNumber: z.string().optional(),
      estimatedDelivery: z.string().optional()
    })
    .parse(req.body);

  const order = await prisma.printOrder.findUnique({
    where: { orderId: body.merchantReference }
  });

  if (!order) {
    throw new HttpError(404, "Order reference not found", "ORDER_NOT_FOUND");
  }

  const updatedOrder = await prisma.printOrder.update({
    where: { id: order.id },
    data: {
      status: body.status,
      trackingNumber: body.trackingNumber || order.trackingNumber,
      estimatedDelivery: body.estimatedDelivery ? new Date(body.estimatedDelivery) : order.estimatedDelivery
    }
  });

  // Notify user on status changes like SHIPPED or DELIVERED
  if (["SHIPPED", "DELIVERED"].includes(body.status)) {
    await prisma.notification.create({
      data: {
        userId: order.userId,
        type: `print_order_${body.status.toLowerCase()}`,
        title: body.status === "SHIPPED" ? "Order Shipped! 🚚" : "Order Delivered! 🎉",
        message:
          body.status === "SHIPPED"
            ? `Your physical order has shipped. Tracking number: ${updatedOrder.trackingNumber || order.orderId}`
            : `Your physical order for ${order.dateTitle} has been delivered!`,
        metadata: { orderId: order.orderId, trackingNumber: updatedOrder.trackingNumber }
      }
    });
  }

  res.json({ ok: true, orderId: order.orderId, status: updatedOrder.status });
});

// POST /print/create-payment-order - Generate real payment gateway order (Razorpay / Stripe)
router.post("/create-payment-order", async (req, res) => {
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

// POST /print/verify-payment - Verify cryptographic payment signature
router.post("/verify-payment", async (req, res) => {
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


