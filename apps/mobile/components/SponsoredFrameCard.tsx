import { useState } from "react";
import { Image, Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { palette } from "@frames/ui";
import { AppIcon } from "./AppIcon";

export interface SponsoredAdData {
  id: string;
  brandName: string;
  brandAvatarUrl: string;
  mediaUrl: string;
  caption: string;
  sponsorUrl: string;
  tagline: string;
}

const defaultAdPlaceholder: SponsoredAdData = {
  id: "ad-placeholder-1",
  brandName: "Sponsored Partner",
  brandAvatarUrl: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=150&q=80",
  mediaUrl: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80",
  caption: "Promoted Content • Tap to explore partner offers and exclusive updates.",
  sponsorUrl: "https://frames-test-build.vercel.app",
  tagline: "GOOGLE ADMOB • SPONSORED PLACEHOLDER"
};

export function SponsoredFrameCard({
  sponsor = defaultAdPlaceholder,
  tilt = "0deg"
}: {
  sponsor?: SponsoredAdData;
  tilt?: string;
}) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const handleOpenAd = () => {
    if (sponsor.sponsorUrl) {
      void Linking.openURL(sponsor.sponsorUrl);
    }
  };

  return (
    <View style={[styles.cardContainer, { transform: [{ rotate: tilt }] }]}>
      {/* Minimal Ad Header */}
      <View style={styles.adHeader}>
        <View style={styles.sponsorInfo}>
          <Image source={{ uri: sponsor.brandAvatarUrl }} style={styles.brandLogo} />
          <View style={styles.sponsorTextWrap}>
            <View style={styles.badgeRow}>
              <Text style={styles.brandTitle}>{sponsor.brandName}</Text>
              <View style={styles.adBadge}>
                <Text style={styles.adBadgeLabel}>SPONSORED</Text>
              </View>
            </View>
            <Text style={styles.subtext}>{sponsor.tagline}</Text>
          </View>
        </View>

        <Pressable style={styles.dismissButton} onPress={() => setDismissed(true)}>
          <Text style={styles.dismissText}>✕</Text>
        </Pressable>
      </View>

      {/* Clean Polaroid Ad Frame Container */}
      <Pressable style={styles.adBody} onPress={handleOpenAd}>
        <Image source={{ uri: sponsor.mediaUrl }} style={styles.adMedia} resizeMode="cover" />
        <View style={styles.adContentWrap}>
          <Text style={styles.adCaption}>{sponsor.caption}</Text>
        </View>
      </Pressable>

      {/* Minimal Footer Action */}
      <View style={styles.adFooter}>
        <Text style={styles.adLabel}>Ad Placement</Text>
        <Pressable style={styles.learnMoreButton} onPress={handleOpenAd}>
          <AppIcon name="spark" color={palette.ink} size={14} />
          <Text style={styles.learnMoreText}>Learn More ➔</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    marginVertical: 14,
    backgroundColor: palette.paperCream,
    borderWidth: 1.5,
    borderColor: palette.ink,
    borderRadius: 10,
    padding: 12,
    shadowColor: "rgba(0,0,0,0.12)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2
  },
  adHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10
  },
  sponsorInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1
  },
  brandLogo: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.ink
  },
  sponsorTextWrap: {
    flex: 1
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  brandTitle: {
    fontSize: 13,
    fontWeight: "900",
    color: palette.ink
  },
  adBadge: {
    backgroundColor: palette.acidYellow,
    borderWidth: 1,
    borderColor: palette.ink,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3
  },
  adBadgeLabel: {
    fontSize: 8,
    fontWeight: "900",
    color: palette.ink,
    letterSpacing: 0.5
  },
  subtext: {
    fontSize: 9,
    fontWeight: "700",
    color: palette.mutedBrown,
    marginTop: 1
  },
  dismissButton: {
    padding: 6
  },
  dismissText: {
    fontSize: 12,
    fontWeight: "900",
    color: palette.mutedBrown
  },
  adBody: {
    backgroundColor: palette.whitePaper,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.15)",
    borderRadius: 6,
    padding: 8
  },
  adMedia: {
    width: "100%",
    aspectRatio: 1.35,
    borderRadius: 4
  },
  adContentWrap: {
    paddingTop: 8,
    paddingHorizontal: 2
  },
  adCaption: {
    fontSize: 12,
    fontWeight: "700",
    color: palette.ink,
    lineHeight: 16
  },
  adFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10
  },
  adLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: palette.mutedBrown
  },
  learnMoreButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: palette.acidYellow,
    borderWidth: 1.5,
    borderColor: palette.ink,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 5
  },
  learnMoreText: {
    fontSize: 11,
    fontWeight: "900",
    color: palette.ink
  }
});
