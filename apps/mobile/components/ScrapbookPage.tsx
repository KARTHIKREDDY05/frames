import { Image, StyleSheet, Text, View } from "react-native";
import type { DailyFrameDto } from "@frames/types";
import { palette } from "@frames/ui";

export function ScrapbookPage({ frame }: { frame: DailyFrameDto }) {
  return (
    <View style={styles.page}>
      <Text style={styles.note}>CAPTURE NOW - ORGANIZE NEVER</Text>
      {frame.posts.slice(0, 3).map((post, index) => (
        <View key={post.id} style={[styles.photo, index === 1 && styles.right, index === 2 && styles.wide]}>
          <Image source={{ uri: post.mediaUrl }} style={styles.image} />
          <Text style={styles.caption}>{post.locationName}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { minHeight: 620, backgroundColor: palette.whitePaper, borderRadius: 8, borderWidth: 1, borderColor: "#E4D9CA", padding: 16 },
  note: { color: palette.mutedBrown, fontWeight: "900", fontSize: 12, marginBottom: 12 },
  photo: { width: "68%", backgroundColor: "#FFFFFF", padding: 10, paddingBottom: 34, transform: [{ rotate: "-4deg" }], shadowColor: palette.ink, shadowOpacity: 0.12, shadowRadius: 12 },
  right: { alignSelf: "flex-end", marginTop: -30, transform: [{ rotate: "5deg" }] },
  wide: { width: "82%", marginTop: 8, transform: [{ rotate: "-1deg" }] },
  image: { width: "100%", aspectRatio: 1.05, borderRadius: 4 },
  caption: { color: palette.mutedBrown, marginTop: 8, fontWeight: "700" }
});
