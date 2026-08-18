import { Link } from "expo-router";
import { useEffect, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { palette } from "@frames/ui";
import { AppIcon } from "../../components/AppIcon";
import { FrameButton } from "../../components/FrameButton";
import { fetchProfileStats, fetchUserPosts } from "../../services/supabase";
import { useAppStore } from "../../store/appStore";

export default function ProfileScreen() {
  const user = useAppStore((state) => state.currentUser);
  const posts = useAppStore((state) => state.posts);
  const dailyFrames = useAppStore((state) => state.dailyFrames);
  const mergePosts = useAppStore((state) => state.mergePosts);
  const logout = useAppStore((state) => state.logout);
  const [stats, setStats] = useState({ friends: 0, followers: 0, following: 0 });

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      const [{ posts: remotePosts }, remoteStats] = await Promise.all([fetchUserPosts(user.id), fetchProfileStats(user.id)]);
      mergePosts(remotePosts);
      setStats(remoteStats);
    };
    void load();
  }, [mergePosts, user]);

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
  const gridPosts = [...posts.filter((post) => post.user.id === user.id && shouldShowOnProfile(post.expiresAt, post.profileFeatured)), ...archivedPosts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const completedFields = [user.displayName, user.email, user.username, user.bio, user.avatarUrl, user.defaultPrivacy].filter(Boolean).length;
  const profilePercent = Math.round((completedFields / 6) * 100);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.topBar}>
        <Text style={styles.handle}>@{user.username}</Text>
        <View style={styles.topActions}>
          <Link href="/notifications" asChild><Pressable style={styles.iconButton}><AppIcon name="bell" color={palette.ink} size={20} /></Pressable></Link>
          <Link href="/settings" asChild><Pressable style={styles.iconButton}><AppIcon name="settings" color={palette.ink} size={20} /></Pressable></Link>
        </View>
      </View>

      <View style={styles.header}>
        <Image source={{ uri: user.avatarUrl ?? undefined }} style={styles.avatar} />
        <View style={styles.stats}>
          <Text style={styles.stat}>{gridPosts.length}{"\n"}Frames</Text>
          <Text style={styles.stat}>{stats.friends}{"\n"}Friends</Text>
          <Text style={styles.stat}>{stats.following}{"\n"}Following</Text>
        </View>
      </View>

      <Text style={styles.name}>{user.displayName}</Text>
      <Text style={styles.bio}>{user.bio ?? "Your life, framed automatically."}</Text>
      <Text style={styles.visibility}>{user.profileVisibility === "PRIVATE" ? "Private account" : "Public account"}</Text>

      <View style={styles.actions}>
        <Link href="/settings" asChild><FrameButton icon="profile" label="Edit Profile" variant="secondary" style={styles.actionButton} /></Link>
        <Link href="/(tabs)/chats" asChild><FrameButton icon="comment" label="Chats" variant="secondary" style={styles.actionButton} /></Link>
      </View>

      <View style={styles.completion}>
        <Text style={styles.completionLabel}>Profile {profilePercent}% complete</Text>
        <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${profilePercent}%` }]} /></View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.highlights}>
        <Link href="/(tabs)/camera" asChild><Pressable style={styles.highlight}><View style={styles.highlightCircle}><AppIcon name="camera" color={palette.ink} size={22} /></View><Text style={styles.highlightText}>New</Text></Pressable></Link>
        <Link href="/(tabs)/archive" asChild><Pressable style={styles.highlight}><View style={styles.highlightCircle}><AppIcon name="archive" color={palette.ink} size={22} /></View><Text style={styles.highlightText}>Archive</Text></Pressable></Link>
        <Link href="/share" asChild><Pressable style={styles.highlight}><View style={styles.highlightCircle}><AppIcon name="send" color={palette.ink} size={22} /></View><Text style={styles.highlightText}>Share</Text></Pressable></Link>
      </ScrollView>

      <View style={styles.gridHeader}>
        <AppIcon name="archive" color={palette.ink} size={18} />
        <Text style={styles.gridTitle}>Frames</Text>
      </View>
      {gridPosts.length === 0 ? (
        <View style={styles.emptyGrid}>
          <Text style={styles.emptyTitle}>No Frames yet.</Text>
          <Text style={styles.emptyCopy}>Capture your first moment and it will land in this grid.</Text>
        </View>
      ) : (
        <View style={styles.grid}>
          {gridPosts.map((post) => (
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
      <FrameButton icon="sign-out" label="Sign Out" variant="secondary" onPress={logout} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.paperCream },
  content: { padding: 18, paddingTop: 42, paddingBottom: 110, gap: 12 },
  emptyContent: { padding: 22, paddingTop: 58, paddingBottom: 110, alignItems: "center", gap: 12 },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  handle: { color: palette.ink, fontSize: 22, fontWeight: "900" },
  topActions: { flexDirection: "row", gap: 8 },
  iconButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: palette.whitePaper, borderWidth: 1, borderColor: "#E4D9CA", alignItems: "center", justifyContent: "center" },
  header: { flexDirection: "row", alignItems: "center", gap: 18 },
  avatar: { width: 92, height: 92, borderRadius: 46, backgroundColor: "#E4D9CA", borderWidth: 3, borderColor: palette.whitePaper },
  emptyAvatar: { width: 112, height: 112, borderRadius: 56, backgroundColor: palette.ink, alignItems: "center", justifyContent: "center", borderWidth: 4, borderColor: palette.whitePaper },
  emptyAvatarText: { color: palette.whitePaper, fontSize: 44, fontWeight: "900" },
  stats: { flex: 1, flexDirection: "row", justifyContent: "space-between" },
  stat: { color: palette.ink, textAlign: "center", fontWeight: "900", lineHeight: 21 },
  name: { color: palette.ink, fontSize: 20, fontWeight: "900" },
  bio: { color: palette.mutedBrown, lineHeight: 21 },
  visibility: { alignSelf: "flex-start", color: palette.ink, backgroundColor: palette.sunshine, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 5, overflow: "hidden", fontWeight: "900", fontSize: 12 },
  actions: { flexDirection: "row", gap: 8 },
  actionButton: { flex: 1, minHeight: 46 },
  completion: { backgroundColor: palette.whitePaper, borderRadius: 8, borderWidth: 1, borderColor: "#E4D9CA", padding: 12, gap: 8 },
  completionLabel: { color: palette.ink, fontWeight: "900" },
  progressTrack: { height: 7, borderRadius: 4, backgroundColor: "#E4D9CA", overflow: "hidden" },
  progressFill: { height: 7, borderRadius: 4, backgroundColor: palette.sunshine },
  highlights: { gap: 14, paddingVertical: 6 },
  highlight: { width: 66, alignItems: "center", gap: 5 },
  highlightCircle: { width: 58, height: 58, borderRadius: 29, backgroundColor: palette.whitePaper, borderWidth: 1, borderColor: "#E4D9CA", alignItems: "center", justifyContent: "center" },
  highlightText: { color: palette.ink, fontSize: 11, fontWeight: "800" },
  gridHeader: { height: 42, borderTopWidth: 1, borderBottomWidth: 1, borderColor: "#E4D9CA", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  gridTitle: { color: palette.ink, fontWeight: "900" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 2 },
  tile: { width: "33%", aspectRatio: 1, backgroundColor: "#E4D9CA", position: "relative" },
  tileImage: { width: "100%", height: "100%" },
  tileKept: { position: "absolute", left: 6, top: 6, borderRadius: 10, backgroundColor: palette.sunshine, paddingHorizontal: 7, paddingVertical: 3 },
  tileKeptText: { color: palette.ink, fontSize: 9, fontWeight: "900" },
  tileLock: { position: "absolute", right: 6, top: 6, width: 24, height: 24, borderRadius: 12, backgroundColor: "rgba(52,43,42,0.72)", alignItems: "center", justifyContent: "center" },
  emptyGrid: { backgroundColor: palette.whitePaper, borderRadius: 8, borderWidth: 1, borderColor: "#E4D9CA", padding: 18, gap: 6 },
  emptyTitle: { color: palette.ink, fontSize: 22, fontWeight: "900" },
  emptyCopy: { color: palette.mutedBrown, lineHeight: 22 }
});

function shouldShowOnProfile(expiresAt: string, featured?: boolean) {
  return featured || new Date(expiresAt).getTime() > Date.now();
}
