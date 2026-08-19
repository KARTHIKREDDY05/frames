import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Image, Pressable, Share, StyleSheet, Text, View } from "react-native";
import { palette } from "@frames/ui";
import { AppIcon } from "../components/AppIcon";
import { FrameButton } from "../components/FrameButton";
import { useAppStore } from "../store/appStore";

export default function ShareLinkModal() {
  const params = useLocalSearchParams<{ resourceType?: "profile" | "post" | "daily_frame"; resourceId?: string }>();
  const currentUser = useAppStore((state) => state.currentUser);
  const [copied, setCopied] = useState(false);

  const baseUrl = "https://frames-test-build.vercel.app";
  let shareUrl = `${baseUrl}/user/${currentUser?.id ?? "me"}`;
  let shareTitle = `${currentUser?.displayName ?? "My"} Frames Scrapbook`;

  if (params.resourceType === "post" && params.resourceId) {
    shareUrl = `${baseUrl}/post/${params.resourceId}`;
    shareTitle = "Check out this Frame!";
  } else if (params.resourceType === "daily_frame" && params.resourceId) {
    shareUrl = `${baseUrl}/daily/${params.resourceId}`;
    shareTitle = "Daily Scrapbook Frame";
  }

  const handleShare = async () => {
    try {
      await Share.share({
        title: shareTitle,
        message: `Join me on Frames! Follow my scrapbook here: ${shareUrl}`,
        url: shareUrl
      });
    } catch {
      // Ignored
    }
  };

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.closeBtn} onPress={() => router.back()}>
          <AppIcon name="arrow-left" color={palette.ink} size={20} />
        </Pressable>
        <Text style={styles.title}>Share Your Frame</Text>
        <View style={{ width: 38 }} />
      </View>

      <View style={styles.shareCard}>
        <View style={styles.avatarWrap}>
          <Image source={{ uri: currentUser?.avatarUrl ?? undefined }} style={styles.avatar} />
        </View>

        <Text style={styles.userName}>{currentUser?.displayName ?? "Frames User"}</Text>
        <Text style={styles.userHandle}>@{currentUser?.username ?? "user"}</Text>
        
        <View style={styles.privacyBadge}>
          <Text style={styles.privacyBadgeText}>
            {currentUser?.profileVisibility === "PRIVATE" ? "🔒 Private Account (Followers Only)" : "🌍 Public Account"}
          </Text>
        </View>

        <View style={styles.urlBox}>
          <Text numberOfLines={1} style={styles.urlText}>{shareUrl}</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <FrameButton icon="send" label="Share via Apps..." onPress={() => { void handleShare(); }} />
        <FrameButton icon="check" label={copied ? "Link Copied!" : "Copy Link"} variant="secondary" onPress={handleCopy} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.paperCream, padding: 20, paddingTop: 48, gap: 16 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  closeBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: palette.whitePaper, borderWidth: 1, borderColor: "#E4D9CA", alignItems: "center", justifyContent: "center" },
  title: { fontSize: 20, fontWeight: "900", color: palette.ink },
  shareCard: {
    backgroundColor: palette.whitePaper,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E4D9CA",
    padding: 24,
    alignItems: "center",
    gap: 8,
    marginTop: 10
  },
  avatarWrap: { marginBottom: 6 },
  avatar: { width: 84, height: 84, borderRadius: 42, backgroundColor: "#E4D9CA", borderWidth: 3, borderColor: palette.whitePaper },
  userName: { fontSize: 22, fontWeight: "900", color: palette.ink },
  userHandle: { fontSize: 14, color: palette.mutedBrown, fontWeight: "800" },
  privacyBadge: { backgroundColor: palette.paperCream, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, marginTop: 4 },
  privacyBadgeText: { fontSize: 12, fontWeight: "800", color: palette.ink },
  urlBox: {
    width: "100%",
    backgroundColor: palette.paperCream,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E4D9CA",
    padding: 12,
    marginTop: 12
  },
  urlText: { fontSize: 13, color: palette.ink, fontWeight: "700", textAlign: "center" },
  actions: { gap: 10, marginTop: 10 }
});
