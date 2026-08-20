import { Link } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { FlatList, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { UserDto } from "@frames/types";
import { palette } from "@frames/ui";
import { AppIcon } from "../../components/AppIcon";
import { FrameButton } from "../../components/FrameButton";
import { FrameCard } from "../../components/FrameCard";
import { SponsoredFrameCard } from "../../components/SponsoredFrameCard";
import { PaperBackground } from "../../components/PaperBackground";
import { VisualInteractiveTourOverlay } from "../../components/VisualInteractiveTourOverlay";
import { fetchMyFriendships, fetchVisiblePosts } from "../../services/supabase";
import { useAppStore } from "../../store/appStore";

export default function HomeFeed() {
  const posts = useAppStore((state) => state.posts);
  const currentUser = useAppStore((state) => state.currentUser);
  const friends = useAppStore((state) => state.friends);
  const mergePosts = useAppStore((state) => state.mergePosts);
  const hasSeenNavigationGuide = useAppStore((state) => state.hasSeenNavigationGuide);
  const completeNavigationGuide = useAppStore((state) => state.completeNavigationGuide);

  const [remoteFriends, setRemoteFriends] = useState<UserDto[]>([]);
  const [guideVisible, setGuideVisible] = useState(false);

  const unreadCount = useAppStore((state) =>
    state.notifications.filter((notification) => !notification.read && (!notification.recipientId || notification.recipientId === currentUser?.id)).length
  );

  // Auto-show navigation tour ONCE on first visit
  useEffect(() => {
    if (!hasSeenNavigationGuide && currentUser) {
      setGuideVisible(true);
      completeNavigationGuide();
    }
  }, [hasSeenNavigationGuide, currentUser, completeNavigationGuide]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const [postsResult, friendshipResult] = await Promise.all([
          fetchVisiblePosts().catch(() => ({ posts: [] })),
          fetchMyFriendships().catch(() => ({ friendships: [], users: new Map<string, UserDto>() }))
        ]);
        if (!mounted) return;
        if (postsResult?.posts) mergePosts(postsResult.posts);
        if (!currentUser) return;
        const friendships = friendshipResult?.friendships ?? [];
        const userMap = friendshipResult?.users instanceof Map ? friendshipResult.users : new Map<string, UserDto>();
        const accepted = friendships
          .filter((friendship) => friendship.status === "ACCEPTED")
          .map((friendship) => {
            const otherId = friendship.requesterId === currentUser.id ? friendship.receiverId : friendship.requesterId;
            return userMap.get(otherId);
          })
          .filter((user): user is UserDto => Boolean(user));
        setRemoteFriends(accepted);
      } catch {
        // Handled silently
      }
    };
    void load();
    return () => {
      mounted = false;
    };
  }, [currentUser, mergePosts]);

  const allFriends = useMemo(() => {
    const byId = new Map<string, UserDto>();
    [...friends, ...remoteFriends].forEach((friend) => byId.set(friend.id, friend));
    return Array.from(byId.values());
  }, [friends, remoteFriends]);

  const closeCircle = currentUser ? [currentUser, ...allFriends] : allFriends;
  const closePosts = posts.filter((post) => {
    const ownPost = post.user.id === currentUser?.id || (!currentUser && post.user.id === "user-guest");
    const friendPost = allFriends.some((friend) => friend.id === post.user.id);
    return (ownPost || friendPost) && isActiveFrame(post.expiresAt);
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleGuideClose = () => {
    setGuideVisible(false);
    completeNavigationGuide();
  };

  return (
    <PaperBackground>
      <FlatList
        contentContainerStyle={styles.content}
        data={closePosts}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <View style={styles.brandLogoRow}>
                <AppIcon name="frames-logo" color={palette.ink} size={24} />
                <Text style={styles.minimalBrandTitle}>Frames</Text>
              </View>
              <View style={styles.topActions}>
                <Pressable style={styles.guideButton} onPress={() => setGuideVisible(true)}>
                  <AppIcon name="spark" color={palette.ink} size={14} />
                  <Text style={styles.guideButtonText}>Tour</Text>
                </Pressable>
                <Link href="/chats" asChild>
                  <Pressable style={styles.notifyButton}><AppIcon name="comment" color={palette.ink} size={18} /></Pressable>
                </Link>
                <Link href="/notifications" asChild>
                  <Pressable style={styles.notifyButton}>
                    <AppIcon name="bell" color={palette.ink} size={18} />
                    {unreadCount > 0 ? <Text style={styles.badge}>{unreadCount}</Text> : null}
                  </Pressable>
                </Link>
              </View>
            </View>
            <View style={styles.shortcutRow}>
              <Link href="/feed" asChild>
                <Pressable style={styles.shortcut}><AppIcon name="public" color={palette.ink} size={16} /><Text style={styles.shortcutText}>Public Feed</Text></Pressable>
              </Link>
              <Link href="/archive" asChild>
                <Pressable style={styles.shortcut}><AppIcon name="archive" color={palette.ink} size={16} /><Text style={styles.shortcutText}>Memory Book</Text></Pressable>
              </Link>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.stories}>
              {closeCircle.map((user) => (
                <Link key={user.id} href={user.id === currentUser?.id ? "/profile" : `/user/${user.id}`} asChild>
                  <Pressable style={styles.story}>
                    <View style={styles.storyRing}>
                      <Image source={{ uri: user.avatarUrl ?? undefined }} style={styles.storyAvatar} />
                    </View>
                    <Text numberOfLines={1} style={styles.storyLabel}>{user.id === currentUser?.id ? "You" : user.displayName.split(" ")[0]}</Text>
                  </Pressable>
                </Link>
              ))}
              <Link href="/search" asChild>
                <Pressable style={styles.story}>
                  <View style={styles.addStory}><AppIcon name="user-plus" color={palette.ink} size={20} /></View>
                  <Text style={styles.storyLabel}>Find</Text>
                </Pressable>
              </Link>
            </ScrollView>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No close Frames yet.</Text>
            <Text style={styles.emptyCopy}>Your Frames and accepted friends' Frames appear here. Public discovery lives in Feed.</Text>
            <Link href="/camera" asChild>
              <FrameButton icon="camera" label="Take your first Frame" />
            </Link>
            <Link href="/feed" asChild>
              <FrameButton icon="home" label="Open Public Feed" variant="secondary" />
            </Link>
          </View>
        }
        renderItem={({ item, index }) => (
          <View>
            <FrameCard post={item} tilt={index % 2 === 0 ? "-2.2deg" : "1.8deg"} />
            {index === 0 ? <SponsoredFrameCard tilt="1.8deg" /> : null}
          </View>
        )}
      />

      <VisualInteractiveTourOverlay visible={guideVisible} onClose={handleGuideClose} />
    </PaperBackground>
  );
}

function isActiveFrame(expiresAt: string) {
  const expires = new Date(expiresAt).getTime();
  if (Number.isNaN(expires)) return true;
  return expires > Date.now();
}

const styles = StyleSheet.create({
  content: { padding: 18, paddingTop: 52, paddingBottom: 110, gap: 18 },
  header: { gap: 14, marginBottom: 8 },
  titleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  brandLogoRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  minimalBrandTitle: { fontSize: 22, fontWeight: "900", color: palette.ink, letterSpacing: -0.5 },
  topActions: { flexDirection: "row", alignItems: "center", gap: 6 },
  guideButton: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: palette.acidYellow, borderWidth: 1.5, borderColor: palette.ink, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 6, shadowColor: palette.ink, shadowOffset: { width: 2, height: 2 }, shadowOpacity: 0.85, shadowRadius: 0 },
  guideButtonText: { fontSize: 11, fontWeight: "900", color: palette.ink },
  notifyButton: { width: 36, height: 36, borderRadius: 18, borderWidth: 1.5, borderColor: palette.ink, backgroundColor: palette.whitePaper, alignItems: "center", justifyContent: "center", position: "relative", shadowColor: palette.ink, shadowOffset: { width: 2, height: 2 }, shadowOpacity: 0.85, shadowRadius: 0 },
  badge: { position: "absolute", top: -4, right: -4, backgroundColor: palette.acidYellow, borderWidth: 1.5, borderColor: palette.ink, color: palette.ink, fontSize: 10, fontWeight: "900", borderRadius: 8, paddingHorizontal: 5, paddingVertical: 1 },
  shortcutRow: { flexDirection: "row", gap: 8 },
  shortcut: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: palette.whitePaper, borderWidth: 1.5, borderColor: palette.ink, borderRadius: 8, paddingVertical: 10, shadowColor: palette.ink, shadowOffset: { width: 2, height: 2 }, shadowOpacity: 0.85, shadowRadius: 0 },
  shortcutText: { fontSize: 12, fontWeight: "900", color: palette.ink },
  stories: { gap: 12, paddingVertical: 4 },
  story: { alignItems: "center", gap: 5, width: 62 },
  storyRing: { width: 56, height: 56, borderRadius: 28, borderWidth: 2, borderColor: palette.ink, padding: 2, backgroundColor: palette.acidYellow },
  storyAvatar: { width: "100%", height: "100%", borderRadius: 24, backgroundColor: palette.softPeach },
  storyLabel: { fontSize: 11, fontWeight: "800", color: palette.ink },
  addStory: { width: 56, height: 56, borderRadius: 28, borderWidth: 2, borderColor: palette.ink, borderStyle: "dashed", backgroundColor: palette.whitePaper, alignItems: "center", justifyContent: "center" },
  empty: { backgroundColor: palette.whitePaper, borderWidth: 1.5, borderColor: palette.ink, borderRadius: 8, padding: 24, gap: 12, alignItems: "center", shadowColor: palette.ink, shadowOffset: { width: 3, height: 3 }, shadowOpacity: 0.85, shadowRadius: 0 },
  emptyTitle: { fontSize: 18, fontWeight: "900", color: palette.ink },
  emptyCopy: { fontSize: 13, color: palette.mutedBrown, textAlign: "center", lineHeight: 18 }
});
