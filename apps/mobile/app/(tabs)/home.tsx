import { Link } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { FlatList, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { UserDto } from "@frames/types";
import { palette } from "@frames/ui";
import { AppIcon } from "../../components/AppIcon";
import { FamilyStorybookView } from "../../components/FamilyStorybookView";
import { FrameButton } from "../../components/FrameButton";
import { FrameCard } from "../../components/FrameCard";
import { FridgeDoorView } from "../../components/FridgeDoorView";
import { OrderDailyPackModal } from "../../components/OrderDailyPackModal";
import { PaperBackground } from "../../components/PaperBackground";
import { SponsoredFrameCard } from "../../components/SponsoredFrameCard";
import { TimeCapsuleModal } from "../../components/TimeCapsuleModal";
import { VisualInteractiveTourOverlay } from "../../components/VisualInteractiveTourOverlay";
import { fetchMyFriendships, fetchVisiblePosts } from "../../services/supabase";
import { useAppStore } from "../../store/appStore";

export default function HomeFeed() {
  const posts = useAppStore((state) => state.posts);
  const currentUser = useAppStore((state) => state.currentUser);
  const friends = useAppStore((state) => state.friends);
  const mergePosts = useAppStore((state) => state.mergePosts);
  const completeNavigationGuide = useAppStore((state) => state.completeNavigationGuide);

  const [remoteFriends, setRemoteFriends] = useState<UserDto[]>([]);
  const [guideVisible, setGuideVisible] = useState(false);
  const [timeCapsuleVisible, setTimeCapsuleVisible] = useState(false);
  const [orderModalVisible, setOrderModalVisible] = useState(false);
  const [viewMode, setViewMode] = useState<"feed" | "fridge" | "storybook">("feed");

  const unreadCount = useAppStore((state) =>
    state.notifications.filter(
      (notification) =>
        !notification.read && (!notification.recipientId || notification.recipientId === currentUser?.id)
    ).length
  );

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
        const userMap =
          friendshipResult?.users instanceof Map ? friendshipResult.users : new Map<string, UserDto>();
        const accepted = friendships
          .filter((friendship) => friendship.status === "ACCEPTED")
          .map((friendship) => {
            const otherId =
              friendship.requesterId === currentUser.id ? friendship.receiverId : friendship.requesterId;
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
  const closePosts = posts
    .filter((post) => {
      const ownPost = post.user.id === currentUser?.id || (!currentUser && post.user.id === "user-guest");
      const friendPost = allFriends.some((friend) => friend.id === post.user.id);
      return (ownPost || friendPost) && isActiveFrame(post.expiresAt);
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleGuideClose = () => {
    setGuideVisible(false);
    completeNavigationGuide();
  };

  return (
    <PaperBackground>
      <View style={styles.screenWrapper}>
        {/* Universal Top Header */}
        <View style={styles.topStickyHeader}>
          <View style={styles.titleRow}>
            <View style={styles.brandLogoRow}>
              <AppIcon name="frames-logo" color={palette.ink} size={22} />
              <Text style={styles.minimalBrandTitle}>Frames</Text>
            </View>
            <View style={styles.topActions}>
              <Pressable style={styles.capsuleTopBtn} onPress={() => setTimeCapsuleVisible(true)}>
                <Text style={{ fontSize: 13 }}>⏳</Text>
                <Text style={styles.capsuleTopBtnText}>Time Vault</Text>
              </Pressable>
              <Pressable style={styles.guideButton} onPress={() => setGuideVisible(true)}>
                <AppIcon name="spark" color={palette.ink} size={14} />
                <Text style={styles.guideButtonText}>Tour</Text>
              </Pressable>
              <Link href="/(tabs)/chats" asChild>
                <Pressable style={styles.notifyButton}>
                  <AppIcon name="comment" color={palette.ink} size={18} />
                </Pressable>
              </Link>
              <Link href="/notifications" asChild>
                <Pressable style={styles.notifyButton}>
                  <AppIcon name="bell" color={palette.ink} size={18} />
                  {unreadCount > 0 ? <Text style={styles.badge}>{unreadCount}</Text> : null}
                </Pressable>
              </Link>
            </View>
          </View>

          {/* View Mode Segment Switcher */}
          <View style={styles.viewSwitcher}>
            <Pressable
              style={[styles.switchSegment, viewMode === "feed" && styles.switchSegmentActive]}
              onPress={() => setViewMode("feed")}
            >
              <Text style={[styles.switchSegmentText, viewMode === "feed" && styles.switchSegmentTextActive]}>
                📋 Scrapbook Feed
              </Text>
            </Pressable>
            <Pressable
              style={[styles.switchSegment, viewMode === "fridge" && styles.switchSegmentActive]}
              onPress={() => setViewMode("fridge")}
            >
              <Text style={[styles.switchSegmentText, viewMode === "fridge" && styles.switchSegmentTextActive]}>
                🧲 Fridge Door
              </Text>
            </Pressable>
            <Pressable
              style={[styles.switchSegment, viewMode === "storybook" && styles.switchSegmentActive]}
              onPress={() => setViewMode("storybook")}
            >
              <Text style={[styles.switchSegmentText, viewMode === "storybook" && styles.switchSegmentTextActive]}>
                📖 Storybook
              </Text>
            </Pressable>
          </View>
        </View>

        {/* View Mode Rendering */}
        {viewMode === "fridge" ? (
          <FridgeDoorView onOpenOrderModal={() => setOrderModalVisible(true)} />
        ) : viewMode === "storybook" ? (
          <FamilyStorybookView onExportStory={() => setOrderModalVisible(true)} />
        ) : (
          <FlatList
            contentContainerStyle={styles.content}
            data={closePosts}
            keyExtractor={(item) => item.id}
            ListHeaderComponent={
              <View style={styles.header}>
                {/* Shortcuts */}
                <View style={styles.shortcutRow}>
                  <Link href="/(tabs)/feed" asChild>
                    <Pressable style={styles.shortcut}>
                      <AppIcon name="public" color={palette.ink} size={16} />
                      <Text style={styles.shortcutText}>Public Circle</Text>
                    </Pressable>
                  </Link>
                  <Link href="/(tabs)/archive" asChild>
                    <Pressable style={styles.shortcut}>
                      <AppIcon name="archive" color={palette.ink} size={16} />
                      <Text style={styles.shortcutText}>Memory Book</Text>
                    </Pressable>
                  </Link>
                </View>

                {/* Circle Story Avatars */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.stories}
                >
                  {closeCircle.map((user) => (
                    <Link
                      key={user.id}
                      href={user.id === currentUser?.id ? "/(tabs)/profile" : `/user/${user.id}`}
                      asChild
                    >
                      <Pressable style={styles.story}>
                        <View style={styles.storyRing}>
                          <Image source={{ uri: user.avatarUrl ?? undefined }} style={styles.storyAvatar} />
                        </View>
                        <Text numberOfLines={1} style={styles.storyLabel}>
                          {user.id === currentUser?.id ? "You" : user.displayName.split(" ")[0]}
                        </Text>
                      </Pressable>
                    </Link>
                  ))}
                  <Link href="/(tabs)/search" asChild>
                    <Pressable style={styles.story}>
                      <View style={styles.addStory}>
                        <AppIcon name="user-plus" color={palette.ink} size={20} />
                      </View>
                      <Text style={styles.storyLabel}>Find</Text>
                    </Pressable>
                  </Link>
                </ScrollView>
              </View>
            }
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyTitle}>No close Frames yet.</Text>
                <Text style={styles.emptyCopy}>
                  Your Frames and accepted family members' Frames appear here. Try switching to 🧲 Fridge Door or 📖 Storybook above!
                </Text>
                <Link href="/(tabs)/camera" asChild>
                  <FrameButton icon="camera" label="Capture Today's Memory" />
                </Link>
                <Link href="/(tabs)/feed" asChild>
                  <FrameButton icon="home" label="Open Public Feed" variant="secondary" />
                </Link>
              </View>
            }
            renderItem={({ item, index }) => (
              <View style={{ marginBottom: 16 }}>
                <FrameCard post={item} tilt={index % 2 === 0 ? "-2.2deg" : "1.8deg"} />
                {index === 0 ? <SponsoredFrameCard tilt="1.8deg" /> : null}
              </View>
            )}
          />
        )}
      </View>

      {/* Modals */}
      <VisualInteractiveTourOverlay visible={guideVisible} onClose={handleGuideClose} />
      <TimeCapsuleModal visible={timeCapsuleVisible} onClose={() => setTimeCapsuleVisible(false)} />
      <OrderDailyPackModal
        visible={orderModalVisible}
        dateTitle="Family Keepsake Pack"
        posts={posts.slice(0, 5)}
        onClose={() => setOrderModalVisible(false)}
      />
    </PaperBackground>
  );
}

function isActiveFrame(expiresAt: string) {
  const expires = new Date(expiresAt).getTime();
  if (Number.isNaN(expires)) return true;
  return expires > Date.now();
}

const styles = StyleSheet.create({
  screenWrapper: {
    flex: 1
  },
  topStickyHeader: {
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 10,
    backgroundColor: palette.paperCream,
    borderBottomWidth: 1.5,
    borderColor: "#E2D3BF",
    gap: 10
  },
  content: { padding: 18, paddingTop: 12, paddingBottom: 110 },
  header: { gap: 14, marginBottom: 12 },
  titleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  brandLogoRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  minimalBrandTitle: { fontSize: 22, fontWeight: "900", color: palette.ink, letterSpacing: -0.5 },
  topActions: { flexDirection: "row", alignItems: "center", gap: 6 },
  capsuleTopBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FFE5D9",
    borderWidth: 1.5,
    borderColor: "#E07A5F",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6
  },
  capsuleTopBtnText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#9C3D24"
  },
  guideButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: palette.acidYellow,
    borderWidth: 1.5,
    borderColor: palette.ink,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    shadowColor: palette.ink,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.85,
    shadowRadius: 0
  },
  guideButtonText: { fontSize: 11, fontWeight: "900", color: palette.ink },
  notifyButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: palette.ink,
    backgroundColor: palette.whitePaper,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    shadowColor: palette.ink,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.85,
    shadowRadius: 0
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: palette.acidYellow,
    borderWidth: 1.5,
    borderColor: palette.ink,
    color: palette.ink,
    fontSize: 10,
    fontWeight: "900",
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1
  },
  viewSwitcher: {
    flexDirection: "row",
    backgroundColor: "#E5D7C3",
    padding: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#D4C2A9"
  },
  switchSegment: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 8
  },
  switchSegmentActive: {
    backgroundColor: palette.whitePaper,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2
  },
  switchSegmentText: {
    fontSize: 11,
    fontWeight: "700",
    color: palette.mutedBrown
  },
  switchSegmentTextActive: {
    fontWeight: "900",
    color: palette.ink
  },
  shortcutRow: { flexDirection: "row", gap: 8 },
  shortcut: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: palette.whitePaper,
    borderWidth: 1.5,
    borderColor: palette.ink,
    borderRadius: 8,
    paddingVertical: 10,
    shadowColor: palette.ink,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.85,
    shadowRadius: 0
  },
  shortcutText: { fontSize: 12, fontWeight: "900", color: palette.ink },
  stories: { gap: 12, paddingVertical: 4 },
  story: { alignItems: "center", gap: 5, width: 62 },
  storyRing: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: palette.ink,
    padding: 2,
    backgroundColor: palette.acidYellow
  },
  storyAvatar: { width: "100%", height: "100%", borderRadius: 24, backgroundColor: palette.softPeach },
  storyLabel: { fontSize: 11, fontWeight: "800", color: palette.ink },
  addStory: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: palette.ink,
    borderStyle: "dashed",
    backgroundColor: palette.whitePaper,
    alignItems: "center",
    justifyContent: "center"
  },
  empty: {
    backgroundColor: palette.whitePaper,
    borderWidth: 1.5,
    borderColor: palette.ink,
    borderRadius: 8,
    padding: 24,
    gap: 12,
    alignItems: "center",
    shadowColor: palette.ink,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.85,
    shadowRadius: 0
  },
  emptyTitle: { fontSize: 18, fontWeight: "900", color: palette.ink },
  emptyCopy: { fontSize: 13, color: palette.mutedBrown, textAlign: "center", lineHeight: 18 }
});
