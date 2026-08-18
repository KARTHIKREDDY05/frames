import { Link, router } from "expo-router";
import { Alert, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import type { PostDto } from "@frames/types";
import { palette } from "@frames/ui";
import { DateStamp } from "./DateStamp";
import { PolaroidFrame } from "./PolaroidFrame";
import { ReactionButton } from "./ReactionButton";
import { UserHeader } from "./UserHeader";
import { deleteRemotePost, setRemotePostProfileFeatured, toggleRemoteReaction } from "../services/supabase";
import { useAppStore } from "../store/appStore";
import { AppIcon } from "./AppIcon";

export function FrameCard({ post, tilt = "0deg" }: { post: PostDto; tilt?: string }) {
  const reactToPost = useAppStore((state) => state.reactToPost);
  const deletePost = useAppStore((state) => state.deletePost);
  const mergePosts = useAppStore((state) => state.mergePosts);
  const currentUser = useAppStore((state) => state.currentUser);
  const liked = useAppStore((state) => state.likedPostIds.includes(post.id));
  const ownsPost = currentUser?.id === post.user.id || (!currentUser && post.user.id === "user-guest");
  const capturedLabel = formatCapturedAt(post.createdAt);
  const lifeLabel = formatFrameLife(post.expiresAt, post.profileFeatured);
  const react = () => {
    reactToPost(post.id);
    void toggleRemoteReaction(post, liked);
  };
  const toggleFeatured = () => {
    const next = !post.profileFeatured;
    mergePosts([{ ...post, profileFeatured: next }]);
    void setRemotePostProfileFeatured(post.id, next).then(({ post: updated }) => {
      if (updated) mergePosts([updated]);
    });
  };
  const confirmDelete = () => {
    const remove = () => {
      deletePost(post.id);
      void deleteRemotePost(post.id);
    };
    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && window.confirm("Delete this Frame? This cannot be undone.")) remove();
      return;
    }
    Alert.alert("Delete Frame?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: remove }
    ]);
  };
  return (
    <View style={[styles.wrap, { transform: [{ rotate: tilt }] }]}>
      <View style={styles.headerRow}>
        <UserHeader user={post.user} meta={`${capturedLabel} - ${post.locationName ?? "No location"}`} />
        {ownsPost ? <Pressable accessibilityLabel="Delete Frame" style={styles.deleteButton} onPress={confirmDelete}><AppIcon name="delete" color="#9B2C2C" size={22} /></Pressable> : null}
      </View>
      <View style={styles.timeRow}>
        <Text style={styles.timePill}>{lifeLabel}</Text>
        {post.profileFeatured ? <Text style={styles.timePill}>Kept on profile</Text> : null}
      </View>
      <View style={styles.media}>
        <PolaroidFrame imageUrl={post.mediaUrl} caption={post.caption} frameStyle={post.frameStyle} filterPreset={post.filterPreset} />
      </View>
      <DateStamp value={new Date(post.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }).toUpperCase()} />
      <Text style={styles.privacy}>{post.privacy === "PUBLIC" ? "Public" : "Friends"}</Text>
      <ReactionButton
        reactions={post.reactionCount}
        comments={post.commentCount}
        liked={liked}
        onReact={react}
        onComment={() => router.push(`/comments/${post.id}`)}
        onShare={() => router.push(`/share?resourceType=post&resourceId=${post.id}`)}
      />
      {ownsPost ? (
        <Pressable style={styles.keepButton} onPress={toggleFeatured}>
          <AppIcon name={post.profileFeatured ? "check" : "archive"} color={palette.ink} size={16} />
          <Text style={styles.keepText}>{post.profileFeatured ? "Remove from profile" : "Keep on profile"}</Text>
        </Pressable>
      ) : null}
      <Link href={`/post/${post.id}`} style={styles.detail}>Open Frame</Link>
    </View>
  );
}

function formatCapturedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Captured";
  return `Captured ${date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
}

function formatFrameLife(expiresAt: string, featured?: boolean) {
  const expires = new Date(expiresAt).getTime();
  if (Number.isNaN(expires)) return featured ? "Profile Frame" : "24h Frame";
  const diff = expires - Date.now();
  if (diff <= 0) return featured ? "Expired - profile only" : "Archived";
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.max(1, Math.floor((diff % 3600000) / 60000));
  if (hours > 0) return `${hours}h ${minutes}m left`;
  return `${minutes}m left`;
}

const styles = StyleSheet.create({
  wrap: { backgroundColor: palette.whitePaper, borderRadius: 8, borderWidth: 1, borderColor: "#E4D9CA", padding: 14 },
  headerRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 },
  deleteButton: { width: 38, height: 38, borderRadius: 19, backgroundColor: "#F8E8E8", alignItems: "center", justifyContent: "center" },
  timeRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 10 },
  timePill: { color: palette.ink, backgroundColor: "#F8E7B2", borderRadius: 12, overflow: "hidden", paddingHorizontal: 9, paddingVertical: 4, fontSize: 11, fontWeight: "900" },
  media: { marginVertical: 14 },
  privacy: { color: palette.mutedBrown, fontWeight: "800", marginTop: 8 },
  keepButton: { marginTop: 10, minHeight: 36, borderRadius: 18, backgroundColor: "#F8F1E6", borderWidth: 1, borderColor: "#E4D9CA", alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 7 },
  keepText: { color: palette.ink, fontSize: 12, fontWeight: "900" },
  detail: { color: palette.ink, fontWeight: "900", marginTop: 12 }
});
