import { Link, router } from "expo-router";
import { useEffect, useMemo } from "react";
import { FlatList, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { palette } from "@frames/ui";
import { AppIcon } from "../../components/AppIcon";
import { FrameButton } from "../../components/FrameButton";
import { FrameCard } from "../../components/FrameCard";
import { PaperBackground } from "../../components/PaperBackground";
import { fetchVisiblePosts } from "../../services/supabase";
import { useAppStore } from "../../store/appStore";

const TRENDING_TAGS = ["#DailyPolaroid", "#GoldenHour", "#ScrapbookVibes", "#AnalogMemories", "#FridgeSnaps"];

export default function PublicFeed() {
  const posts = useAppStore((state) => state.posts);
  const currentUser = useAppStore((state) => state.currentUser);
  const friends = useAppStore((state) => state.friends);
  const mergePosts = useAppStore((state) => state.mergePosts);

  useEffect(() => {
    const load = async () => {
      const { posts: remotePosts } = await fetchVisiblePosts();
      mergePosts(remotePosts);
    };
    void load();
  }, [mergePosts]);

  const publicPosts = useMemo(() => {
    return posts
      .filter((post) => {
        if (post.user.id === currentUser?.id && currentUser?.profileVisibility === "PRIVATE") {
          return false;
        }
        return post.privacy === "PUBLIC" && isActiveFrame(post.expiresAt);
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [currentUser?.id, currentUser?.profileVisibility, posts]);

  // Story creators
  const storyCreators = useMemo(() => {
    const creatorsMap = new Map<string, { id: string; name: string; avatarUrl?: string | null; hasNew: boolean }>();
    for (const post of publicPosts) {
      if (!creatorsMap.has(post.user.id)) {
        creatorsMap.set(post.user.id, {
          id: post.user.id,
          name: post.user.displayName || post.user.username,
          avatarUrl: post.user.avatarUrl,
          hasNew: true
        });
      }
    }
    return Array.from(creatorsMap.values());
  }, [publicPosts]);

  return (
    <PaperBackground>
      <FlatList
        contentContainerStyle={styles.content}
        data={publicPosts}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.brandRow}>
              <View style={styles.brandBadge}><Text style={styles.brandBadgeText}>FRAMES</Text></View>
              <View style={styles.stampedDateBadge}>
                <Text style={styles.stampedDateText}>
                  {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }).toUpperCase()}
                </Text>
              </View>
            </View>
            <Text style={styles.kicker}>COMMUNITY DISCOVERY</Text>
            <Text style={styles.title}>Public Feed</Text>

            {/* Stories / Moments Tray */}
            <View style={styles.storiesSection}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.storiesScroll}>
                {/* Your Story Button */}
                <Pressable style={styles.storyItem} onPress={() => router.push("/(tabs)/camera")}>
                  <View style={styles.yourStoryRing}>
                    <Image
                      source={{ uri: currentUser?.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80" }}
                      style={styles.storyAvatar}
                    />
                    <View style={styles.addPlusBadge}>
                      <Text style={styles.addPlusText}>+</Text>
                    </View>
                  </View>
                  <Text numberOfLines={1} style={styles.storyName}>Your Story</Text>
                </Pressable>

                {/* Other Creators' Stories */}
                {storyCreators.map((creator) => (
                  <Pressable
                    key={creator.id}
                    style={styles.storyItem}
                    onPress={() => router.push(`/user/${creator.id}`)}
                  >
                    <View style={[styles.storyRing, creator.hasNew && styles.storyRingActive]}>
                      <Image
                        source={{ uri: creator.avatarUrl || `https://i.pravatar.cc/160?u=${encodeURIComponent(creator.id)}` }}
                        style={styles.storyAvatar}
                      />
                    </View>
                    <Text numberOfLines={1} style={styles.storyName}>{creator.name}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            {/* Trending Tags Row */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tagsScroll}>
              {TRENDING_TAGS.map((tag) => (
                <View key={tag} style={styles.tagPill}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No public Frames yet.</Text>
            <Text style={styles.emptyCopy}>Post a public Frame or find people to follow.</Text>
            <Link href="/(tabs)/camera" asChild><FrameButton icon="camera" label="Post Public Frame" /></Link>
            <Link href="/(tabs)/search" asChild><FrameButton icon="search" label="Find People" variant="secondary" /></Link>
          </View>
        }
        renderItem={({ item, index }) => <FrameCard post={item} tilt={index % 2 === 0 ? "-1deg" : "1deg"} />}
      />
    </PaperBackground>
  );
}


const styles = StyleSheet.create({
  content: { padding: 16, gap: 16, paddingBottom: 110 },
  header: { gap: 6, paddingTop: 16 },
  brandRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  brandBadge: { backgroundColor: palette.ink, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, transform: [{ rotate: "-2deg" }] },
  brandBadgeText: { color: palette.acidYellow, fontSize: 11, fontWeight: "900", letterSpacing: 1 },
  stampedDateBadge: { backgroundColor: palette.softLavender, borderWidth: 1.5, borderColor: palette.ink, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, shadowColor: palette.ink, shadowOffset: { width: 2, height: 2 }, shadowOpacity: 0.8, shadowRadius: 0, elevation: 2 },
  stampedDateText: { fontSize: 10, fontWeight: "900", color: palette.ink, letterSpacing: 0.8 },
  kicker: { color: palette.mutedBrown, fontSize: 11, fontWeight: "900", letterSpacing: 0.5 },
  title: { color: palette.ink, fontSize: 30, fontWeight: "900" },
  copy: { color: palette.mutedBrown, fontSize: 14, lineHeight: 20 },
  empty: { gap: 12, paddingTop: 80 },
  emptyTitle: { color: palette.ink, fontSize: 26, fontWeight: "900" },
  emptyCopy: { color: palette.mutedBrown, fontSize: 15, lineHeight: 22 },

  storiesSection: { marginTop: 10, marginBottom: 4 },
  storiesScroll: { gap: 14, paddingRight: 10 },
  storyItem: { alignItems: "center", gap: 4, width: 68 },
  yourStoryRing: {
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: palette.ink,
    alignItems: "center",
    justifyContent: "center",
    position: "relative"
  },
  storyRing: {
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 2,
    borderColor: palette.mutedBrown,
    alignItems: "center",
    justifyContent: "center"
  },
  storyRingActive: {
    borderColor: palette.ink,
    borderWidth: 2.5,
    backgroundColor: palette.acidYellow,
    shadowColor: palette.ink,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 0
  },
  storyAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26
  },
  addPlusBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: palette.acidYellow,
    borderWidth: 1.5,
    borderColor: palette.ink,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center"
  },
  addPlusText: {
    fontSize: 12,
    fontWeight: "900",
    color: palette.ink,
    lineHeight: 14
  },
  storyName: {
    fontSize: 11,
    fontWeight: "800",
    color: palette.ink,
    textAlign: "center"
  },

  tagsScroll: { gap: 8, paddingVertical: 4 },
  tagPill: {
    backgroundColor: palette.whitePaper,
    borderWidth: 1.5,
    borderColor: palette.ink,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    shadowColor: palette.ink,
    shadowOffset: { width: 1.5, height: 1.5 },
    shadowOpacity: 0.8,
    shadowRadius: 0
  },
  tagText: {
    fontSize: 11,
    fontWeight: "900",
    color: palette.ink
  }
});

function isActiveFrame(expiresAt: string) {
  return new Date(expiresAt).getTime() > Date.now();
}

