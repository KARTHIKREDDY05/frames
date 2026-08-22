import { useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { DailyFrameDto } from "@frames/types";
import { palette } from "@frames/ui";
import { AppIcon } from "../../components/AppIcon";
import { OrderDailyPackModal } from "../../components/OrderDailyPackModal";
import { ScrapbookPage } from "../../components/ScrapbookPage";
import { useAppStore } from "../../store/appStore";

export default function DailyFrameScreen() {
  const { date } = useLocalSearchParams<{ date: string }>();
  const dailyFrames = useAppStore((state) => state.dailyFrames);
  const posts = useAppStore((state) => state.posts);
  const currentUser = useAppStore((state) => state.currentUser);
  const [orderModalVisible, setOrderModalVisible] = useState(false);

  const frame = useMemo<DailyFrameDto | null>(() => {
    const archived = dailyFrames.find((item) => item.date === date);
    if (archived) return archived;
    const activePosts = posts.filter((post) => post.user.id === currentUser?.id && post.createdAt.slice(0, 10) === date);
    if (activePosts.length === 0 || !date) return null;
    return {
      id: `active-${date}`,
      date,
      title: new Date(`${date}T00:00:00`).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
      subtitle: "Active Frames from this day.",
      coverMediaUrl: activePosts[0]?.mediaUrl,
      renderedImageUrl: null,
      metadata: { active: true },
      posts: activePosts
    };
  }, [currentUser?.id, dailyFrames, date, posts]);

  if (!frame) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No Frames found for this day.</Text>
          <Text style={styles.emptyCopy}>Capture a Frame and it will appear in Archive and Memories automatically.</Text>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <View style={styles.heroHeaderRow}>
          <View style={styles.heroTextWrap}>
            <Text style={styles.kicker}>ARCHIVE PAGE</Text>
            <Text style={styles.title}>{frame.title}</Text>
            <Text style={styles.subtitle}>{frame.subtitle}</Text>
            <Text style={styles.timeRange}>{formatDayTimeRange(frame.posts.map((post) => post.createdAt))}</Text>
          </View>
        </View>

        <Pressable style={styles.orderBannerBtn} onPress={() => setOrderModalVisible(true)}>
          <AppIcon name="spark" color={palette.ink} size={16} />
          <Text style={styles.orderBannerBtnText}>Order Physical Print Pack (₹199) 📦</Text>
        </Pressable>
      </View>

      <ScrapbookPage frame={frame} />

      <OrderDailyPackModal
        visible={orderModalVisible}
        dateTitle={frame.title}
        posts={frame.posts}
        onClose={() => setOrderModalVisible(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.paperCream },
  content: { padding: 18, paddingTop: 42, paddingBottom: 110, gap: 14 },
  hero: { backgroundColor: palette.ink, borderRadius: 10, padding: 18, gap: 12 },
  heroHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  heroTextWrap: { flex: 1, gap: 4 },
  kicker: { color: palette.sunshine, fontSize: 12, fontWeight: "900" },
  title: { fontSize: 26, fontWeight: "900", color: palette.whitePaper },
  subtitle: { color: "#D8CFC7", fontSize: 14, lineHeight: 20 },
  timeRange: { color: palette.sunshine, fontSize: 12, fontWeight: "900", marginTop: 2 },
  orderBannerBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: palette.acidYellow,
    borderWidth: 2,
    borderColor: palette.whitePaper,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14
  },
  orderBannerBtnText: {
    fontSize: 13,
    fontWeight: "900",
    color: palette.ink
  },
  emptyCard: { backgroundColor: palette.whitePaper, borderRadius: 8, borderWidth: 1, borderColor: "#E4D9CA", padding: 18, gap: 8 },
  emptyTitle: { color: palette.ink, fontSize: 24, fontWeight: "900" },
  emptyCopy: { color: palette.mutedBrown, fontSize: 16, lineHeight: 23 }
});

function formatDayTimeRange(values: string[]) {
  const dates = values.map((value) => new Date(value)).filter((date) => !Number.isNaN(date.getTime())).sort((a, b) => a.getTime() - b.getTime());
  if (dates.length === 0) return "No capture timestamp";
  const format = (date: Date) => date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  if (dates.length === 1) return `Captured ${format(dates[0]!)}`;
  return `Captured ${format(dates[0]!)} - ${format(dates[dates.length - 1]!)}`;
}
