import { Link } from "expo-router";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { palette } from "@frames/ui";
import { FrameButton } from "../../components/FrameButton";
import { FrameCard } from "../../components/FrameCard";
import { PaperBackground } from "../../components/PaperBackground";
import { useAppStore } from "../../store/appStore";

export default function HomeFeed() {
  const posts = useAppStore((state) => state.posts);
  const archiveExpiredNow = useAppStore((state) => state.archiveExpiredNow);
  return (
    <PaperBackground>
      <FlatList
        contentContainerStyle={styles.content}
        data={posts}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={<View style={styles.header}><Text style={styles.title}>Today</Text><FrameButton label="Simulate 24h Archive" variant="secondary" onPress={archiveExpiredNow} /></View>}
        ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyTitle}>Today's page is still blank.</Text><Text style={styles.emptyCopy}>Capture something worth remembering.</Text><Link href="/(tabs)/camera" asChild><FrameButton label="Take your first Frame" /></Link></View>}
        renderItem={({ item, index }) => <FrameCard post={item} tilt={index % 2 === 0 ? "-1.5deg" : "1.3deg"} />}
      />
    </PaperBackground>
  );
}

const styles = StyleSheet.create({
  content: { padding: 18, gap: 18, paddingBottom: 110 },
  header: { gap: 12, marginBottom: 8 },
  title: { fontSize: 34, fontWeight: "900", color: palette.ink, marginVertical: 12 },
  empty: { gap: 12, paddingTop: 160 },
  emptyTitle: { fontSize: 28, fontWeight: "900", color: palette.ink },
  emptyCopy: { color: palette.mutedBrown, fontSize: 17 }
});
