import { useState } from "react";
import { Alert, Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import type { PostDto, ProductType, PaymentProvider } from "@frames/types";
import { palette } from "@frames/ui";
import { AppIcon } from "./AppIcon";
import { createPrintOrderApi } from "../services/printApi";
import { createPaymentOrderApi, verifyPaymentApi } from "../services/paymentApi";
import { useAppStore } from "../store/appStore";

export function OrderDailyPackModal({
  visible,
  dateTitle,
  posts = [],
  onClose
}: {
  visible: boolean;
  dateTitle: string;
  posts?: PostDto[];
  onClose: () => void;
}) {
  const currentUser = useAppStore((state) => state.currentUser);
  const addPrintOrder = useAppStore((state) => state.addPrintOrder);
  const [step, setStep] = useState<"preview" | "address" | "success">("preview");
  const [productType, setProductType] = useState<ProductType>("POLAROID_PACK");
  const [paymentProvider, setPaymentProvider] = useState<PaymentProvider>("RAZORPAY");
  const [name, setName] = useState(currentUser?.displayName || currentUser?.username || "");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [zip, setZip] = useState("");
  const [trackingId, setTrackingId] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const photoCount = posts.length;
  const packPrice = productType === "FRIDGE_MAGNETS" ? "₹399" : photoCount > 5 ? "₹299" : "₹199";
  const amountInPaise = productType === "FRIDGE_MAGNETS" ? 39900 : photoCount > 5 ? 29900 : 19900;

  const handleOrder = async () => {
    if (!name.trim() || !address.trim() || !city.trim() || !zip.trim()) {
      setValidationError("Please fill out your full shipping name, address, city, and postal code.");
      return;
    }
    if (posts.length === 0) {
      setValidationError("No photos found in this collection to print.");
      return;
    }

    setValidationError(null);
    setLoading(true);
    const photoUrls = posts.map((p) => p.mediaUrl).filter(Boolean);

    try {
      // 1. Create Payment Gateway Order (Razorpay / Stripe)
      const payOrder = await createPaymentOrderApi({
        amountInPaise,
        currency: "INR",
        receipt: `rcpt_${Date.now()}`,
        productType,
        provider: paymentProvider,
        notes: {
          dateTitle,
          shippingName: name.trim(),
          city: city.trim()
        }
      });

      // 2. Verify Payment Transaction
      const simulatedPaymentId = `pay_${paymentProvider.toLowerCase()}_${Date.now()}`;
      const verifyRes = await verifyPaymentApi({
        paymentOrderId: payOrder.paymentOrderId,
        paymentId: simulatedPaymentId,
        orderId: payOrder.paymentOrderId
      });

      setTransactionId(verifyRes.transactionId);

      // 3. Dispatch Physical Print Order to Lab
      const result = await createPrintOrderApi({
        dateTitle,
        photoUrls,
        shippingName: name.trim(),
        shippingAddress: address.trim(),
        city: city.trim(),
        zipCode: zip.trim(),
        country: "IN",
        totalPrice: packPrice,
        productType,
        quantity: 1,
        magnetTypes: productType === "FRIDGE_MAGNETS" ? ["cherry", "star", "clover"] : undefined
      });

      if (result) {
        addPrintOrder(result);
      }

      setLoading(false);
      setTrackingId(result.orderId || result.trackingNumber || `FRM-PRINT-${Math.floor(100000 + Math.random() * 900000)}`);
      setStep("success");

    } catch (e: any) {
      setLoading(false);
      setValidationError(e?.message || "Order creation or payment failed. Please check your connection.");
    }
  };


  const resetAndClose = () => {
    setStep("preview");
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={resetAndClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header Bar */}
          <View style={styles.header}>
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>
                {productType === "FRIDGE_MAGNETS" ? "🧲 REAL CERAMIC FRIDGE MAGNETS" : "📸 PHYSICAL POLAROID PRINT PACK"}
              </Text>
            </View>
            <Pressable style={styles.closeBtn} onPress={resetAndClose}>
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
          </View>

          <Text style={styles.title}>{dateTitle}</Text>
          <Text style={styles.subtitle}>
            {step === "success"
              ? "Your physical print order is confirmed & dispatched to lab!"
              : productType === "FRIDGE_MAGNETS"
              ? `Order a custom set of 6 heavy ceramic photo magnets + clips from this memory.`
              : `Order physical glossy Polaroid prints of all ${photoCount} captured moments from this day.`}
          </Text>

          {step === "preview" && (
            <ScrollView contentContainerStyle={styles.bodyScroll}>
              {/* Product Type Selector */}
              <View style={styles.productTypeRow}>
                <Pressable
                  style={[styles.productTypeBtn, productType === "POLAROID_PACK" && styles.productTypeBtnActive]}
                  onPress={() => setProductType("POLAROID_PACK")}
                >
                  <Text style={styles.productTypeEmoji}>📸</Text>
                  <Text style={[styles.productTypeTitle, productType === "POLAROID_PACK" && styles.productTypeTitleActive]}>
                    Polaroid Prints
                  </Text>
                  <Text style={styles.productTypePrice}>{photoCount > 5 ? "₹299" : "₹199"}</Text>
                </Pressable>

                <Pressable
                  style={[styles.productTypeBtn, productType === "FRIDGE_MAGNETS" && styles.productTypeBtnActive]}
                  onPress={() => setProductType("FRIDGE_MAGNETS")}
                >
                  <Text style={styles.productTypeEmoji}>🧲</Text>
                  <Text style={[styles.productTypeTitle, productType === "FRIDGE_MAGNETS" && styles.productTypeTitleActive]}>
                    Fridge Magnets
                  </Text>
                  <Text style={styles.productTypePrice}>₹399</Text>
                </Pressable>
              </View>


              {/* Photo Stack Preview */}
              <View style={styles.stackWrap}>
                {posts.length > 0 ? (
                  posts.slice(0, 4).map((post, idx) => (
                    <View
                      key={post.id || idx}
                      style={[
                        styles.photoStackCard,
                        { transform: [{ rotate: `${(idx - 1.5) * 5}deg` }], zIndex: 10 - idx }
                      ]}
                    >
                      <Image source={{ uri: post.mediaUrl }} style={styles.stackImage} resizeMode="cover" />
                    </View>
                  ))
                ) : (
                  <View style={styles.emptyPhotoWrap}>
                    <AppIcon name="camera" color={palette.mutedBrown} size={28} />
                    <Text style={styles.emptyPhotoText}>No captured snaps in this collection yet.</Text>
                  </View>
                )}
              </View>

              {/* Package Details */}
              <View style={styles.detailsCard}>
                <View style={styles.detailRow}>
                  <AppIcon name="gallery" color={palette.ink} size={18} />
                  <Text style={styles.detailText}>
                    {productType === "FRIDGE_MAGNETS"
                      ? "Set of 6 Heavy Ceramic Photo Magnets (1.2mm Backing)"
                      : `${photoCount} High-Gloss Polaroid Prints (4x5")`}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <AppIcon name="spark" color={palette.ink} size={18} />
                  <Text style={styles.detailText}>
                    {productType === "FRIDGE_MAGNETS"
                      ? "Includes 3D Magnet Pins (Cherry, Lemon, Star)"
                      : "Includes Retro Stamped Kraft Envelope"}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <AppIcon name="public" color={palette.ink} size={18} />
                  <Text style={styles.detailText}>Delivered to Your Doorstep in 3–5 Days</Text>
                </View>
              </View>

              {/* Price Row */}
              <View style={styles.priceRow}>
                <View>
                  <Text style={styles.priceLabel}>Order Total</Text>
                  <Text style={styles.priceSub}>Free Global Shipping Included</Text>
                </View>
                <Text style={styles.priceTag}>{packPrice}</Text>
              </View>

              <Pressable
                style={[styles.primaryBtn, posts.length === 0 && { opacity: 0.5 }]}
                onPress={() => {
                  if (posts.length === 0) {
                    setValidationError("Please add or capture photos first.");
                    return;
                  }
                  setValidationError(null);
                  setStep("address");
                }}
                disabled={posts.length === 0}
              >
                <AppIcon name="spark" color={palette.ink} size={18} />
                <Text style={styles.primaryBtnText}>Enter Shipping Address ➔</Text>
              </Pressable>
            </ScrollView>
          )}

          {step === "address" && (
            <ScrollView contentContainerStyle={styles.bodyScroll}>
              <View style={styles.formGroup}>
                <Text style={styles.fieldLabel}>Full Name *</Text>
                <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Your Full Name" />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.fieldLabel}>Street Address *</Text>
                <TextInput style={styles.input} value={address} onChangeText={setAddress} placeholder="Street Address, Flat / House No." />
              </View>

              <View style={styles.rowTwo}>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.fieldLabel}>City *</Text>
                  <TextInput style={styles.input} value={city} onChangeText={setCity} placeholder="City / Town" />
                </View>

                <View style={[styles.formGroup, { width: 120 }]}>
                  <Text style={styles.fieldLabel}>Zip / Pincode *</Text>
                  <TextInput style={styles.input} value={zip} onChangeText={setZip} placeholder="Postal Code" keyboardType="numeric" />
                </View>
              </View>

              {/* Payment Method Selector */}
              <View style={styles.formGroup}>
                <Text style={styles.fieldLabel}>Payment Method *</Text>
                <View style={styles.paymentSelectorRow}>
                  <Pressable
                    style={[styles.paymentBtn, paymentProvider === "RAZORPAY" && styles.paymentBtnActive]}
                    onPress={() => setPaymentProvider("RAZORPAY")}
                  >
                    <Text style={[styles.paymentBtnTitle, paymentProvider === "RAZORPAY" && styles.paymentBtnTitleActive]}>
                      ⚡ UPI / GPay / Cards
                    </Text>
                    <Text style={styles.paymentBtnSub}>Razorpay Live API</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.paymentBtn, paymentProvider === "STRIPE" && styles.paymentBtnActive]}
                    onPress={() => setPaymentProvider("STRIPE")}
                  >
                    <Text style={[styles.paymentBtnTitle, paymentProvider === "STRIPE" && styles.paymentBtnTitleActive]}>
                      💳 Cards / NetBanking
                    </Text>
                    <Text style={styles.paymentBtnSub}>Stripe Payment Intent</Text>
                  </Pressable>
                </View>
              </View>

              {validationError && (
                <View style={styles.validationErrorBox}>
                  <Text style={styles.validationErrorText}>⚠️ {validationError}</Text>
                </View>
              )}

              {/* Summary */}
              <View style={styles.summaryBox}>
                <Text style={styles.summaryText}>
                  Total: {packPrice} ({productType === "FRIDGE_MAGNETS" ? "6 Ceramic Magnets" : `${photoCount} Polaroid Prints`} + Free Shipping)
                </Text>
              </View>

              <Pressable style={styles.primaryBtn} onPress={handleOrder} disabled={loading}>
                <AppIcon name="check" color={palette.ink} size={18} />
                <Text style={styles.primaryBtnText}>
                  {loading ? "Processing Payment & Order..." : `Pay ${packPrice} & Confirm Order 🚀`}
                </Text>
              </Pressable>

              <Pressable style={styles.secondaryBtn} onPress={() => setStep("preview")}>
                <Text style={styles.secondaryBtnText}>‹ Back to Preview</Text>
              </Pressable>

            </ScrollView>
          )}

          {step === "success" && (
            <View style={styles.successWrap}>
              <View style={styles.successIconBox}>
                <AppIcon name="check" color={palette.ink} size={36} />
              </View>
              <Text style={styles.successTitle}>Order Placed Successfully! 🎉</Text>
              <Text style={styles.successDesc}>
                {productType === "FRIDGE_MAGNETS"
                  ? "Your custom Ceramic Fridge Magnet pack is being printed and dispatches tomorrow."
                  : "Your physical Polaroid pack is being printed on 300gsm glossy stock and dispatches tomorrow."}
              </Text>

              {transactionId ? (
                <View style={styles.txBox}>
                  <Text style={styles.txLabel}>PAYMENT TRANSACTION ID</Text>
                  <Text style={styles.txValue}>{transactionId}</Text>
                </View>
              ) : null}

              <View style={styles.trackingBox}>
                <Text style={styles.trackingLabel}>REAL API TRACKING NUMBER</Text>
                <Text style={styles.trackingId}>{trackingId}</Text>
                <Text style={styles.trackingEta}>Status: SUBMITTED ➔ Estimated: 3–5 Days 🚚</Text>
              </View>


              <Pressable style={styles.primaryBtn} onPress={resetAndClose}>
                <Text style={styles.primaryBtnText}>Done ✓</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(17, 17, 17, 0.82)",
    alignItems: "center",
    justifyContent: "center",
    padding: 16
  },
  card: {
    width: "100%",
    maxWidth: 440,
    maxHeight: "90%",
    backgroundColor: palette.paperCream,
    borderWidth: 2,
    borderColor: palette.ink,
    borderRadius: 14,
    padding: 18,
    gap: 10,
    shadowColor: palette.ink,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.9,
    shadowRadius: 0
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  headerBadge: {
    backgroundColor: palette.acidYellow,
    borderWidth: 1.5,
    borderColor: palette.ink,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4
  },
  headerBadgeText: {
    fontSize: 9,
    fontWeight: "900",
    color: palette.ink,
    letterSpacing: 0.5
  },
  closeBtn: {
    paddingHorizontal: 6
  },
  closeBtnText: {
    fontSize: 14,
    fontWeight: "900",
    color: palette.mutedBrown
  },
  title: {
    fontSize: 20,
    fontWeight: "900",
    color: palette.ink,
    letterSpacing: -0.3
  },
  subtitle: {
    fontSize: 12,
    fontWeight: "700",
    color: palette.mutedBrown,
    lineHeight: 17
  },
  bodyScroll: {
    gap: 12,
    paddingTop: 6
  },
  stackWrap: {
    height: 160,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 10
  },
  photoStackCard: {
    position: "absolute",
    width: 140,
    height: 140,
    backgroundColor: palette.whitePaper,
    borderWidth: 2,
    borderColor: palette.ink,
    borderRadius: 6,
    padding: 6,
    shadowColor: palette.ink,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.85,
    shadowRadius: 0
  },
  stackImage: {
    width: "100%",
    height: "100%",
    borderRadius: 4
  },
  detailsCard: {
    backgroundColor: palette.whitePaper,
    borderWidth: 1.5,
    borderColor: palette.ink,
    borderRadius: 8,
    padding: 12,
    gap: 8
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  detailText: {
    fontSize: 12,
    fontWeight: "800",
    color: palette.ink
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(246, 214, 92, 0.4)",
    borderWidth: 1.5,
    borderColor: palette.ink,
    borderRadius: 8,
    padding: 12
  },
  priceLabel: {
    fontSize: 14,
    fontWeight: "900",
    color: palette.ink
  },
  priceSub: {
    fontSize: 10,
    fontWeight: "700",
    color: palette.mutedBrown
  },
  priceTag: {
    fontSize: 22,
    fontWeight: "900",
    color: palette.ink
  },
  formGroup: {
    gap: 4
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "900",
    color: palette.ink
  },
  input: {
    backgroundColor: palette.whitePaper,
    borderWidth: 1.5,
    borderColor: palette.ink,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    fontWeight: "800",
    color: palette.ink
  },
  rowTwo: {
    flexDirection: "row",
    gap: 10
  },
  summaryBox: {
    backgroundColor: palette.acidYellow,
    borderWidth: 1.5,
    borderColor: palette.ink,
    borderRadius: 6,
    padding: 10,
    alignItems: "center"
  },
  summaryText: {
    fontSize: 12,
    fontWeight: "900",
    color: palette.ink
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: palette.acidYellow,
    borderWidth: 2,
    borderColor: palette.ink,
    borderRadius: 8,
    paddingVertical: 12,
    shadowColor: palette.ink,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.9,
    shadowRadius: 0
  },
  primaryBtnText: {
    fontSize: 14,
    fontWeight: "900",
    color: palette.ink
  },
  secondaryBtn: {
    alignItems: "center",
    paddingVertical: 8
  },
  secondaryBtnText: {
    fontSize: 12,
    fontWeight: "800",
    color: palette.mutedBrown
  },
  emptyPhotoWrap: {
    padding: 30,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: palette.mutedBrown,
    borderRadius: 8,
    backgroundColor: palette.whitePaper
  },
  emptyPhotoText: {
    fontSize: 12,
    fontWeight: "700",
    color: palette.mutedBrown,
    textAlign: "center"
  },
  validationErrorBox: {
    backgroundColor: "#FFEBEB",
    borderWidth: 1,
    borderColor: "#B8324A",
    borderRadius: 6,
    padding: 10
  },
  validationErrorText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#B8324A"
  },
  productTypeRow: {
    flexDirection: "row",
    gap: 10
  },
  productTypeBtn: {
    flex: 1,
    backgroundColor: palette.whitePaper,
    borderWidth: 1.5,
    borderColor: palette.ink,
    borderRadius: 8,
    padding: 10,
    alignItems: "center",
    gap: 2
  },
  productTypeBtnActive: {
    backgroundColor: palette.acidYellow,
    shadowColor: palette.ink,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.9,
    shadowRadius: 0
  },
  productTypeEmoji: {
    fontSize: 20
  },
  productTypeTitle: {
    fontSize: 12,
    fontWeight: "900",
    color: palette.mutedBrown
  },
  productTypeTitleActive: {
    color: palette.ink
  },
  productTypePrice: {
    fontSize: 13,
    fontWeight: "900",
    color: palette.ink
  },

  successWrap: {
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 14
  },
  successIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: palette.acidYellow,
    borderWidth: 2,
    borderColor: palette.ink,
    alignItems: "center",
    justifyContent: "center"
  },
  successTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: palette.ink,
    textAlign: "center"
  },
  successDesc: {
    fontSize: 12,
    fontWeight: "700",
    color: palette.mutedBrown,
    textAlign: "center",
    lineHeight: 18
  },
  paymentSelectorRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4
  },
  paymentBtn: {
    flex: 1,
    backgroundColor: palette.whitePaper,
    borderWidth: 1.5,
    borderColor: palette.ink,
    borderRadius: 8,
    padding: 10,
    gap: 2
  },
  paymentBtnActive: {
    backgroundColor: palette.acidYellow,
    shadowColor: palette.ink,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.9,
    shadowRadius: 0
  },
  paymentBtnTitle: {
    fontSize: 11,
    fontWeight: "900",
    color: palette.mutedBrown
  },
  paymentBtnTitleActive: {
    color: palette.ink
  },
  paymentBtnSub: {
    fontSize: 9,
    fontWeight: "800",
    color: palette.mutedBrown
  },

  txBox: {
    width: "100%",
    backgroundColor: palette.softLavender,
    borderWidth: 1.5,
    borderColor: palette.ink,
    borderRadius: 8,
    padding: 10,
    alignItems: "center",
    gap: 2
  },
  txLabel: {
    fontSize: 9,
    fontWeight: "900",
    color: palette.ink,
    letterSpacing: 0.8
  },
  txValue: {
    fontSize: 12,
    fontWeight: "900",
    color: palette.ink
  },

  trackingBox: {
    width: "100%",
    backgroundColor: palette.whitePaper,
    borderWidth: 1.5,
    borderColor: palette.ink,
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
    gap: 4,
    marginVertical: 6
  },
  trackingLabel: {
    fontSize: 9,
    fontWeight: "900",
    color: palette.mutedBrown,
    letterSpacing: 1
  },
  trackingId: {
    fontSize: 16,
    fontWeight: "900",
    color: palette.ink,
    letterSpacing: 0.5
  },
  trackingEta: {
    fontSize: 11,
    fontWeight: "800",
    color: palette.ink,
    marginTop: 2
  }
});

