import { Link } from "expo-router";
import { useEffect, useState } from "react";
import { FlatList, Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { palette } from "@frames/ui";
import { AppIcon } from "../../components/AppIcon";
import { FrameButton } from "../../components/FrameButton";
import { fetchFollowersList, fetchFollowingList, fetchFriendsList, fetchProfileStats, fetchUserPosts } from "../../services/supabase";
import { useAppStore } from "../../store/appStore";
import type { PostDto, UserDto } from "@frames/types";

export default function ProfileScreen() {
  const user = useAppStore((state) => state.currentUser);
  const posts = useAppStore((state) => state.posts);
  const dailyFrames = useAppStore((state) => state.dailyFrames);
  const mergePosts = useAppStore((state) => state.mergePosts);
  const logout = useAppStore((state) => state.logout);
  const [stats, setStats] = useState({ friends: 0, followers: 0, following: 0 });
  const [activeModal, setActiveModal] = useState<"friends" | "followers" | "following" | null>(null);
  const [modalUsers, setModalUsers] = useState<UserDto[]>([]);
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      const [{ posts: remotePosts }, remoteStats] = await Promise.all([
        fetchUserPosts(user.id),
        fetchProfileStats(user.id)
      ]);
      mergePosts(remotePosts);
      setStats(remoteStats);
    };
    void load();
  }, [mergePosts, user]);

  const openList = async (type: "friends" | "followers" | "following") => {
    if (!user) return;
    setActiveModal(type);
    setModalLoading(true);
    let result: { users: UserDto[] } = { users: [] };
    if (type === "friends") result = await fetchFriendsList(user.id);
    else if (type === "followers") result = await fetchFollowersList(user.id);
    else if (type === "following") result = await fetchFollowingList(user.id);
    setModalUsers(result.users);
    setModalLoading(false);
  };

  if (!user) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.emptyContent}>
        <View style={styles.emptyAvatar}><Text style={styles.emptyAvatarText}>F</Text></View>
        <Text style={styles.name}>Create your profile</Text>
        <Text style={styles.bio}>Sign in to show your Frames, friends, and scrapbook grid.</Text>
        <Link href="/register" asChild><FrameButton icon="user-plus" label="Create Account" /></Link>
        <Link href="/login" asChild><FrameButton icon="check" label="Sign In" variant="secondary" /></Link>
      </ScrollView>
    );
  }

  const archivedPosts = dailyFrames.flatMap((frame) => frame.posts.filter((post) => post.user.id === user.id && post.profileFeatured));
  const postMap = new Map<string, PostDto>();
  archivedPosts.forEach((p) => postMap.set(p.id, p));
  posts.filter((post) => post.user.id === user.id && shouldShowOnProfile(post.expiresAt, post.profileFeatured)).forEach((p) => postMap.set(p.id, p));
  const gridPosts = Array.from(postMap.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.topBar}>
        <Text style={styles.handle}>@{user.username}</Text>
        <View style={styles.topActions}>
          <Link href="/notifications" asChild>
            <Pressable style={styles.iconButton}><AppIcon name="bell" color={palette.ink} size={20} /></Pressable>
          </Link>
          <Link href="/settings" asChild>
            <Pressable style={styles.iconButton}><AppIcon name="settings" color={palette.ink} size={20} /></Pressable>
          </Link>
        </View>
      </View>

      <View style={styles.header}>
        <Image source={{ uri: user.avatarUrl ?? undefined }} style={styles.avatar} />
        <View style={styles.stats}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{gridPosts.length}</Text>
            <Text style={styles.statLabel}>Frames</Text>
          </View>
          <Pressable style={styles.statBox} onPress={() => { void openList("friends"); }}>
            <Text style={styles.statNumber}>{stats.friends}</Text>
            <Text style={styles.statLabelClickable}>Friends ›</Text>
          </Pressable>
          <Pressable style={styles.statBox} onPress={() => { void openList("following"); }}>
            <Text style={styles.statNumber}>{stats.following}</Text>
            <Text style={styles.statLabelClickable}>Following ›</Text>
          </Pressable>
        </View>
      </View>

      <Text style={styles.name}>{user.displayName}</Text>
      <Text style={styles.bio}>{user.bio || "Your life, framed automatically."}</Text>
      <Text style={styles.visibility}>{user.profileVisibility === "PRIVATE" ? "🔒 Private Account" : "🌍 Public Account"}</Text>

      <View style={styles.actions}>
        <Link href="/settings" asChild>
          <FrameButton icon="profile" label="Edit Profile" variant="secondary" style={styles.actionButton} />
        </Link>
        <Link href="/(tabs)/chats" asChild>
          <FrameButton icon="comment" label="Chats" variant="secondary" style={styles.actionButton} />
        </Link>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.highlights}>
        <Link href="/(tabs)/camera" asChild>
          <Pressable style={styles.highlight}>
            <View style={styles.highlightCircle}><AppIcon name="camera" color={palette.ink} size={22} /></View>
            <Text style={styles.highlightText}>Capture</Text>
          </Pressable>
        </Link>
        <Link href="/(tabs)/archive" asChild>
          <Pressable style={styles.highlight}>
            <View style={styles.highlightCircle}><AppIcon name="archive" color={palette.ink} size={22} /></View>
            <Text style={styles.highlightText}>Archive</Text>
          </Pressable>
        </Link>
        <Link href="/share" asChild>
          <Pressable style={styles.highlight}>
            <View style={styles.highlightCircle}><AppIcon name="send" color={palette.ink} size={22} /></View>
            <Text style={styles.highlightText}>Share</Text>
          </Pressable>
        </Link>
      </ScrollView>

      <View style={styles.gridHeader}>
        <AppIcon name="archive" color={palette.ink} size={18} />
        <Text style={styles.gridTitle}>Scrapbook Grid ({gridPosts.length})</Text>
      </View>

      {gridPosts.length === 0 ? (
        <View style={styles.emptyGrid}>
          <Text style={styles.emptyTitle}>No Frames yet</Text>
          <Text style={styles.emptyCopy}>Capture moments using the Camera tab to build your live profile grid.</Text>
        </View>
      ) : (
        <View style={styles.grid}>
          {gridPosts.map((post) => (
            <Link key={post.id} href={`/post/${post.id}`} asChild>
              <Pressable style={styles.tile}>
                <Image source={{ uri: post.mediaUrl }} style={styles.tileImage} />
                {post.profileFeatured ? (
                  <View style={styles.tileKept}><Text style={styles.tileKeptText}>KEPT</Text></View>
                ) : null}
                {post.privacy === "FRIENDS" ? (
                  <View style={styles.tileLock}><AppIcon name="lock" color={palette.whitePaper} size={14} /></View>
                ) : null}
              </Pressable>
            </Link>
          ))}
        </View>
      )}

      <FrameButton icon="sign-out" label="Sign Out" variant="secondary" onPress={logout} />

      {/* Relations Modal */}
      <Modal visible={Boolean(activeModal)} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {activeModal === "friends" ? "Friends" : activeModal === "followers" ? "Followers" : "Following"}
              </Text>
              <Pressable onPress={() => setActiveModal(null)} style={styles.modalClose}>
                <Text style={styles.modalCloseText}>✕</Text>
              </Pressable>
            </View>

            <View style={styles.modalTabs}>
              {(["friends", "following", "followers"] as const).map((tab) => (
                <Pressable
                  key={tab}
                  onPress={() => { void openList(tab); }}
                  style={[styles.modalTab, activeModal === tab && styles.modalTabActive]}
                >
                  <Text style={[styles.modalTabText, activeModal === tab && styles.modalTabTextActive]}>
                    {tab.toUpperCase()}
                  </Text>
                </Pressable>
              ))}
            </View>

            {modalLoading ? (
              <View style={styles.modalLoading}>
                <Text style={styles.modalLoadingText}>Loading connections...</Text>
              </View>
            ) : (
              <FlatList
                data={modalUsers}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.modalList}
                ListEmptyComponent={
                  <View style={styles.modalEmpty}>
                    <Text style={styles.modalEmptyTitle}>No {activeModal} found</Text>
                    <Text style={styles.modalEmptyCopy}>Find people on the Search tab to connect and grow your scrapbook circle.</Text>
                  </View>
                }
                renderItem={({ item }) => (
                  <Link href={`/user/${item.id}`} asChild onPress={() => setActiveModal(null)}>
                    <Pressable style={styles.userRow}>
                      <Image source={{ uri: item.avatarUrl ?? undefined }} style={styles.userRowAvatar} />
                      <View style={styles.userRowMeta}>
                        <Text style={styles.userRowName}>{item.displayName}</Text>
                        <Text style={styles.userRowHandle}>@{item.username}</Text>
                        {item.bio ? <Text numberOfLines={1} style={styles.userRowBio}>{item.bio}</Text> : null}
                      </View>
                      <Text style={styles.userRowAction}>View ›</Text>
                    </Pressable>
                  </Link>
                )}
              />
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

function shouldShowOnProfile(expiresAt: string, profileFeatured?: boolean) {
  if (profileFeatured) return true;
  return new Date(expiresAt).getTime() > Date.now();
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.paperCream },
  content: { padding: 18, paddingTop: 46, paddingBottom: 110, gap: 12 },
  emptyContent: { padding: 22, paddingTop: 58, paddingBottom: 110, alignItems: "center", gap: 14 },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  handle: { color: palette.ink, fontSize: 22, fontWeight: "900" },
  topActions: { flexDirection: "row", gap: 8 },
  iconButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: palette.whitePaper, borderWidth: 1, borderColor: "#E4D9CA", alignItems: "center", justifyContent: "center" },
  header: { flexDirection: "row", alignItems: "center", gap: 18 },
  avatar: { width: 92, height: 92, borderRadius: 46, backgroundColor: "#E4D9CA", borderWidth: 3, borderColor: palette.whitePaper },
  emptyAvatar: { width: 112, height: 112, borderRadius: 56, backgroundColor: palette.ink, alignItems: "center", justifyContent: "center", borderWidth: 4, borderColor: palette.whitePaper },
  emptyAvatarText: { color: palette.whitePaper, fontSize: 44, fontWeight: "900" },
  stats: { flex: 1, flexDirection: "row", justifyContent: "space-around" },
  statBox: { alignItems: "center" },
  statNumber: { color: palette.ink, fontWeight: "900", fontSize: 18 },
  statLabel: { color: palette.mutedBrown, fontWeight: "800", fontSize: 12, marginTop: 2 },
  statLabelClickable: { color: palette.ink, fontWeight: "900", fontSize: 12, marginTop: 2 },
  name: { color: palette.ink, fontSize: 20, fontWeight: "900" },
  bio: { color: palette.mutedBrown, lineHeight: 21 },
  visibility: { alignSelf: "flex-start", color: palette.ink, backgroundColor: palette.sunshine, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 5, overflow: "hidden", fontWeight: "900", fontSize: 12 },
  actions: { flexDirection: "row", gap: 8 },
  actionButton: { flex: 1, minHeight: 46 },
  highlights: { gap: 14, paddingVertical: 6 },
  highlight: { width: 66, alignItems: "center", gap: 5 },
  highlightCircle: { width: 58, height: 58, borderRadius: 29, backgroundColor: palette.whitePaper, borderWidth: 1, borderColor: "#E4D9CA", alignItems: "center", justifyContent: "center" },
  highlightText: { color: palette.ink, fontSize: 11, fontWeight: "800" },
  gridHeader: { height: 42, borderTopWidth: 1, borderBottomWidth: 1, borderColor: "#E4D9CA", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  gridTitle: { color: palette.ink, fontWeight: "900" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 3 },
  tile: { width: "32.6%", aspectRatio: 1, backgroundColor: "#E4D9CA", borderRadius: 6, overflow: "hidden", position: "relative" },
  tileImage: { width: "100%", height: "100%" },
  tileKept: { position: "absolute", bottom: 4, left: 4, backgroundColor: palette.ink, paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4 },
  tileKeptText: { color: palette.sunshine, fontSize: 8, fontWeight: "900" },
  tileLock: { position: "absolute", top: 4, right: 4, backgroundColor: "rgba(0,0,0,.6)", width: 20, height: 20, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  emptyGrid: { backgroundColor: palette.whitePaper, borderRadius: 12, padding: 22, alignItems: "center", gap: 8, borderWidth: 1, borderColor: "#E4D9CA", marginVertical: 12 },
  emptyTitle: { fontSize: 18, fontWeight: "900", color: palette.ink },
  emptyCopy: { fontSize: 14, color: palette.mutedBrown, textAlign: "center", lineHeight: 20 },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,.5)", justifyContent: "flex-end" },
  modalSheet: { backgroundColor: palette.whitePaper, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: "80%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  modalTitle: { fontSize: 22, fontWeight: "900", color: palette.ink },
  modalClose: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#F0E8DC", alignItems: "center", justifyContent: "center" },
  modalCloseText: { fontSize: 16, fontWeight: "900", color: palette.ink },
  modalTabs: { flexDirection: "row", gap: 8, marginBottom: 14 },
  modalTab: { flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: 12, backgroundColor: palette.paperCream },
  modalTabActive: { backgroundColor: palette.ink },
  modalTabText: { fontSize: 11, fontWeight: "900", color: palette.mutedBrown },
  modalTabTextActive: { color: palette.whitePaper },
  modalLoading: { padding: 30, alignItems: "center" },
  modalLoadingText: { color: palette.mutedBrown, fontWeight: "800" },
  modalList: { gap: 12, paddingBottom: 24 },
  modalEmpty: { padding: 30, alignItems: "center", gap: 8 },
  modalEmptyTitle: { fontSize: 18, fontWeight: "900", color: palette.ink },
  modalEmptyCopy: { fontSize: 13, color: palette.mutedBrown, textAlign: "center", lineHeight: 18 },
  userRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 10, borderRadius: 12, backgroundColor: palette.paperCream },
  userRowAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#E4D9CA" },
  userRowMeta: { flex: 1 },
  userRowName: { fontSize: 15, fontWeight: "900", color: palette.ink },
  userRowHandle: { fontSize: 12, color: palette.mutedBrown, fontWeight: "700" },
  userRowBio: { fontSize: 11, fontStyle: "italic", color: palette.mutedBrown, marginTop: 2 },
  userRowAction: { fontSize: 13, fontWeight: "900", color: palette.ink }
});
