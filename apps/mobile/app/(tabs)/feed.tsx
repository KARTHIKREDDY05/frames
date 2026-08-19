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
            <Text style={styles.kicker}>PUBLIC FRAMES</Text>
            <Text style={styles.title}>Feed</Text>
            <Text style={styles.copy}>Discover public moments. Friends-only Frames stay private until a request is accepted.</Text>
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
  content: { padding: 18, gap: 18, paddingBottom: 110 },
  header: { gap: 6, paddingTop: 18 },
  kicker: { color: palette.mutedBrown, fontSize: 12, fontWeight: "900" },
  title: { color: palette.ink, fontSize: 34, fontWeight: "900" },
  copy: { color: palette.mutedBrown, fontSize: 15, lineHeight: 22 },
  empty: { gap: 12, paddingTop: 110 },
  emptyTitle: { color: palette.ink, fontSize: 28, fontWeight: "900" },
  emptyCopy: { color: palette.mutedBrown, fontSize: 16, lineHeight: 23 }
});

function isActiveFrame(expiresAt: string) {
  return new Date(expiresAt).getTime() > Date.now();
}
