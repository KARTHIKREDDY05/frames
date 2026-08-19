import { Link, router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { palette } from "@frames/ui";
import type { UserDto } from "@frames/types";
import { AppIcon } from "../../components/AppIcon";
import { FrameButton } from "../../components/FrameButton";
import { fetchMyFriendships, fetchProfileById, fetchProfileStats, fetchRelationshipWithProfile, fetchUserPosts, sendFollowRequestToProfile } from "../../services/supabase";
import { useAppStore } from "../../store/appStore";

export default function UserProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const userId = Array.isArray(id) ? id[0] : id;
  const posts = useAppStore((state) => state.posts);
  const currentUser = useAppStore((state) => state.currentUser);
  const localFriends = useAppStore((state) => state.friends);
  const discoverableUsers = useAppStore((state) => state.discoverableUsers);
  const mergePosts = useAppStore((state) => state.mergePosts);
  const [user, setUser] = useState<UserDto | null>(null);
  const [isFriend, setIsFriend] = useState(false);
  const [pending, setPending] = useState(false);
  const [stats, setStats] = useState({ friends: 0, followers: 0, following: 0 });
  const [message, setMessage] = useState("Loading profile...");

  useEffect(() => {
    const load = async () => {
      if (!userId) return;
      if (currentUser && userId === currentUser.id) {
        setUser(currentUser);
        return;
      }
      const [{ profile }, friendships, remoteStats, remotePosts] = await Promise.all([
        fetchProfileById(userId),
        fetchMyFriendships(),
        fetchProfileStats(userId),
        fetchUserPosts(userId)
      ]);
      const fallbackUser =
        profile ??
        localFriends.find((u) => u.id === userId) ??
        discoverableUsers.find((u) => u.id === userId) ??
        posts.find((p) => p.user.id === userId)?.user ??
        null;

      if (!fallbackUser) {
        setMessage("Profile not found.");
        setUser(null);
        return;
      }
      setUser(fallbackUser);
      setStats(remoteStats);
      if (remotePosts.posts.length > 0) mergePosts(remotePosts.posts);
      const relation = friendships.friendships.find((item) => item.requesterId === userId || item.receiverId === userId);
      const direct = relation ?? (await fetchRelationshipWithProfile(userId)).relation;
      const localFriend = localFriends.some((item) => item.id === userId);
      setIsFriend(direct?.status === "ACCEPTED" || localFriend);
      setPending(Boolean(direct?.status === "PENDING" && direct.requesterId === currentUser?.id));
      setMessage("");
    };
    void load();
  }, [currentUser, discoverableUsers, localFriends, mergePosts, posts, userId]);

  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.topBar}>
          <Pressable style={styles.iconButton} onPress={() => router.back()}>
            <AppIcon name="arrow-left" color={palette.ink} size={20} />
          </Pressable>
        </View>
        <View style={styles.emptyWrap}>
          <Text style={styles.title}>{message}</Text>
          <Link href="/(tabs)/search" asChild><FrameButton icon="search" label="Back to Search" /></Link>
        </View>
      </View>
    );
  }

  const privateLocked = user.profileVisibility === "PRIVATE" && !isFriend && user.id !== currentUser?.id;
  const visiblePosts = privateLocked ? [] : posts
    .filter((post) => post.user.id === user.id && shouldShowOnProfile(post.expiresAt, post.profileFeatured) && (post.privacy === "PUBLIC" || isFriend || user.id === currentUser?.id))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const follow = async () => {
    if (!currentUser) {
      setMessage("Sign in first so this request comes from your account.");
      return;
    }
    const { error } = await sendFollowRequestToProfile(user.id);
    if (error) {
      setMessage(error.message.includes("duplicate") ? "A follow request already exists." : error.message);
      return;
    }
    setPending(true);
    setMessage("Follow request sent.");
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.topBar}>
        <Pressable style={styles.iconButton} onPress={() => router.back()}>
          <AppIcon name="arrow-left" color={palette.ink} size={18} />
        </Pressable>
        <Text style={styles.handle}>@{user.username}</Text>
        <Link href="/(tabs)/search" asChild><Pressable style={styles.iconButton}><AppIcon name="search" color={palette.ink} size={18} /></Pressable></Link>
      </View>

      <View style={styles.headerCanvas}>
        <View style={styles.avatarCard}>
          <Image source={{ uri: user.avatarUrl ?? undefined }} style={styles.avatar} />
        </View>

        <Text style={styles.name}>{user.displayName}</Text>
        <View style={styles.visibilityBadge}>
          <Text style={styles.visibilityText}>{user.profileVisibility === "PRIVATE" ? "🔒 PRIVATE ACCOUNT" : "🌍 PUBLIC ACCOUNT"}</Text>
        </View>
        <Text style={styles.bio}>{privateLocked ? "Follow this account to see their Frames." : user.bio ?? "Capturing moments with Frames."}</Text>

        <View style={styles.statsRow}>
          <View style={styles.statCard}><Text style={styles.statNumber}>{privateLocked ? 0 : visiblePosts.length}</Text><Text style={styles.statLabel}>FRAMES</Text></View>
          <View style={[styles.statCard, { backgroundColor: palette.softLavender }]}><Text style={styles.statNumber}>{stats.followers}</Text><Text style={styles.statLabel}>FOLLOWERS</Text></View>
          <View style={[styles.statCard, { backgroundColor: palette.acidYellow }]}><Text style={styles.statNumber}>{stats.following}</Text><Text style={styles.statLabel}>FOLLOWING</Text></View>
        </View>

        <View style={styles.actions}>
          <FrameButton icon={isFriend ? "check" : pending ? "clock" : "user-plus"} label={isFriend ? "Following" : pending ? "Requested" : "Follow"} variant={isFriend || pending ? "secondary" : "primary"} style={styles.actionButton} onPress={() => { void follow(); }} />
          {isFriend ? <Link href={`/chat/${user.id}`} asChild><FrameButton icon="comment" label="Message" variant="secondary" style={styles.actionButton} /></Link> : null}
        </View>
      </View>

      {message ? <Text style={styles.message}>{message}</Text> : null}

      <View style={styles.gridHeader}>
        <AppIcon name={privateLocked ? "lock" : "archive"} color={palette.ink} size={18} />
        <Text style={styles.gridTitle}>{privateLocked ? "Private Frames" : `Frames (${visiblePosts.length})`}</Text>
      </View>

      {privateLocked ? (
        <View style={styles.locked}>
          <AppIcon name="lock" color={palette.ink} size={32} />
          <Text style={styles.lockedTitle}>This account is private</Text>
          <Text style={styles.lockedCopy}>Follow @{user.username} to see their shared moments and photos.</Text>
        </View>
      ) : visiblePosts.length === 0 ? (
        <View style={styles.emptyGrid}>
          <Text style={styles.emptyTitle}>No Frames posted yet</Text>
          <Text style={styles.emptyCopy}>This user hasn't posted any active frames today.</Text>
        </View>
      ) : (
        <View style={styles.grid}>
          {visiblePosts.map((post) => (
            <Link key={post.id} href={`/post/${post.id}`} asChild>
              <Pressable style={styles.tile}>
                <Image source={{ uri: post.mediaUrl }} style={styles.tileImage} />
                {post.profileFeatured ? (
                  <View style={styles.tileKept}><Text style={styles.tileKeptText}>KEPT</Text></View>
                ) : null}
              </Pressable>
            </Link>
          ))}
        </View>
      )}
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
  emptyWrap: { flex: 1, padding: 24, justifyContent: "center", alignItems: "center", gap: 16 },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  handle: { fontSize: 13, fontWeight: "900", color: palette.mutedBrown, letterSpacing: 0.5 },
  iconButton: { width: 36, height: 36, borderRadius: 18, borderWidth: 1.5, borderColor: palette.ink, backgroundColor: palette.whitePaper, alignItems: "center", justifyContent: "center", shadowColor: palette.ink, shadowOffset: { width: 2, height: 2 }, shadowOpacity: 0.8, shadowRadius: 0 },
  headerCanvas: { alignItems: "center", backgroundColor: palette.whitePaper, borderWidth: 2, borderColor: palette.ink, borderRadius: 8, padding: 20, paddingTop: 24, shadowColor: palette.ink, shadowOffset: { width: 4, height: 4 }, shadowOpacity: 0.9, shadowRadius: 0 },
  avatarCard: { width: 92, height: 92, borderRadius: 6, borderWidth: 2, borderColor: palette.ink, backgroundColor: palette.whitePaper, padding: 4, transform: [{ rotate: "-2deg" }], shadowColor: palette.ink, shadowOffset: { width: 3, height: 3 }, shadowOpacity: 0.8, shadowRadius: 0, marginBottom: 10 },
  avatar: { width: "100%", height: "100%", borderRadius: 4 },
  name: { fontSize: 24, fontWeight: "900", color: palette.ink, letterSpacing: -0.5 },
  visibilityBadge: { backgroundColor: palette.paperCream, borderWidth: 1, borderColor: palette.ink, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, marginVertical: 6 },
  visibilityText: { fontSize: 9, fontWeight: "900", color: palette.ink, letterSpacing: 0.8 },
  bio: { fontSize: 13, color: palette.ink, textAlign: "center", lineHeight: 18, marginVertical: 4, maxWidth: 290, fontWeight: "600" },
  statsRow: { flexDirection: "row", gap: 8, marginVertical: 12, width: "100%" },
  statCard: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 10, borderWidth: 1.5, borderColor: palette.ink, borderRadius: 6, backgroundColor: palette.whitePaper, shadowColor: palette.ink, shadowOffset: { width: 2, height: 2 }, shadowOpacity: 0.8, shadowRadius: 0 },
  statNumber: { fontSize: 18, fontWeight: "900", color: palette.ink },
  statLabel: { fontSize: 9, fontWeight: "900", color: palette.ink, letterSpacing: 0.6, marginTop: 2 },
  actions: { flexDirection: "row", gap: 8, width: "100%", marginTop: 6 },
  actionButton: { flex: 1 },
  message: { color: palette.mutedBrown, textAlign: "center", fontSize: 12, fontWeight: "700" },
  title: { fontSize: 22, fontWeight: "900", color: palette.ink, textAlign: "center" },
  gridHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 },
  gridTitle: { fontSize: 14, fontWeight: "900", color: palette.ink, textTransform: "uppercase", letterSpacing: 0.5 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  tile: { width: "31%", aspectRatio: 1, borderWidth: 2, borderColor: palette.ink, borderRadius: 4, backgroundColor: palette.whitePaper, padding: 3, shadowColor: palette.ink, shadowOffset: { width: 2, height: 2 }, shadowOpacity: 0.8, shadowRadius: 0 },
  tileImage: { width: "100%", height: "100%", borderRadius: 2 },
  tileKept: { position: "absolute", bottom: 4, left: 4, backgroundColor: palette.acidYellow, borderWidth: 1, borderColor: palette.ink, paddingHorizontal: 4, paddingVertical: 1, borderRadius: 2 },
  tileKeptText: { fontSize: 8, fontWeight: "900", color: palette.ink },
  locked: { padding: 32, alignItems: "center", gap: 8, borderWidth: 2, borderStyle: "dashed", borderColor: palette.ink, borderRadius: 8, backgroundColor: "rgba(255,255,255,0.5)" },
  lockedTitle: { fontSize: 16, fontWeight: "900", color: palette.ink },
  lockedCopy: { fontSize: 13, color: palette.mutedBrown, textAlign: "center", maxWidth: 260 },
  emptyGrid: { padding: 24, alignItems: "center", gap: 6 },
  emptyTitle: { fontSize: 15, fontWeight: "900", color: palette.ink },
  emptyCopy: { fontSize: 12, color: palette.mutedBrown, textAlign: "center" }
});
