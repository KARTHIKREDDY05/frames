import { Link } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { FlatList, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { UserDto } from "@frames/types";
import { palette } from "@frames/ui";
import { AppIcon } from "../../components/AppIcon";
import { FrameButton } from "../../components/FrameButton";
import { FrameCard } from "../../components/FrameCard";
import { PaperBackground } from "../../components/PaperBackground";
import { fetchMyFriendships, fetchVisiblePosts } from "../../services/supabase";
import { useAppStore } from "../../store/appStore";

export default function HomeFeed() {
  const posts = useAppStore((state) => state.posts);
  const currentUser = useAppStore((state) => state.currentUser);
  const friends = useAppStore((state) => state.friends);
  const mergePosts = useAppStore((state) => state.mergePosts);
  const [remoteFriends, setRemoteFriends] = useState<UserDto[]>([]);
  const unreadCount = useAppStore((state) => state.notifications.filter((notification) => !notification.read && (!notification.recipientId || notification.recipientId === currentUser?.id)).length);
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const [{ posts: remotePosts }, friendshipResult] = await Promise.all([fetchVisiblePosts(), fetchMyFriendships()]);
      if (!mounted) return;
      mergePosts(remotePosts);
      if (!currentUser) return;
      const accepted = friendshipResult.friendships
        .filter((friendship) => friendship.status === "ACCEPTED")
        .map((friendship) => {
          const otherId = friendship.requesterId === currentUser.id ? friendship.receiverId : friendship.requesterId;
          return friendshipResult.users.get(otherId);
        })
        .filter((user): user is UserDto => Boolean(user));
      setRemoteFriends(accepted);
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
  return (
    <PaperBackground>
      <FlatList
        contentContainerStyle={styles.content}
        data={closePosts}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <View>
                <Text style={styles.kicker}>FRIENDS & CLOSE ONES</Text>
                <Text style={styles.title}>Home</Text>
              </View>
              <View style={styles.topActions}>
                <Link href="/(tabs)/chats" asChild>
                  <Pressable style={styles.notifyButton}><AppIcon name="comment" color={palette.ink} size={20} /></Pressable>
                </Link>
                <Link href="/notifications" asChild>
                  <Pressable style={styles.notifyButton}>
                    <AppIcon name="bell" color={palette.ink} size={20} />
                    {unreadCount > 0 ? <Text style={styles.badge}>{unreadCount}</Text> : null}
                  </Pressable>
                </Link>
              </View>
            </View>
            <View style={styles.shortcutRow}>
              <Link href="/(tabs)/feed" asChild>
                <Pressable style={styles.shortcut}><AppIcon name="public" color={palette.ink} size={16} /><Text style={styles.shortcutText}>Public Feed</Text></Pressable>
              </Link>
              <Link href="/(tabs)/archive" asChild>
                <Pressable style={styles.shortcut}><AppIcon name="archive" color={palette.ink} size={16} /><Text style={styles.shortcutText}>Archive</Text></Pressable>
              </Link>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.stories}>
              {closeCircle.map((user) => (
                <Link key={user.id} href={user.id === currentUser?.id ? "/(tabs)/profile" : `/user/${user.id}`} asChild>
                  <Pressable style={styles.story}>
                    <View style={styles.storyRing}>
                      <Image source={{ uri: user.avatarUrl ?? undefined }} style={styles.storyAvatar} />
                    </View>
                    <Text numberOfLines={1} style={styles.storyLabel}>{user.id === currentUser?.id ? "You" : user.displayName.split(" ")[0]}</Text>
                  </Pressable>
                </Link>
              ))}
              <Link href="/(tabs)/search" asChild>
                <Pressable style={styles.story}>
                  <View style={styles.addStory}><AppIcon name="user-plus" color={palette.ink} size={22} /></View>
                  <Text style={styles.storyLabel}>Find</Text>
                </Pressable>
              </Link>
            </ScrollView>
          </View>
        }
        ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyTitle}>No close Frames yet.</Text><Text style={styles.emptyCopy}>Your Frames and accepted friends' Frames appear here. Public discovery lives in Feed.</Text><Link href="/(tabs)/camera" asChild><FrameButton icon="camera" label="Take your first Frame" /></Link><Link href="/(tabs)/feed" asChild><FrameButton icon="home" label="Open Public Feed" variant="secondary" /></Link></View>}
        renderItem={({ item, index }) => <FrameCard post={item} tilt={index % 2 === 0 ? "-1.5deg" : "1.3deg"} />}
      />
    </PaperBackground>
  );
}

function isActiveFrame(expiresAt: string) {
  return new Date(expiresAt).getTime() > Date.now();
}

const styles = StyleSheet.create({
  content: { padding: 18, gap: 18, paddingBottom: 110 },
  header: { gap: 14, marginBottom: 8, paddingTop: 16 },
  titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  kicker: { color: palette.mutedBrown, fontSize: 12, fontWeight: "900" },
  title: { fontSize: 34, fontWeight: "900", color: palette.ink },
  topActions: { flexDirection: "row", gap: 8 },
  notifyButton: { width: 46, height: 46, borderRadius: 23, backgroundColor: palette.whitePaper, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#E4D9CA" },
  badge: { position: "absolute", top: -2, right: -2, minWidth: 20, height: 20, borderRadius: 10, backgroundColor: "#B8324A", color: palette.whitePaper, textAlign: "center", fontWeight: "900", fontSize: 12, overflow: "hidden" },
  shortcutRow: { flexDirection: "row", gap: 8 },
  shortcut: { flex: 1, minHeight: 42, borderRadius: 21, backgroundColor: palette.whitePaper, borderWidth: 1, borderColor: "#E4D9CA", alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 7 },
  shortcutText: { color: palette.ink, fontSize: 12, fontWeight: "900" },
  stories: { gap: 14, paddingVertical: 4, paddingRight: 12 },
  story: { width: 70, alignItems: "center", gap: 6 },
  storyRing: { width: 64, height: 64, borderRadius: 32, borderWidth: 3, borderColor: palette.softPeach, alignItems: "center", justifyContent: "center", backgroundColor: palette.whitePaper },
  storyAvatar: { width: 54, height: 54, borderRadius: 27, backgroundColor: "#E4D9CA" },
  addStory: { width: 64, height: 64, borderRadius: 32, borderWidth: 1, borderColor: "#E4D9CA", backgroundColor: palette.whitePaper, alignItems: "center", justifyContent: "center" },
  storyLabel: { color: palette.ink, fontSize: 11, fontWeight: "800", maxWidth: 70 },
  empty: { gap: 12, paddingTop: 160 },
  emptyTitle: { fontSize: 28, fontWeight: "900", color: palette.ink },
  emptyCopy: { color: palette.mutedBrown, fontSize: 17 }
});
