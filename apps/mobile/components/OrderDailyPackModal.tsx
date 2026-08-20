import { useState } from "react";
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import type { PostDto } from "@frames/types";
import { palette } from "@frames/ui";
import { AppIcon } from "./AppIcon";
import { sendOrderToPrintPartner } from "../services/printPartnerApi";
import { createRemotePrintOrder } from "../services/supabase";

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
  const [step, setStep] = useState<"preview" | "address" | "success">("preview");
  const [name, setName] = useState("Karthik Reddy");
  const [address, setAddress] = useState("123 Scrapbook Way, Suite 404");
  const [city, setCity] = useState("Bengaluru");
  const [zip, setZip] = useState("560001");
  const [trackingId, setTrackingId] = useState("");
  const [loading, setLoading] = useState(false);

  const photoCount = Math.max(posts.length, 3);
  const packPrice = photoCount > 5 ? "$6.99" : "$4.99";

  const handleOrder = async () => {
    setLoading(true);
    const photoUrls = posts.map((p) => p.mediaUrl);
    const result = await createRemotePrintOrder({
      dateTitle,
      photoUrls,
      shippingName: name,
      shippingAddress: address,
      city,
      zipCode: zip,
      totalPrice: packPrice
    });

    // Dispatch order payload to print partner fulfillment API
    await sendOrderToPrintPartner(
      result.trackingId,
      { name, address, city, zip, country: "IN" },
      photoUrls
    );

    setLoading(false);
    setTrackingId(result.trackingId);
    setStep("success");
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
              <Text style={styles.headerBadgeText}>PHYSICAL POLAROID PRINT PACK</Text>
            </View>
            <Pressable style={styles.closeBtn} onPress={resetAndClose}>
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
          </View>

          <Text style={styles.title}>{dateTitle}</Text>
          <Text style={styles.subtitle}>
            {step === "success"
              ? "Your physical print order is confirmed!"
              : `Order physical glossy Polaroid prints of all ${photoCount} captured moments from this day.`}
          </Text>

          {step === "preview" && (
            <ScrollView contentContainerStyle={styles.bodyScroll}>
              {/* Photo Stack Preview */}
              <View style={styles.stackWrap}>
                {posts.slice(0, 4).map((post, idx) => (
                  <View
                    key={post.id || idx}
                    style={[
                      styles.photoStackCard,
                      { transform: [{ rotate: `${(idx - 1.5) * 5}deg` }], zIndex: 10 - idx }
                    ]}
                  >
                    <Image source={{ uri: post.mediaUrl }} style={styles.stackImage} resizeMode="cover" />
                  </View>
                ))}
              </View>

              {/* Package Details */}
              <View style={styles.detailsCard}>
                <View style={styles.detailRow}>
                  <AppIcon name="gallery" color={palette.ink} size={18} />
                  <Text style={styles.detailText}>{photoCount} High-Gloss Polaroid Prints (4x5")</Text>
                </View>
                <View style={styles.detailRow}>
                  <AppIcon name="spark" color={palette.ink} size={18} />
                  <Text style={styles.detailText}>Includes Retro Paper Envelope Pouch</Text>
                </View>
                <View style={styles.detailRow}>
                  <AppIcon name="public" color={palette.ink} size={18} />
                  <Text style={styles.detailText}>Delivered to Your Doorstep in 3–5 Days</Text>
                </View>
              </View>

              {/* Price Row */}
              <View style={styles.priceRow}>
                <View>
                  <Text style={styles.priceLabel}>Daily Pack Total</Text>
                  <Text style={styles.priceSub}>Free Global Shipping</Text>
                </View>
                <Text style={styles.priceTag}>{packPrice}</Text>
              </View>

              <Pressable style={styles.primaryBtn} onPress={() => setStep("address")}>
                <AppIcon name="spark" color={palette.ink} size={18} />
                <Text style={styles.primaryBtnText}>Enter Shipping Address ➔</Text>
              </Pressable>
            </ScrollView>
          )}

          {step === "address" && (
            <ScrollView contentContainerStyle={styles.bodyScroll}>
              <View style={styles.formGroup}>
                <Text style={styles.fieldLabel}>Full Name</Text>
                <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Your Full Name" />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.fieldLabel}>Street Address</Text>
                <TextInput style={styles.input} value={address} onChangeText={setAddress} placeholder="Street Address" />
              </View>

              <View style={styles.rowTwo}>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.fieldLabel}>City</Text>
                  <TextInput style={styles.input} value={city} onChangeText={setCity} placeholder="City" />
                </View>

                <View style={[styles.formGroup, { width: 110 }]}>
                  <Text style={styles.fieldLabel}>Zip / Pincode</Text>
                  <TextInput style={styles.input} value={zip} onChangeText={setZip} placeholder="Pincode" keyboardType="numeric" />
                </View>
              </View>

              {/* Summary */}
              <View style={styles.summaryBox}>
                <Text style={styles.summaryText}>Total: {packPrice} ({photoCount} Polaroid Prints + Shipping)</Text>
              </View>

              <Pressable style={styles.primaryBtn} onPress={handleOrder}>
                <AppIcon name="check" color={palette.ink} size={18} />
                <Text style={styles.primaryBtnText}>Confirm Order ({packPrice}) 📦</Text>
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
                Your physical Polaroid pack is being printed on 300gsm glossy stock and dispatches tomorrow.
              </Text>

              <View style={styles.trackingBox}>
                <Text style={styles.trackingLabel}>TRACKING NUMBER</Text>
                <Text style={styles.trackingId}>{trackingId}</Text>
                <Text style={styles.trackingEta}>Estimated Delivery: 3–5 Days 🚚</Text>
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
