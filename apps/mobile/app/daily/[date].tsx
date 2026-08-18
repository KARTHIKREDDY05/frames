import { useLocalSearchParams } from "expo-router";
import { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import type { DailyFrameDto } from "@frames/types";
import { palette } from "@frames/ui";
import { ScrapbookPage } from "../../components/ScrapbookPage";
import { useAppStore } from "../../store/appStore";

export default function DailyFrameScreen() {
  const { date } = useLocalSearchParams<{ date: string }>();
  const dailyFrames = useAppStore((state) => state.dailyFrames);
  const posts = useAppStore((state) => state.posts);
  const currentUser = useAppStore((state) => state.currentUser);
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
        <Text style={styles.kicker}>ARCHIVE PAGE</Text>
        <Text style={styles.title}>{frame.title}</Text>
        <Text style={styles.subtitle}>{frame.subtitle}</Text>
        <Text style={styles.timeRange}>{formatDayTimeRange(frame.posts.map((post) => post.createdAt))}</Text>
      </View>
      <ScrapbookPage frame={frame} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.paperCream },
  content: { padding: 18, paddingTop: 42, paddingBottom: 110, gap: 14 },
  hero: { backgroundColor: palette.ink, borderRadius: 8, padding: 18, gap: 5 },
  kicker: { color: palette.sunshine, fontSize: 12, fontWeight: "900" },
  title: { fontSize: 32, fontWeight: "900", color: palette.whitePaper },
  subtitle: { color: "#D8CFC7", fontSize: 16, lineHeight: 22 },
  timeRange: { color: palette.sunshine, fontSize: 12, fontWeight: "900", marginTop: 4 },
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
