import { Link } from "expo-router";
import { useEffect, useState } from "react";
import { FlatList, Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { palette } from "@frames/ui";
import { AppIcon } from "../../components/AppIcon";
import { FrameButton } from "../../components/FrameButton";
import { WashiTape } from "../../components/WashiTape";
import { fetchFollowersList, fetchFollowingList, fetchFriendsList, fetchProfileStats, fetchUserPosts } from "../../services/supabase";
import { useAppStore } from "../../store/appStore";
import type { PostDto, UserDto } from "@frames/types";

export default function ProfileScreen() {
  const user = useAppStore((state) => state.currentUser);
  const posts = useAppStore((state) => state.posts);
  const dailyFrames = useAppStore((state) => state.dailyFrames);
  const logout = useAppStore((state) => state.logout);
  const mergePosts = useAppStore((state) => state.mergePosts);

  const [stats, setStats] = useState<{ friends: number; followers: number; following: number }>({ friends: 0, followers: 0, following: 0 });
  const [activeModal, setActiveModal] = useState<"followers" | "following" | null>(null);
  const [modalUsers, setModalUsers] = useState<UserDto[]>([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [gridTab, setGridTab] = useState<"active" | "pinned">("active");

  useEffect(() => {
    if (!user) return;
    void fetchProfileStats(user.id).then(setStats);
    void fetchUserPosts(user.id).then(({ posts: remotePosts }) => {
      if (remotePosts.length > 0) mergePosts(remotePosts);
    });
  }, [user, mergePosts]);

  const openList = async (type: "followers" | "following") => {
    if (!user) return;
    setActiveModal(type);
    setModalLoading(true);
    let result: { users: UserDto[] } = { users: [] };
    if (type === "followers") result = await fetchFollowersList(user.id);
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
  const allGridPosts = Array.from(postMap.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const gridPosts = gridTab === "pinned" ? allGridPosts.filter((p) => p.profileFeatured) : allGridPosts;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <View style={styles.brandBadge}>
          <Text style={styles.brandBadgeText}>FRAMES</Text>
        </View>
        <Text style={styles.handle}>@{user.username}</Text>
        <View style={styles.topActions}>
          <Link href="/notifications" asChild>
            <Pressable style={styles.iconButton}><AppIcon name="bell" color={palette.ink} size={18} /></Pressable>
          </Link>
          <Link href="/settings" asChild>
            <Pressable style={styles.iconButton}><AppIcon name="settings" color={palette.ink} size={18} /></Pressable>
          </Link>
        </View>
      </View>

      {/* Profile Header Canvas */}
      <View style={styles.headerCanvas}>
        {/* Avatar with Washi Tape and Tilt */}
        <View style={styles.avatarWrap}>
          <WashiTape label="MY FRAME" color="lavender" tilt="2deg" position="top" />
          <View style={styles.avatarCard}>
            <Image source={{ uri: user.avatarUrl ?? undefined }} style={styles.avatar} />
          </View>
          <View style={styles.verifiedSticker}>
            <Text style={styles.verifiedText}>✓ VERIFIED</Text>
          </View>
        </View>

        <Text style={styles.name}>{user.displayName}</Text>
        <Text style={styles.bio}>{user.bio || "Capturing everyday noise. Digital scrapbooker & analog enthusiast. 📸✨"}</Text>

        <View style={styles.visibilityBadge}>
          <Text style={styles.visibilityText}>{user.profileVisibility === "PRIVATE" ? "🔒 PRIVATE ACCOUNT" : "🌍 PUBLIC ACCOUNT"}</Text>
        </View>

        {/* Tactile Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{allGridPosts.length}</Text>
            <Text style={styles.statLabel}>FRAMES</Text>
          </View>
          <Pressable style={[styles.statCard, styles.statCardFollowers]} onPress={() => { void openList("followers"); }}>
            <Text style={styles.statNumber}>{stats.followers}</Text>
            <Text style={styles.statLabel}>FOLLOWERS ›</Text>
          </Pressable>
          <Pressable style={[styles.statCard, styles.statCardFollowing]} onPress={() => { void openList("following"); }}>
            <Text style={styles.statNumber}>{stats.following}</Text>
            <Text style={styles.statLabel}>FOLLOWING ›</Text>
          </Pressable>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Link href="/settings" asChild>
            <Pressable style={styles.editBtn}>
              <Text style={styles.editBtnText}>EDIT PROFILE</Text>
            </Pressable>
          </Link>
          <Link href="/(tabs)/chats" asChild>
            <Pressable style={styles.chatsBtn}>
              <AppIcon name="comment" color={palette.ink} size={18} />
              <Text style={styles.chatsBtnText}>CHATS</Text>
            </Pressable>
          </Link>
        </View>
      </View>

      {/* Highlights Quick Strip */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.highlights}>
        <Link href="/(tabs)/camera" asChild>
          <Pressable style={styles.highlight}>
            <View style={styles.highlightCircle}><AppIcon name="camera" color={palette.ink} size={20} /></View>
            <Text style={styles.highlightText}>Capture</Text>
          </Pressable>
        </Link>
        <Link href="/(tabs)/archive" asChild>
          <Pressable style={styles.highlight}>
            <View style={styles.highlightCircle}><AppIcon name="archive" color={palette.ink} size={20} /></View>
            <Text style={styles.highlightText}>Archive</Text>
          </Pressable>
        </Link>
        <Link href="/share" asChild>
          <Pressable style={styles.highlight}>
            <View style={styles.highlightCircle}><AppIcon name="send" color={palette.ink} size={20} /></View>
            <Text style={styles.highlightText}>Share</Text>
          </Pressable>
        </Link>
      </ScrollView>

      {/* Frames Box Section */}
      <View style={styles.gridSection}>
        <View style={styles.gridHeaderRow}>
          <View style={styles.gridTitleBadge}>
            <Text style={styles.gridTitleText}>FRAMES BOX</Text>
          </View>
          <View style={styles.gridTabPills}>
            <Pressable
              style={[styles.gridTabPill, gridTab === "active" && styles.gridTabPillActive]}
              onPress={() => setGridTab("active")}
            >
              <Text style={[styles.gridTabPillText, gridTab === "active" && styles.gridTabPillTextActive]}>
                ALL ({allGridPosts.length})
              </Text>
            </Pressable>
            <Pressable
              style={[styles.gridTabPill, gridTab === "pinned" && styles.gridTabPillActive]}
              onPress={() => setGridTab("pinned")}
            >
              <Text style={[styles.gridTabPillText, gridTab === "pinned" && styles.gridTabPillTextActive]}>
                ★ PINNED
              </Text>
            </Pressable>
          </View>
        </View>

        {gridPosts.length === 0 ? (
          <View style={styles.emptyGrid}>
            <Text style={styles.emptyTitle}>No Frames in this box</Text>
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
                    <View style={styles.tileLock}><AppIcon name="lock" color={palette.whitePaper} size={12} /></View>
                  ) : null}
                </Pressable>
              </Link>
            ))}
          </View>
        )}
      </View>

      <FrameButton icon="sign-out" label="Sign Out" variant="secondary" onPress={logout} />

      {/* Relations Modal */}
      <Modal visible={Boolean(activeModal)} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setActiveModal(null)} />
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {activeModal === "followers" ? "Followers" : "Following"}
              </Text>
              <Pressable onPress={() => setActiveModal(null)} style={styles.modalClose}>
                <Text style={styles.modalCloseText}>✕</Text>
              </Pressable>
            </View>

            <View style={styles.modalTabs}>
              {(["followers", "following"] as const).map((tab) => (
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
  content: { padding: 16, paddingTop: 52, paddingBottom: 40, gap: 16 },
  emptyContent: { flex: 1, padding: 24, justifyContent: "center", alignItems: "center", gap: 12 },
  emptyAvatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: palette.softPeach, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: palette.ink },
  emptyAvatarText: { fontSize: 32, fontWeight: "900", color: palette.ink },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  brandBadge: { backgroundColor: palette.ink, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, transform: [{ rotate: "-2deg" }] },
  brandBadgeText: { color: palette.acidYellow, fontSize: 11, fontWeight: "900", letterSpacing: 1 },
  handle: { fontSize: 13, fontWeight: "900", color: palette.mutedBrown, letterSpacing: 0.5 },
  topActions: { flexDirection: "row", gap: 8 },
  iconButton: { width: 36, height: 36, borderRadius: 18, borderWidth: 1.5, borderColor: palette.ink, backgroundColor: palette.whitePaper, alignItems: "center", justifyContent: "center", shadowColor: palette.ink, shadowOffset: { width: 2, height: 2 }, shadowOpacity: 0.8, shadowRadius: 0, elevation: 2 },
  headerCanvas: { alignItems: "center", backgroundColor: palette.whitePaper, borderWidth: 2, borderColor: palette.ink, borderRadius: 8, padding: 20, paddingTop: 28, shadowColor: palette.ink, shadowOffset: { width: 4, height: 4 }, shadowOpacity: 0.9, shadowRadius: 0, elevation: 4 },
  avatarWrap: { position: "relative", marginBottom: 12, alignItems: "center" },
  avatarCard: { width: 96, height: 96, borderRadius: 6, borderWidth: 2, borderColor: palette.ink, backgroundColor: palette.whitePaper, padding: 4, transform: [{ rotate: "-2deg" }], shadowColor: palette.ink, shadowOffset: { width: 3, height: 3 }, shadowOpacity: 0.8, shadowRadius: 0 },
  avatar: { width: "100%", height: "100%", borderRadius: 4 },
  verifiedSticker: { position: "absolute", bottom: -8, right: -12, backgroundColor: palette.softLavender, borderWidth: 1.5, borderColor: palette.ink, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, transform: [{ rotate: "8deg" }] },
  verifiedText: { fontSize: 9, fontWeight: "900", color: palette.ink, letterSpacing: 0.5 },
  name: { fontSize: 24, fontWeight: "900", color: palette.ink, letterSpacing: -0.5, marginTop: 4 },
  bio: { fontSize: 14, color: palette.ink, textAlign: "center", lineHeight: 20, marginVertical: 6, maxWidth: 300, fontWeight: "600" },
  visibilityBadge: { backgroundColor: palette.paperCream, borderWidth: 1, borderColor: palette.ink, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 4, marginVertical: 6 },
  visibilityText: { fontSize: 10, fontWeight: "900", color: palette.ink, letterSpacing: 0.8 },
  statsRow: { flexDirection: "row", gap: 8, marginVertical: 12, width: "100%" },
  statCard: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 10, borderWidth: 1.5, borderColor: palette.ink, borderRadius: 6, backgroundColor: palette.whitePaper, shadowColor: palette.ink, shadowOffset: { width: 2, height: 2 }, shadowOpacity: 0.8, shadowRadius: 0, elevation: 2 },
  statCardFollowers: { backgroundColor: palette.softLavender },
  statCardFollowing: { backgroundColor: palette.acidYellow },
  statNumber: { fontSize: 18, fontWeight: "900", color: palette.ink },
  statLabel: { fontSize: 9, fontWeight: "900", color: palette.ink, letterSpacing: 0.6, marginTop: 2 },
  actions: { flexDirection: "row", gap: 10, width: "100%", marginTop: 6 },
  editBtn: { flex: 1, backgroundColor: palette.acidYellow, borderWidth: 2, borderColor: palette.ink, paddingVertical: 12, borderRadius: 6, alignItems: "center", shadowColor: palette.ink, shadowOffset: { width: 2, height: 2 }, shadowOpacity: 0.9, shadowRadius: 0, elevation: 2 },
  editBtnText: { color: palette.ink, fontSize: 12, fontWeight: "900", letterSpacing: 0.8 },
  chatsBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: palette.softLavender, borderWidth: 2, borderColor: palette.ink, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 6, shadowColor: palette.ink, shadowOffset: { width: 2, height: 2 }, shadowOpacity: 0.9, shadowRadius: 0, elevation: 2 },
  chatsBtnText: { color: palette.ink, fontSize: 12, fontWeight: "900", letterSpacing: 0.8 },
  highlights: { flexDirection: "row", gap: 14, paddingVertical: 4 },
  highlight: { alignItems: "center", gap: 6 },
  highlightCircle: { width: 52, height: 52, borderRadius: 26, borderWidth: 1.5, borderColor: palette.ink, backgroundColor: palette.whitePaper, alignItems: "center", justifyContent: "center", shadowColor: palette.ink, shadowOffset: { width: 2, height: 2 }, shadowOpacity: 0.8, shadowRadius: 0 },
  highlightText: { fontSize: 11, fontWeight: "900", color: palette.ink },
  gridSection: { backgroundColor: "rgba(255,255,255,0.7)", borderWidth: 2, borderColor: palette.ink, borderRadius: 8, padding: 14, shadowColor: palette.ink, shadowOffset: { width: 4, height: 4 }, shadowOpacity: 0.9, shadowRadius: 0, elevation: 3 },
  gridHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14, paddingBottom: 10, borderBottomWidth: 1.5, borderColor: palette.ink },
  gridTitleBadge: { backgroundColor: palette.ink, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, transform: [{ rotate: "-1deg" }] },
  gridTitleText: { color: palette.whitePaper, fontSize: 12, fontWeight: "900", letterSpacing: 1 },
  gridTabPills: { flexDirection: "row", gap: 6 },
  gridTabPill: { paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1.5, borderColor: palette.ink, borderRadius: 4, backgroundColor: palette.whitePaper },
  gridTabPillActive: { backgroundColor: palette.acidYellow },
  gridTabPillText: { fontSize: 10, fontWeight: "900", color: palette.ink, letterSpacing: 0.5 },
  gridTabPillTextActive: { color: palette.ink },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  tile: { width: "31%", aspectRatio: 1, borderWidth: 2, borderColor: palette.ink, borderRadius: 4, backgroundColor: palette.whitePaper, padding: 3, shadowColor: palette.ink, shadowOffset: { width: 2, height: 2 }, shadowOpacity: 0.8, shadowRadius: 0, elevation: 2 },
  tileImage: { width: "100%", height: "100%", borderRadius: 2 },
  tileKept: { position: "absolute", bottom: 4, left: 4, backgroundColor: palette.acidYellow, borderWidth: 1, borderColor: palette.ink, paddingHorizontal: 4, paddingVertical: 1, borderRadius: 2 },
  tileKeptText: { fontSize: 8, fontWeight: "900", color: palette.ink },
  tileLock: { position: "absolute", top: 4, right: 4, backgroundColor: palette.ink, borderRadius: 10, width: 20, height: 20, alignItems: "center", justifyContent: "center" },
  emptyGrid: { padding: 24, alignItems: "center", gap: 6 },
  emptyTitle: { fontSize: 15, fontWeight: "900", color: palette.ink },
  emptyCopy: { fontSize: 12, color: palette.mutedBrown, textAlign: "center" },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  modalSheet: { backgroundColor: palette.whitePaper, borderTopLeftRadius: 20, borderTopRightRadius: 20, borderWidth: 2, borderColor: palette.ink, borderBottomWidth: 0, maxHeight: "75%", padding: 18 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  modalTitle: { fontSize: 18, fontWeight: "900", color: palette.ink },
  modalClose: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, borderColor: palette.ink, alignItems: "center", justifyContent: "center" },
  modalCloseText: { fontSize: 13, fontWeight: "900", color: palette.ink },
  modalTabs: { flexDirection: "row", borderWidth: 1.5, borderColor: palette.ink, borderRadius: 6, marginBottom: 12, overflow: "hidden" },
  modalTab: { flex: 1, paddingVertical: 8, alignItems: "center", backgroundColor: palette.whitePaper },
  modalTabActive: { backgroundColor: palette.acidYellow },
  modalTabText: { fontSize: 11, fontWeight: "900", color: palette.mutedBrown, letterSpacing: 0.6 },
  modalTabTextActive: { color: palette.ink },
  modalList: { gap: 10, paddingBottom: 24 },
  modalLoading: { padding: 24, alignItems: "center" },
  modalLoadingText: { fontSize: 13, color: palette.mutedBrown, fontWeight: "700" },
  modalEmpty: { padding: 24, alignItems: "center", gap: 6 },
  modalEmptyTitle: { fontSize: 15, fontWeight: "900", color: palette.ink },
  modalEmptyCopy: { fontSize: 12, color: palette.mutedBrown, textAlign: "center" },
  userRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 10, borderWidth: 1.5, borderColor: palette.ink, borderRadius: 6, backgroundColor: palette.paperCream },
  userRowAvatar: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, borderColor: palette.ink },
  userRowMeta: { flex: 1 },
  userRowName: { fontSize: 14, fontWeight: "900", color: palette.ink },
  userRowHandle: { fontSize: 11, color: palette.mutedBrown, fontWeight: "700" },
  userRowBio: { fontSize: 11, color: palette.ink, marginTop: 2 },
  userRowAction: { fontSize: 12, fontWeight: "900", color: palette.ink }
});
