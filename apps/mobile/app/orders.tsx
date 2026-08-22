import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { palette } from "@frames/ui";
import type { PrintOrderDto } from "@frames/types";
import { AppIcon } from "../components/AppIcon";
import { cancelPrintOrderApi, getUserPrintOrdersApi } from "../services/printApi";
import { useAppStore } from "../store/appStore";

const STATUS_COLORS: Record<string, string> = {
  PENDING:    "#E5D5C4",
  SUBMITTED:  "#C8DCE8",
  PROCESSING: "#F5C6AF",
  PRINTING:   "#F3E388",
  SHIPPED:    "#C8D7C0",
  DELIVERED:  "#B9E7B3",
  CANCELLED:  "#F5B8B8",
  FAILED:     "#F5B8B8"
};


const STATUS_ICONS: Record<string, string> = {
  PENDING:    "clock",
  SUBMITTED:  "spark",
  PROCESSING: "spark",
  SHIPPED:    "send",
  DELIVERED:  "check",
  CANCELLED:  "bell",
  FAILED:     "bell",
};

const PRODUCT_EMOJIS: Record<string, string> = {
  POLAROID_PACK: "📸",
  FRIDGE_MAGNETS: "🧲",
  SCRAPBOOK_ALBUM: "📖",
  KEEPSAKE_CAPSULE: "🎁"
};

const PRODUCT_NAMES: Record<string, string> = {
  POLAROID_PACK: "Physical Polaroid Pack",
  FRIDGE_MAGNETS: "Ceramic Fridge Magnet Set",
  SCRAPBOOK_ALBUM: "Hardcover Scrapbook Album",
  KEEPSAKE_CAPSULE: "Wax-Sealed Keepsake Box"
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric", year: "numeric"
  });
}

export default function OrdersScreen() {
  const storeOrders = useAppStore((state) => state.printOrders);
  const setStoreOrders = useAppStore((state) => state.setPrintOrders);
  const [orders, setOrders] = useState<PrintOrderDto[]>(storeOrders);
  const [loading, setLoading] = useState(storeOrders.length === 0);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = async () => {
    setError(null);
    try {
      const result = await getUserPrintOrdersApi();
      if (result.items && result.items.length > 0) {
        setOrders(result.items);
        setStoreOrders(result.items);
      } else if (storeOrders.length > 0) {
        setOrders(storeOrders);
      }
    } catch {
      if (storeOrders.length > 0) {
        setOrders(storeOrders);
      } else {
        setError("Could not load print orders. Check your connection.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchOrders();
  }, []);

  const handleCancelOrder = async (orderId: string) => {
    try {
      await cancelPrintOrderApi(orderId);
      await fetchOrders();
    } catch {
      // Ignored
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.topBar}>
        <Pressable style={styles.iconButton} onPress={() => router.back()}>
          <AppIcon name="arrow-left" color={palette.ink} size={18} />
        </Pressable>
        <Text style={styles.title}>Purchases & Orders</Text>
        <Pressable style={styles.refreshBtn} onPress={() => { void fetchOrders(); }}>
          <AppIcon name="spark" color={palette.ink} size={16} />
        </Pressable>
      </View>

      <Text style={styles.subtitle}>
        Your physical Polaroid print packs, custom fridge magnets, and shipping tracking.
      </Text>

      {loading && (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={palette.ink} size="large" />
          <Text style={styles.loadingText}>Loading your orders...</Text>
        </View>
      )}

      {error && (
        <View style={styles.errorCard}>
          <AppIcon name="bell" color={palette.ink} size={18} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {!loading && !error && orders.length === 0 && (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No physical orders yet</Text>
          <Text style={styles.emptyCopy}>
            When you order physical Polaroid packs or custom ceramic fridge magnets from your daily memories, they will appear here.
          </Text>
          <Pressable style={styles.ctaBtn} onPress={() => router.push("/(tabs)/archive")}>
            <AppIcon name="archive" color={palette.ink} size={16} />
            <Text style={styles.ctaText}>Browse Archive</Text>
          </Pressable>
        </View>
      )}


      {!loading && orders.map((order) => {
        const productType = (order as any).productType || "POLAROID_PACK";
        const emoji = PRODUCT_EMOJIS[productType] || "📦";

        return (
          <View key={order.id} style={styles.orderCard}>
            {/* Status badge */}
            <View style={styles.orderHeader}>
              <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[order.status] ?? palette.softPeach }]}>
                <AppIcon name={(STATUS_ICONS[order.status] ?? "bell") as any} color={palette.ink} size={11} />
                <Text style={styles.statusText}>{order.status}</Text>
              </View>
              <Text style={styles.orderId}>{order.orderId}</Text>
            </View>

            <View style={styles.productRow}>
              <Text style={{ fontSize: 22 }}>{emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.orderDate}>{order.dateTitle}</Text>
                <Text style={styles.orderMeta}>
                  {productType.replace("_", " ")} · {order.photoUrls.length} Photos · {order.totalPrice}
                </Text>
              </View>
            </View>

            {/* Shipping address */}
            <View style={styles.addressBox}>
              <Text style={styles.addressLabel}>SHIP TO</Text>
              <Text style={styles.addressLine}>{order.shippingAddress.name}</Text>
              <Text style={styles.addressLine}>
                {order.shippingAddress.addressLine1}, {order.shippingAddress.city} {order.shippingAddress.zipCode}
              </Text>
            </View>

              {/* Tracking */}
              {order.trackingNumber && (
                <View style={styles.trackingBox}>
                  <Text style={styles.trackingLabel}>TRACKING NUMBER</Text>
                  <Text style={styles.trackingValue}>{order.trackingNumber}</Text>
                  {order.estimatedDelivery && (
                    <Text style={styles.trackingEta}>
                      Est. Delivery: {formatDate(order.estimatedDelivery)} 🚚
                    </Text>
                  )}
                </View>
              )}

              {/* Cancel Action for Pending Orders */}
              {order.status === "SUBMITTED" || order.status === "PENDING" ? (
                <View style={styles.orderActionsRow}>
                  <Pressable
                    style={styles.cancelOrderBtn}
                    onPress={() => handleCancelOrder(order.orderId)}
                  >
                    <Text style={styles.cancelOrderBtnText}>Cancel Order</Text>
                  </Pressable>
                </View>
              ) : null}

              <Text style={styles.orderTime}>Ordered {formatDate(order.createdAt)}</Text>
            </View>
          );
        })}
      </ScrollView>
    );
  }


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.paperCream },
  content: { padding: 16, paddingTop: 52, paddingBottom: 60, gap: 14 },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: palette.whitePaper,
    borderWidth: 1.5,
    borderColor: palette.ink,
    alignItems: "center",
    justifyContent: "center"
  },
  title: { fontSize: 20, fontWeight: "900", color: palette.ink },
  refreshBtn: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: palette.acidYellow,
    borderWidth: 1.5,
    borderColor: palette.ink,
    alignItems: "center",
    justifyContent: "center"
  },
  subtitle: { fontSize: 13, fontWeight: "600", color: palette.mutedBrown, lineHeight: 18 },
  loadingWrap: { padding: 40, alignItems: "center", gap: 12 },
  loadingText: { fontSize: 13, fontWeight: "700", color: palette.mutedBrown },
  errorCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: palette.softPeach,
    borderWidth: 1.5,
    borderColor: palette.ink,
    borderRadius: 8,
    padding: 14
  },
  errorText: { fontSize: 13, fontWeight: "700", color: palette.ink, flex: 1 },
  emptyCard: {
    backgroundColor: palette.whitePaper,
    borderWidth: 1.5,
    borderColor: palette.ink,
    borderRadius: 10,
    padding: 24,
    alignItems: "center",
    gap: 10
  },
  emptyTitle: { fontSize: 16, fontWeight: "900", color: palette.ink },
  emptyCopy: { fontSize: 13, fontWeight: "600", color: palette.mutedBrown, textAlign: "center", lineHeight: 18 },
  ctaBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: palette.acidYellow,
    borderWidth: 1.5,
    borderColor: palette.ink,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: 6
  },
  ctaText: { fontSize: 13, fontWeight: "900", color: palette.ink },

  orderCard: {
    backgroundColor: palette.whitePaper,
    borderWidth: 1.5,
    borderColor: palette.ink,
    borderRadius: 10,
    padding: 14,
    gap: 10,
    shadowColor: palette.ink,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 0
  },
  orderHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
    borderColor: palette.ink,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3
  },
  statusText: { fontSize: 10, fontWeight: "900", color: palette.ink, letterSpacing: 0.5 },
  orderId: { fontSize: 11, fontWeight: "900", color: palette.mutedBrown },
  productRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  orderDate: { fontSize: 15, fontWeight: "900", color: palette.ink },
  orderMeta: { fontSize: 12, fontWeight: "700", color: palette.mutedBrown },
  addressBox: {
    backgroundColor: palette.whitePaper,
    borderWidth: 1,
    borderColor: palette.ink,
    borderRadius: 6,
    padding: 10,
    gap: 2
  },
  addressLabel: { fontSize: 9, fontWeight: "900", color: palette.mutedBrown, letterSpacing: 0.5 },
  addressLine: { fontSize: 12, fontWeight: "700", color: palette.ink },
  trackingBox: {
    backgroundColor: palette.softLavender,
    borderWidth: 1,
    borderColor: palette.ink,
    borderRadius: 6,
    padding: 10,
    gap: 3
  },
  trackingLabel: { fontSize: 9, fontWeight: "900", color: palette.ink, letterSpacing: 0.5 },
  trackingValue: { fontSize: 13, fontWeight: "900", color: palette.ink },
  trackingEta: { fontSize: 11, fontWeight: "700", color: palette.ink },

  orderActionsRow: {
    flexDirection: "row",
    justifyContent: "flex-end"
  },
  cancelOrderBtn: {
    borderWidth: 1,
    borderColor: "#B8324A",
    backgroundColor: "#FFF0F0",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6
  },
  cancelOrderBtnText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#B8324A"
  },

  orderTime: { fontSize: 11, fontWeight: "600", color: palette.mutedBrown }
});

