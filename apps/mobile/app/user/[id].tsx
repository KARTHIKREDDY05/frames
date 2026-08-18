import { Link, useLocalSearchParams } from "expo-router";
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
  const mergePosts = useAppStore((state) => state.mergePosts);
  const [user, setUser] = useState<UserDto | null>(null);
  const [isFriend, setIsFriend] = useState(false);
  const [pending, setPending] = useState(false);
  const [stats, setStats] = useState({ friends: 0, followers: 0, following: 0 });
  const [message, setMessage] = useState("Loading profile...");

  useEffect(() => {
    const load = async () => {
      if (!userId) return;
      const [{ profile, error }, friendships, remoteStats, remotePosts] = await Promise.all([fetchProfileById(userId), fetchMyFriendships(), fetchProfileStats(userId), fetchUserPosts(userId)]);
      if (error || !profile) {
        setMessage("Profile not found.");
        setUser(null);
        return;
      }
      setUser(profile);
      setStats(remoteStats);
      mergePosts(remotePosts.posts);
      const relation = friendships.friendships.find((item) => item.requesterId === userId || item.receiverId === userId);
      const direct = relation ?? (await fetchRelationshipWithProfile(userId)).relation;
      const localFriend = localFriends.some((item) => item.id === userId);
      setIsFriend(direct?.status === "ACCEPTED" || localFriend);
      setPending(Boolean(direct?.status === "PENDING" && direct.requesterId === currentUser?.id));
      setMessage("");
    };
    void load();
  }, [currentUser?.id, localFriends, mergePosts, userId]);

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{message}</Text>
        <Link href="/(tabs)/search" asChild><FrameButton icon="search" label="Back to Search" /></Link>
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
        <Text style={styles.handle}>@{user.username}</Text>
        <Link href="/(tabs)/search" asChild><Pressable style={styles.iconButton}><AppIcon name="search" color={palette.ink} size={20} /></Pressable></Link>
      </View>
      <View style={styles.header}>
        <Image source={{ uri: user.avatarUrl ?? undefined }} style={styles.avatar} />
        <View style={styles.stats}>
          <View style={styles.statItem}><Text style={styles.statNumber}>{privateLocked ? 0 : visiblePosts.length}</Text><Text style={styles.statLabel}>Frames</Text></View>
          <View style={styles.statItem}><Text style={styles.statNumber}>{stats.friends}</Text><Text style={styles.statLabel}>Friends</Text></View>
          <View style={styles.statItem}><Text style={styles.statNumber}>{stats.following}</Text><Text style={styles.statLabel}>Following</Text></View>
        </View>
      </View>
      <Text style={styles.name}>{user.displayName}</Text>
      <Text style={styles.accountLine}>{user.profileVisibility === "PRIVATE" ? "Private account" : "Public account"}</Text>
      <Text style={styles.bio}>{privateLocked ? "Follow this account to see their Frames." : user.bio ?? "No bio yet."}</Text>
      <View style={styles.actions}>
        <FrameButton icon={isFriend ? "check" : pending ? "clock" : "user-plus"} label={isFriend ? "Following" : pending ? "Requested" : "Follow"} variant={isFriend || pending ? "secondary" : "primary"} style={styles.actionButton} onPress={() => { void follow(); }} />
        {isFriend ? <Link href={`/chat/${user.id}`} asChild><FrameButton icon="comment" label="Message" variant="secondary" style={styles.actionButton} /></Link> : null}
      </View>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      <View style={styles.gridHeader}>
        <AppIcon name={privateLocked ? "lock" : "archive"} color={palette.ink} size={18} />
        <Text style={styles.gridTitle}>{privateLocked ? "Private Frames" : "Frames"}</Text>
      </View>
      {privateLocked ? (
        <View style={styles.locked}>
          <AppIcon name="lock" color={palette.ink} size={34} />
          <Text style={styles.lockedTitle}>Frames hidden</Text>
          <Text style={styles.lockedCopy}>Once your request is accepted, this grid opens.</Text>
        </View>
      ) : visiblePosts.length === 0 ? (
        <View style={styles.locked}>
          <Text style={styles.lockedTitle}>No visible Frames.</Text>
          <Text style={styles.lockedCopy}>{isFriend ? "This friend has not posted yet." : "Public Frames will appear here. Friends-only Frames need an accepted request."}</Text>
        </View>
      ) : (
        <View style={styles.grid}>
          {visiblePosts.map((post) => (
            <Link key={post.id} href={`/post/${post.id}`} asChild>
              <Pressable style={styles.tile}>
                <Image source={{ uri: post.mediaUrl }} style={styles.tileImage} />
                {post.profileFeatured ? <View style={styles.tileKept}><Text style={styles.tileKeptText}>KEPT</Text></View> : null}
                {post.privacy === "FRIENDS" ? <View style={styles.tileLock}><AppIcon name="lock" color={palette.whitePaper} size={14} /></View> : null}
              </Pressable>
            </Link>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.paperCream },
  content: { padding: 18, paddingTop: 42, paddingBottom: 110, gap: 12 },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  handle: { color: palette.ink, fontSize: 22, fontWeight: "900" },
  iconButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: palette.whitePaper, borderWidth: 1, borderColor: "#E4D9CA", alignItems: "center", justifyContent: "center" },
  header: { flexDirection: "row", alignItems: "center", gap: 18 },
  avatar: { width: 92, height: 92, borderRadius: 46, backgroundColor: "#E4D9CA", borderWidth: 3, borderColor: palette.whitePaper },
  stats: { flex: 1, flexDirection: "row", justifyContent: "space-between" },
  statItem: { alignItems: "center", minWidth: 70 },
  statNumber: { color: palette.ink, fontWeight: "900", fontSize: 18 },
  statLabel: { color: palette.mutedBrown, fontWeight: "800", fontSize: 12, marginTop: 2 },
  title: { color: palette.ink, fontSize: 28, fontWeight: "900", margin: 22, marginTop: 58 },
  name: { color: palette.ink, fontSize: 20, fontWeight: "900" },
  accountLine: { color: palette.mutedBrown, fontSize: 12, fontWeight: "900" },
  bio: { color: palette.mutedBrown, lineHeight: 21 },
  actions: { flexDirection: "row", gap: 8 },
  actionButton: { flex: 1, minHeight: 46 },
  message: { color: palette.ink, backgroundColor: "#F8E7B2", borderRadius: 8, padding: 12, fontWeight: "800", lineHeight: 20 },
  gridHeader: { height: 42, borderTopWidth: 1, borderBottomWidth: 1, borderColor: "#E4D9CA", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  gridTitle: { color: palette.ink, fontWeight: "900" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 2 },
  tile: { width: "33%", aspectRatio: 1, backgroundColor: "#E4D9CA", position: "relative" },
  tileImage: { width: "100%", height: "100%" },
  tileKept: { position: "absolute", left: 6, top: 6, borderRadius: 10, backgroundColor: palette.sunshine, paddingHorizontal: 7, paddingVertical: 3 },
  tileKeptText: { color: palette.ink, fontSize: 9, fontWeight: "900" },
  tileLock: { position: "absolute", right: 6, top: 6, width: 24, height: 24, borderRadius: 12, backgroundColor: "rgba(52,43,42,0.72)", alignItems: "center", justifyContent: "center" },
  locked: { backgroundColor: palette.whitePaper, borderRadius: 8, borderWidth: 1, borderColor: "#E4D9CA", padding: 22, alignItems: "center", gap: 8 },
  lockedTitle: { color: palette.ink, fontSize: 22, fontWeight: "900", textAlign: "center" },
  lockedCopy: { color: palette.mutedBrown, textAlign: "center", lineHeight: 22 }
});

function shouldShowOnProfile(expiresAt: string, featured?: boolean) {
  return featured || new Date(expiresAt).getTime() > Date.now();
}
