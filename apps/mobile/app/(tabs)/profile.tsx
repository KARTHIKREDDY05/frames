import { Link } from "expo-router";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { palette } from "@frames/ui";
import { FrameButton } from "../../components/FrameButton";
import { demoUser } from "../../features/demo/demoData";
import { useAppStore } from "../../store/appStore";

export default function ProfileScreen() {
  const signedInUser = useAppStore((state) => state.currentUser);
  const currentUser = signedInUser ?? demoUser;
  const posts = useAppStore((state) => state.posts);
  const dailyFrames = useAppStore((state) => state.dailyFrames);
  const friends = useAppStore((state) => state.friends);
  const logout = useAppStore((state) => state.logout);
  const ownPostCount = posts.filter((post) => post.user.id === currentUser.id).length + dailyFrames.reduce((sum, frame) => sum + frame.posts.filter((post) => post.user.id === currentUser.id).length, 0);
  const ownRecentPosts = posts.filter((post) => post.user.id === currentUser.id).slice(0, 3);
  const archivedYears = new Set(dailyFrames.filter((frame) => frame.posts.some((post) => post.user.id === currentUser.id)).map((frame) => frame.date.slice(0, 4))).size;
  const completedFields = [currentUser.displayName, currentUser.email, currentUser.username, currentUser.bio, currentUser.avatarUrl, currentUser.defaultPrivacy].filter(Boolean).length;
  const profilePercent = Math.round((completedFields / 6) * 100);
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Image source={{ uri: currentUser.avatarUrl ?? undefined }} style={styles.avatar} />
      <Text style={styles.name}>{currentUser.displayName}</Text>
      <Text style={styles.username}>@{currentUser.username}</Text>
      <View style={styles.completion}>
        <Text style={styles.completionLabel}>Profile {profilePercent}% complete</Text>
        <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${profilePercent}%` }]} /></View>
      </View>
      {!signedInUser ? (
        <View style={styles.authActions}>
          <Link href="/register" asChild><FrameButton label="Create Account" /></Link>
          <Link href="/login" asChild><FrameButton label="Sign In" variant="secondary" /></Link>
        </View>
      ) : null}
      <View style={styles.stats}>
        <Text style={styles.stat}>{ownPostCount}{"\n"}Frames</Text>
        <Text style={styles.stat}>{friends.length}{"\n"}Friends</Text>
        <Text style={styles.stat}>{archivedYears}{"\n"}Years</Text>
      </View>
      <Link href="/settings" asChild><FrameButton label="Edit Profile" variant="secondary" /></Link>
      <Link href="/share" asChild><FrameButton label="Share Scrapbook" /></Link>
      <Link href="/settings" asChild><FrameButton label="Settings" variant="secondary" /></Link>
      {signedInUser ? <FrameButton label="Sign Out" variant="secondary" onPress={logout} /> : null}
      <Text style={styles.section}>Recent Frames</Text>
      {ownRecentPosts.length === 0 ? <Text style={styles.empty}>No Frames posted from this profile yet.</Text> : ownRecentPosts.map((post) => <Text key={post.id} style={styles.recent}>{post.caption ?? "Untitled Frame"}</Text>)}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.paperCream },
  content: { padding: 22, paddingTop: 58, paddingBottom: 110, alignItems: "center", gap: 12 },
  avatar: { width: 112, height: 112, borderRadius: 56, borderWidth: 4, borderColor: palette.whitePaper },
  name: { fontSize: 30, fontWeight: "900", color: palette.ink },
  username: { color: palette.mutedBrown, fontSize: 16 },
  stats: { flexDirection: "row", justifyContent: "space-around", width: "100%", backgroundColor: palette.whitePaper, borderRadius: 8, padding: 18, marginVertical: 12 },
  completion: { width: "100%", backgroundColor: palette.whitePaper, borderRadius: 8, borderWidth: 1, borderColor: "#E4D9CA", padding: 14, gap: 8 },
  completionLabel: { color: palette.ink, fontWeight: "900" },
  progressTrack: { height: 8, borderRadius: 4, backgroundColor: "#E4D9CA", overflow: "hidden" },
  progressFill: { height: 8, borderRadius: 4, backgroundColor: palette.sunshine },
  authActions: { width: "100%", gap: 10 },
  stat: { textAlign: "center", color: palette.ink, fontWeight: "900", lineHeight: 22 },
  section: { alignSelf: "flex-start", fontSize: 22, fontWeight: "900", color: palette.ink, marginTop: 18 },
  empty: { alignSelf: "flex-start", color: palette.mutedBrown },
  recent: { alignSelf: "stretch", backgroundColor: palette.whitePaper, borderRadius: 8, padding: 14, color: palette.ink, fontWeight: "700" }
});
