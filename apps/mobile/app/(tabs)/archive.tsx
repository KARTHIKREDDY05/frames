import { Link } from "expo-router";
import { useMemo } from "react";
import { Image, Pressable, SectionList, StyleSheet, Text, View } from "react-native";
import type { DailyFrameDto, PostDto } from "@frames/types";
import { palette } from "@frames/ui";
import { PaperBackground } from "../../components/PaperBackground";
import { useAppStore } from "../../store/appStore";

function makeDailyFrame(date: string, posts: PostDto[]): DailyFrameDto {
  const title = new Date(`${date}T00:00:00`).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  return {
    id: `active-${date}`,
    date,
    title,
    subtitle: "Active Frames from this day.",
    coverMediaUrl: posts[0]?.mediaUrl,
    renderedImageUrl: null,
    metadata: { active: true },
    posts
  };
}

export default function ArchiveTimeline() {
  const dailyFrames = useAppStore((state) => state.dailyFrames);
  const posts = useAppStore((state) => state.posts);
  const currentUser = useAppStore((state) => state.currentUser);
  const archiveFrames = useMemo(() => {
    const ownPosts = posts.filter((post) => post.user.id === currentUser?.id);
    const activeByDate = new Map<string, PostDto[]>();
    ownPosts.forEach((post) => {
      const date = post.createdAt.slice(0, 10);
      activeByDate.set(date, [post, ...(activeByDate.get(date) ?? [])]);
    });
    const activeFrames = Array.from(activeByDate.entries()).map(([date, dayPosts]) => makeDailyFrame(date, dayPosts));
    const archivedDates = new Set(dailyFrames.map((frame) => frame.date));
    return [...dailyFrames, ...activeFrames.filter((frame) => !archivedDates.has(frame.date))]
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [currentUser?.id, dailyFrames, posts]);
  const sections = useMemo(() => {
    const grouped = new Map<string, DailyFrameDto[]>();
    archiveFrames.forEach((frame) => {
      const section = new Date(`${frame.date}T00:00:00`).toLocaleDateString("en-US", { month: "long", year: "numeric" }).toUpperCase();
      grouped.set(section, [...(grouped.get(section) ?? []), frame]);
    });
    return Array.from(grouped.entries()).map(([title, data]) => ({ title, data }));
  }, [archiveFrames]);

  return (
    <PaperBackground>
      <SectionList
        contentContainerStyle={styles.content}
        sections={sections}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <View style={styles.hero}>
            <Text style={styles.kicker}>SCRAPBOOK</Text>
            <Text style={styles.title}>Archive</Text>
            <Text style={styles.copy}>{archiveFrames.length} saved day{archiveFrames.length === 1 ? "" : "s"} from your Frames.</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No Frames in your archive yet.</Text>
            <Text style={styles.emptyCopy}>Capture or upload a Frame and it will appear here immediately.</Text>
          </View>
        }
        renderSectionHeader={({ section }) => <Text style={styles.section}>{section.title}</Text>}
        renderItem={({ item }) => (
          <Link href={`/daily/${item.date}`} asChild>
            <Pressable style={styles.row}>
              <View style={styles.thumbStack}>
                {item.posts.slice(0, 3).map((post, index) => <Image key={post.id} source={{ uri: post.mediaUrl }} style={[styles.thumb, index === 1 && styles.thumbTwo, index === 2 && styles.thumbThree]} />)}
              </View>
              <View style={styles.rowMeta}>
                <Text style={styles.day}>{new Date(`${item.date}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</Text>
                <Text style={styles.weekday}>{item.subtitle}</Text>
                <Text style={styles.count}>{item.posts.length} Frames - latest {formatLatestTime(item.posts)}</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          </Link>
        )}
      />
    </PaperBackground>
  );
}

const styles = StyleSheet.create({
  content: { padding: 18, paddingTop: 34, paddingBottom: 110 },
  hero: { backgroundColor: palette.ink, borderRadius: 8, padding: 18, gap: 6, marginBottom: 8 },
  kicker: { color: palette.sunshine, fontSize: 12, fontWeight: "900" },
  title: { color: palette.whitePaper, fontSize: 34, fontWeight: "900" },
  copy: { color: "#D8CFC7", lineHeight: 22, fontWeight: "700" },
  section: { fontSize: 15, color: palette.mutedBrown, fontWeight: "900", marginVertical: 18 },
  row: { minHeight: 118, padding: 12, marginBottom: 10, backgroundColor: palette.whitePaper, borderRadius: 8, borderWidth: 1, borderColor: "#E4D9CA", flexDirection: "row", alignItems: "center", gap: 14 },
  thumbStack: { width: 88, height: 88, position: "relative" },
  thumb: { position: "absolute", left: 0, top: 0, width: 70, height: 70, borderRadius: 8, backgroundColor: "#E4D9CA", borderWidth: 3, borderColor: palette.whitePaper },
  thumbTwo: { left: 12, top: 10, transform: [{ rotate: "4deg" }] },
  thumbThree: { left: 24, top: 18, transform: [{ rotate: "-4deg" }] },
  rowMeta: { flex: 1 },
  day: { fontSize: 24, color: palette.ink, fontWeight: "900" },
  weekday: { color: palette.mutedBrown, marginTop: 4 },
  count: { color: palette.ink, fontWeight: "800", marginTop: 8 },
  chevron: { color: palette.mutedBrown, fontSize: 30, fontWeight: "300" },
  emptyCard: { backgroundColor: palette.whitePaper, borderRadius: 8, borderWidth: 1, borderColor: "#E4D9CA", marginTop: 90, padding: 18, gap: 8 },
  emptyTitle: { color: palette.ink, fontSize: 24, fontWeight: "900" },
  emptyCopy: { color: palette.mutedBrown, fontSize: 16, lineHeight: 23 }
});

function formatLatestTime(posts: PostDto[]) {
  const latest = [...posts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
  if (!latest) return "none";
  const date = new Date(latest.createdAt);
  if (Number.isNaN(date.getTime())) return "unknown";
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}
