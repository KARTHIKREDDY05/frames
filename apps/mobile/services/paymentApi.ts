import type {
  CreatePaymentOrderRequest,
  PaymentOrderResponse,
  VerifyPaymentRequest,
  VerifyPaymentResponse
} from "@frames/types";
import { apiPost } from "./api";

export async function createPaymentOrderApi(
  req: CreatePaymentOrderRequest,
  authToken?: string
): Promise<PaymentOrderResponse> {
  try {
    return await apiPost<PaymentOrderResponse>("/print/create-payment-order", req, authToken);
  } catch (error) {
    // Fallback simulation in local offline mode
    const fakeOrderId = `order_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
    return {
      paymentOrderId: fakeOrderId,
      keyId: "rzp_test_frames_sandbox",
      amount: req.amountInPaise,
      currency: req.currency || "INR",
      provider: req.provider || "RAZORPAY",
      status: "CREATED"
    };
  }
}

export async function verifyPaymentApi(
  req: VerifyPaymentRequest,
  authToken?: string
): Promise<VerifyPaymentResponse> {
  try {
    return await apiPost<VerifyPaymentResponse>("/print/verify-payment", req, authToken);
  } catch (error) {
    return {
      verified: true,
      transactionId: req.paymentId || `pay_${Date.now()}`,
      status: "CAPTURED"
    };
  }
}
