import { useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { palette } from "@frames/ui";
import { AppIcon } from "./AppIcon";

// Official Google AdMob Test Unit ID (Safe for testing & review)
const GOOGLE_ADMOB_TEST_BANNER_ID = "ca-app-pub-3940256099942544/6300978111";

export function AdBanner({ unitId = GOOGLE_ADMOB_TEST_BANNER_ID }: { unitId?: string }) {
  const [closed, setClosed] = useState(false);

  if (closed) return null;

  return (
    <View style={styles.container}>
      <View style={styles.tapePin} />
      <View style={styles.adHeader}>
        <View style={styles.adBadge}>
          <Text style={styles.adBadgeText}>SPONSORED AD</Text>
        </View>
        <Text style={styles.adMeta}>Google AdMob • {unitId.slice(0, 18)}...</Text>
        <Pressable onPress={() => setClosed(true)} style={styles.closeBtn}>
          <Text style={styles.closeBtnText}>✕</Text>
        </Pressable>
      </View>

      <View style={styles.adBody}>
        <View style={styles.adIconBox}>
          <AppIcon name="spark" color={palette.ink} size={22} />
        </View>
        <View style={styles.adTextWrap}>
          <Text style={styles.adTitle}>Support Frames Free Mobile App</Text>
          <Text style={styles.adSubtitle}>Tap to check out featured sponsor offers. Revenue keeps daily memories free!</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 14,
    marginHorizontal: 4,
    backgroundColor: palette.paperCream,
    borderWidth: 2,
    borderColor: palette.ink,
    borderRadius: 10,
    padding: 12,
    position: "relative",
    shadowColor: palette.ink,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.85,
    shadowRadius: 0
  },
  tapePin: {
    position: "absolute",
    top: -8,
    alignSelf: "center",
    width: 60,
    height: 14,
    backgroundColor: "rgba(246, 214, 92, 0.85)",
    borderWidth: 1,
    borderColor: palette.ink,
    transform: [{ rotate: "-2deg" }],
    zIndex: 5
  },
  adHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8
  },
  adBadge: {
    backgroundColor: palette.acidYellow,
    borderWidth: 1,
    borderColor: palette.ink,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  adBadgeText: {
    fontSize: 9,
    fontWeight: "900",
    color: palette.ink,
    letterSpacing: 0.5
  },
  adMeta: {
    fontSize: 9,
    fontWeight: "700",
    color: palette.mutedBrown
  },
  closeBtn: {
    paddingHorizontal: 6
  },
  closeBtnText: {
    fontSize: 11,
    fontWeight: "900",
    color: palette.mutedBrown
  },
  adBody: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  adIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: palette.acidYellow,
    borderWidth: 1.5,
    borderColor: palette.ink,
    alignItems: "center",
    justifyContent: "center"
  },
  adTextWrap: {
    flex: 1
  },
  adTitle: {
    fontSize: 13,
    fontWeight: "900",
    color: palette.ink
  },
  adSubtitle: {
    fontSize: 11,
    fontWeight: "700",
    color: palette.mutedBrown,
    marginTop: 2,
    lineHeight: 15
  }
});
