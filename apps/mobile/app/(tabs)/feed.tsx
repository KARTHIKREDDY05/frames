import { Link } from "expo-router";
import { useEffect, useMemo } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { palette } from "@frames/ui";
import { FrameButton } from "../../components/FrameButton";
import { FrameCard } from "../../components/FrameCard";
import { PaperBackground } from "../../components/PaperBackground";
import { fetchVisiblePosts } from "../../services/supabase";
import { useAppStore } from "../../store/appStore";

export default function PublicFeed() {
  const posts = useAppStore((state) => state.posts);
  const currentUser = useAppStore((state) => state.currentUser);
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
            <Text style={styles.copy}>Explore public moments from around the world. Friends-only Frames stay protected.</Text>
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
  emptyCopy: { color: palette.mutedBrown, fontSize: 15, lineHeight: 22 }
});

function isActiveFrame(expiresAt: string) {
  return new Date(expiresAt).getTime() > Date.now();
}
