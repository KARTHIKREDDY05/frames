import { Link, router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import type { PostDto } from "@frames/types";
import { palette } from "@frames/ui";
import { DateStamp } from "./DateStamp";
import { PolaroidFrame } from "./PolaroidFrame";
import { ReactionButton } from "./ReactionButton";
import { UserHeader } from "./UserHeader";
import { useAppStore } from "../store/appStore";

export function FrameCard({ post, tilt = "0deg" }: { post: PostDto; tilt?: string }) {
  const reactToPost = useAppStore((state) => state.reactToPost);
  const liked = useAppStore((state) => state.likedPostIds.includes(post.id));
  return (
    <View style={[styles.wrap, { transform: [{ rotate: tilt }] }]}>
      <UserHeader user={post.user} meta={`${new Date(post.createdAt).getHours()}:00 - ${post.locationName ?? "No location"}`} />
      <View style={styles.media}>
        <PolaroidFrame imageUrl={post.mediaUrl} caption={post.caption} />
      </View>
      <DateStamp value={new Date(post.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }).toUpperCase()} />
      <Text style={styles.privacy}>{post.privacy === "PUBLIC" ? "Public" : "Friends"}</Text>
      <ReactionButton
        reactions={post.reactionCount}
        comments={post.commentCount}
        liked={liked}
        onReact={() => reactToPost(post.id)}
        onComment={() => router.push(`/comments/${post.id}`)}
        onShare={() => router.push(`/share?resourceType=post&resourceId=${post.id}`)}
      />
      <Link href={`/post/${post.id}`} style={styles.detail}>Open Frame</Link>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { backgroundColor: palette.whitePaper, borderRadius: 8, borderWidth: 1, borderColor: "#E4D9CA", padding: 14 },
  media: { marginVertical: 14 },
  privacy: { color: palette.mutedBrown, fontWeight: "800", marginTop: 8 },
  detail: { color: palette.ink, fontWeight: "900", marginTop: 12 }
});
