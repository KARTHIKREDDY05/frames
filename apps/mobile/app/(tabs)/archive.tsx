import { Link } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, Image, Pressable, StyleSheet, Text, View } from "react-native";
import type { DailyFrameDto, PostDto } from "@frames/types";
import { palette } from "@frames/ui";
import { AppIcon } from "../../components/AppIcon";
import { OrderDailyPackModal } from "../../components/OrderDailyPackModal";
import { PaperBackground } from "../../components/PaperBackground";
import { useAppStore } from "../../store/appStore";

function makeDailyFrame(date: string, posts: PostDto[]): DailyFrameDto {
  const parsedDate = new Date(`${date}T00:00:00`);
  const title = Number.isNaN(parsedDate.getTime())
    ? date
    : parsedDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
  return {
    id: `active-${date}`,
    date,
    title,
    subtitle: `${posts.length} captured moment${posts.length === 1 ? "" : "s"}`,
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
  const [filter, setFilter] = useState<"all" | "pinned" | "month">("all");

  const [orderModalVisible, setOrderModalVisible] = useState(false);
  const [selectedPackDate, setSelectedPackDate] = useState("");
  const [selectedPackPosts, setSelectedPackPosts] = useState<PostDto[]>([]);

  const openOrderPack = (dateTitle: string, packPosts: PostDto[]) => {
    setSelectedPackDate(dateTitle);
    setSelectedPackPosts(packPosts);
    setOrderModalVisible(true);
  };

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

  const totalFramesCount = useMemo(() => {
    const ownPosts = posts.filter((post) => post.user.id === currentUser?.id);
    return ownPosts.length;
  }, [currentUser?.id, posts]);

  const pinnedCount = useMemo(() => {
    return posts.filter((post) => post.user.id === currentUser?.id && post.profileFeatured).length;
  }, [currentUser?.id, posts]);

  const filteredFrames = useMemo(() => {
    const currentYearMonth = new Date().toISOString().slice(0, 7);
    if (filter === "pinned") {
      return archiveFrames.filter((frame) => frame.posts.some((p) => p.profileFeatured));
    }
    if (filter === "month") {
      return archiveFrames.filter((frame) => frame.date.startsWith(currentYearMonth));
    }
    return archiveFrames;
  }, [archiveFrames, filter]);

  return (
    <PaperBackground>
      <FlatList
        contentContainerStyle={styles.content}
        data={filteredFrames}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.hero}>
              <Text style={styles.kicker}>MEMORY TIMELINE</Text>
              <Text style={styles.title}>Memory Book</Text>
              <Text style={styles.copy}>Every day you capture becomes an automatic memory page.</Text>
            </View>

            {/* Stat Counters */}
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{archiveFrames.length}</Text>
                <Text style={styles.statLabel}>Days Logged</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{totalFramesCount}</Text>
                <Text style={styles.statLabel}>Total Frames</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{pinnedCount}</Text>
                <Text style={styles.statLabel}>Pinned ★</Text>
              </View>
            </View>

            {/* Filter Tabs */}
            <View style={styles.filterStrip}>
              <Pressable
                style={[styles.filterTab, filter === "all" && styles.filterTabActive]}
                onPress={() => setFilter("all")}
              >
                <Text style={[styles.filterText, filter === "all" && styles.filterTextActive]}>All Days ({archiveFrames.length})</Text>
              </Pressable>
              <Pressable
                style={[styles.filterTab, filter === "pinned" && styles.filterTabActive]}
                onPress={() => setFilter("pinned")}
              >
                <Text style={[styles.filterText, filter === "pinned" && styles.filterTextActive]}>★ Pinned</Text>
              </Pressable>
              <Pressable
                style={[styles.filterTab, filter === "month" && styles.filterTabActive]}
                onPress={() => setFilter("month")}
              >
                <Text style={[styles.filterText, filter === "month" && styles.filterTextActive]}>This Month</Text>
              </Pressable>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <AppIcon name="archive" color={palette.mutedBrown} size={36} />
            <Text style={styles.emptyTitle}>No archive moments yet.</Text>
            <Text style={styles.emptyCopy}>Capture a photo in the Camera tab and your daily scrapbook page will appear here automatically.</Text>
            <Link href="/(tabs)/camera" asChild>
              <View style={styles.emptyCta}>
                <Text style={styles.emptyCtaText}>Open Camera ›</Text>
              </View>
            </Link>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Link href={`/daily/${item.date}`} asChild>
              <Pressable>
                <View style={styles.cardTop}>
                  <View style={styles.dateBadge}>
                    <Text style={styles.dateMonth}>{formatMonth(item.date)}</Text>
                    <Text style={styles.dateDay}>{formatDay(item.date)}</Text>
                  </View>

                  <View style={styles.cardInfo}>
                    <Text numberOfLines={1} style={styles.cardTitle}>{item.title}</Text>
                    <Text style={styles.cardSubtitle}>{item.subtitle} • Latest {formatLatestTime(item.posts)}</Text>
                  </View>

                  <Text style={styles.chevron}>›</Text>
                </View>

                {/* Photo Collage Strip */}
                <View style={styles.collageRow}>
                  {item.posts.slice(0, 4).map((post, idx) => (
                    <View key={post.id} style={styles.thumbWrap}>
                      <Image source={{ uri: post.mediaUrl }} style={styles.thumbImage} />
                      {post.profileFeatured ? (
                        <View style={styles.pinnedBadge}><Text style={styles.pinnedBadgeText}>★</Text></View>
                      ) : null}
                      {idx === 3 && item.posts.length > 4 ? (
                        <View style={styles.moreOverlay}>
                          <Text style={styles.moreText}>+{item.posts.length - 3}</Text>
                        </View>
                      ) : null}
                    </View>
                  ))}
                </View>
              </Pressable>
            </Link>

            {/* Daily Pack Print Button */}
            <View style={styles.cardFooterRow}>
              <Pressable style={styles.orderPackBtn} onPress={() => openOrderPack(item.title, item.posts)}>
                <AppIcon name="spark" color={palette.ink} size={15} />
                <Text style={styles.orderPackBtnText}>Order Daily Print Pack (₹199) 📦</Text>
              </Pressable>
            </View>
          </View>
        )}
      />

      <OrderDailyPackModal
        visible={orderModalVisible}
        dateTitle={selectedPackDate}
        posts={selectedPackPosts}
        onClose={() => setOrderModalVisible(false)}
      />
    </PaperBackground>
  );
}

function formatMonth(dateStr: string) {
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return "DAY";
  return d.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
}

function formatDay(dateStr: string) {
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return dateStr.slice(-2);
  return d.getDate().toString();
}

function formatLatestTime(posts: PostDto[]) {
  if (posts.length === 0) return "Recent";
  const latest = new Date(posts[0]!.createdAt);
  if (Number.isNaN(latest.getTime())) return "Today";
  return latest.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

const styles = StyleSheet.create({
  content: { padding: 18, paddingBottom: 40, gap: 16 },
  header: { gap: 16, marginBottom: 8 },
  hero: { gap: 4 },
  kicker: { fontSize: 10, fontWeight: "900", color: palette.mutedBrown, letterSpacing: 1.5 },
  title: { fontSize: 26, fontWeight: "900", color: palette.ink, letterSpacing: -0.5 },
  copy: { fontSize: 13, fontWeight: "700", color: palette.ink, lineHeight: 18 },
  statsRow: { flexDirection: "row", gap: 10 },
  statCard: {
    flex: 1,
    backgroundColor: palette.paperCream,
    borderWidth: 2,
    borderColor: palette.ink,
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
    shadowColor: palette.ink,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.85,
    shadowRadius: 0
  },
  statNumber: { fontSize: 22, fontWeight: "900", color: palette.ink },
  statLabel: { fontSize: 10, fontWeight: "800", color: palette.mutedBrown, marginTop: 2 },
  filterStrip: { flexDirection: "row", gap: 8 },
  filterTab: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: palette.whitePaper,
    borderWidth: 1.5,
    borderColor: palette.ink
  },
  filterTabActive: {
    backgroundColor: palette.acidYellow,
    shadowColor: palette.ink,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.85,
    shadowRadius: 0
  },
  filterText: { fontSize: 11, fontWeight: "800", color: palette.mutedBrown },
  filterTextActive: { color: palette.ink, fontWeight: "900" },
  emptyCard: {
    backgroundColor: palette.paperCream,
    borderWidth: 2,
    borderColor: palette.ink,
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    gap: 8,
    marginTop: 12
  },
  emptyTitle: { fontSize: 16, fontWeight: "900", color: palette.ink },
  emptyCopy: { fontSize: 12, fontWeight: "700", color: palette.mutedBrown, textAlign: "center", lineHeight: 18 },
  emptyCta: {
    marginTop: 8,
    backgroundColor: palette.acidYellow,
    borderWidth: 1.5,
    borderColor: palette.ink,
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 8
  },
  emptyCtaText: { fontSize: 12, fontWeight: "900", color: palette.ink },
  card: {
    backgroundColor: palette.paperCream,
    borderWidth: 2,
    borderColor: palette.ink,
    borderRadius: 12,
    padding: 14,
    gap: 12,
    shadowColor: palette.ink,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.85,
    shadowRadius: 0
  },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  dateBadge: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: palette.acidYellow,
    borderWidth: 1.5,
    borderColor: palette.ink,
    alignItems: "center",
    justifyContent: "center"
  },
  dateMonth: { fontSize: 9, fontWeight: "900", color: palette.ink },
  dateDay: { fontSize: 18, fontWeight: "900", color: palette.ink, lineHeight: 20 },
  cardInfo: { flex: 1, gap: 2 },
  cardTitle: { fontSize: 15, fontWeight: "900", color: palette.ink },
  cardSubtitle: { fontSize: 11, fontWeight: "700", color: palette.mutedBrown },
  chevron: { fontSize: 18, fontWeight: "900", color: palette.ink },
  collageRow: { flexDirection: "row", gap: 8 },
  thumbWrap: { flex: 1, aspectRatio: 1, borderRadius: 6, overflow: "hidden", borderWidth: 1, borderColor: palette.ink, position: "relative" },
  thumbImage: { width: "100%", height: "100%" },
  pinnedBadge: { position: "absolute", top: 2, right: 2, backgroundColor: palette.acidYellow, width: 14, height: 14, borderRadius: 7, alignItems: "center", justifyContent: "center" },
  pinnedBadgeText: { fontSize: 8, fontWeight: "900", color: palette.ink },
  moreOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.6)", alignItems: "center", justifyContent: "center" },
  moreText: { color: palette.whitePaper, fontSize: 13, fontWeight: "900" },
  cardFooterRow: {
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.1)",
    paddingTop: 10,
    marginTop: 2
  },
  orderPackBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: palette.acidYellow,
    borderWidth: 1.5,
    borderColor: palette.ink,
    borderRadius: 8,
    paddingVertical: 8,
    shadowColor: palette.ink,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.85,
    shadowRadius: 0
  },
  orderPackBtnText: {
    fontSize: 12,
    fontWeight: "900",
    color: palette.ink
  }
});
