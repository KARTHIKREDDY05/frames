import { Link, router } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, FlatList, Image, Modal, Platform, Pressable, Share, StyleSheet, Text, View } from "react-native";
import type { PostDto, UserDto } from "@frames/types";
import { palette } from "@frames/ui";
import { DateStamp } from "./DateStamp";
import { PolaroidFrame } from "./PolaroidFrame";
import { ReactionButton } from "./ReactionButton";
import { UserHeader } from "./UserHeader";
import { deleteRemotePost, fetchFollowingList, fetchFriendsList, sendRemoteChatMessage, setRemotePostProfileFeatured, toggleRemoteReaction, updateRemotePostPrivacy } from "../services/supabase";
import { useAppStore } from "../store/appStore";
import { AppIcon } from "./AppIcon";

export function FrameCard({ post, tilt = "0deg" }: { post: PostDto; tilt?: string }) {
  const reactToPost = useAppStore((state) => state.reactToPost);
  const deletePost = useAppStore((state) => state.deletePost);
  const mergePosts = useAppStore((state) => state.mergePosts);
  const sendChatMessage = useAppStore((state) => state.sendChatMessage);
  const currentUser = useAppStore((state) => state.currentUser);
  const storeFriends = useAppStore((state) => state.friends);
  const setStoreFriends = useAppStore((state) => state.setFriends);
  const liked = useAppStore((state) => state.likedPostIds.includes(post.id));
  const ownsPost = currentUser?.id === post.user.id || (!currentUser && post.user.id === "user-guest");
  const capturedLabel = formatCapturedAt(post.createdAt);
  const lifeLabel = formatFrameLife(post.expiresAt, post.profileFeatured);

  const [optionsVisible, setOptionsVisible] = useState(false);
  const [forwardVisible, setForwardVisible] = useState(false);
  const [friendsList, setFriendsList] = useState<UserDto[]>(storeFriends);
  const [sentMap, setSentMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (forwardVisible && currentUser) {
      void fetchFriendsList(currentUser.id).then(({ users }) => {
        if (users && users.length > 0) {
          setFriendsList(users);
          setStoreFriends(users);
        } else {
          void fetchFollowingList(currentUser.id).then(({ users: following }) => {
            if (following && following.length > 0) {
              setFriendsList(following);
              setStoreFriends(following);
            }
          });
        }
      });
    }
  }, [currentUser, forwardVisible, setStoreFriends]);

  const react = () => {
    reactToPost(post.id);
    void toggleRemoteReaction(post, liked);
  };

  const toggleFeatured = async () => {
    const next = !post.profileFeatured;
    mergePosts([{ ...post, profileFeatured: next }]);
    setOptionsVisible(false);
    const { post: updated, error } = await setRemotePostProfileFeatured(post.id, next);
    if (updated) mergePosts([updated]);
    if (error) {
      Alert.alert("Update failed", error.message);
    } else {
      Alert.alert(next ? "Pinned! ★" : "Unpinned", next ? "This Frame is pinned permanently to your profile grid." : "This Frame will now archive once its 24h feed time expires.");
    }
  };

  const togglePrivacy = async () => {
    const nextPrivacy = post.privacy === "PUBLIC" ? "FRIENDS" : "PUBLIC";
    mergePosts([{ ...post, privacy: nextPrivacy }]);
    setOptionsVisible(false);
    const { post: updated, error } = await updateRemotePostPrivacy(post.id, nextPrivacy);
    if (updated) mergePosts([updated]);
    if (error) {
      Alert.alert("Update failed", error.message);
    } else {
      Alert.alert("Privacy Updated", nextPrivacy === "PUBLIC" ? "Frame is now Public 🌍" : "Frame is now Friends Only 🔒");
    }
  };

  const confirmDelete = () => {
    setOptionsVisible(false);
    const remove = () => {
      deletePost(post.id);
      void deleteRemotePost(post.id);
    };

    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && window.confirm("Delete this Frame? This cannot be undone.")) remove();
      return;
    }

    Alert.alert("Delete Frame?", "This Frame will be permanently removed from your feed, profile, and archive.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: remove }
    ]);
  };

  const forwardToFriend = (friendId: string, friendName: string) => {
    const shareText = `Check out this Frame: https://frames-test-build.vercel.app/post/${post.id}`;
    void sendRemoteChatMessage(friendId, shareText);
    sendChatMessage(friendId, shareText);
    setSentMap((prev) => ({ ...prev, [friendId]: true }));
  };

  const shareExternal = async () => {
    setForwardVisible(false);
    const url = `https://frames-test-build.vercel.app/post/${post.id}`;
    try {
      await Share.share({
        title: "Check out this Frame!",
        message: `Check out this Frame on Frames: ${url}`,
        url
      });
    } catch {
      // Ignored
    }
  };

  return (
    <Pressable onLongPress={() => ownsPost && setOptionsVisible(true)} style={[styles.wrap, { transform: [{ rotate: tilt }] }]}>
      <View style={styles.headerRow}>
        <UserHeader user={post.user} meta={`${capturedLabel} • ${post.locationName ?? "No location"}`} />
        <View style={styles.headerRight}>
          {ownsPost ? (
            <Pressable accessibilityLabel="Frame options" style={styles.iconBtn} onPress={() => setOptionsVisible(true)}>
              <AppIcon name="settings" color={palette.ink} size={18} />
            </Pressable>
          ) : null}
        </View>
      </View>

      <View style={styles.timeRow}>
        <Text style={styles.timePill}>{lifeLabel}</Text>
        {post.profileFeatured ? <Text style={styles.timePillPinned}>★ Pinned on Profile</Text> : null}
      </View>

      <View style={styles.media}>
        <PolaroidFrame imageUrl={post.mediaUrl} caption={post.caption} frameStyle={post.frameStyle} filterPreset={post.filterPreset} />
      </View>

      <DateStamp value={new Date(post.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }).toUpperCase()} />
      <Text style={styles.privacy}>{post.privacy === "PUBLIC" ? "🌍 Public" : "🔒 Friends Only"}</Text>

      <ReactionButton
        reactions={post.reactionCount}
        comments={post.commentCount}
        liked={liked}
        onReact={react}
        onComment={() => router.push(`/comments/${post.id}`)}
        onShare={() => setForwardVisible(true)}
      />

      <Link href={`/post/${post.id}`} style={styles.detail}>Open Frame ›</Link>

      {/* Frame Options Modal (Long Press / ...) */}
      <Modal visible={optionsVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setOptionsVisible(false)} />
          <View style={styles.actionSheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Frame Settings</Text>

            <Pressable style={styles.sheetItem} onPress={() => { void toggleFeatured(); }}>
              <AppIcon name="spark" color={palette.ink} size={20} />
              <View style={{ flex: 1 }}>
                <Text style={styles.sheetItemText}>
                  {post.profileFeatured ? "Unpin from Profile Grid" : "★ Pin to Profile Grid"}
                </Text>
                <Text style={styles.sheetItemSub}>
                  {post.profileFeatured ? "Reverts to regular 24h lifespan" : "Keeps Frame on your profile permanently"}
                </Text>
              </View>
            </Pressable>

            <Pressable style={styles.sheetItem} onPress={() => { void togglePrivacy(); }}>
              <AppIcon name="lock" color={palette.ink} size={20} />
              <View style={{ flex: 1 }}>
                <Text style={styles.sheetItemText}>
                  {post.privacy === "PUBLIC" ? "Change to Friends Only 🔒" : "Change to Public 🌍"}
                </Text>
                <Text style={styles.sheetItemSub}>
                  Currently: {post.privacy === "PUBLIC" ? "Visible to everyone" : "Only your accepted friends"}
                </Text>
              </View>
            </Pressable>

            <Pressable style={styles.sheetItem} onPress={() => { setOptionsVisible(false); setForwardVisible(true); }}>
              <AppIcon name="send" color={palette.ink} size={20} />
              <View style={{ flex: 1 }}>
                <Text style={styles.sheetItemText}>Forward to Friends</Text>
                <Text style={styles.sheetItemSub}>Send this Frame in a direct chat</Text>
              </View>
            </Pressable>

            <Pressable style={[styles.sheetItem, styles.sheetItemDelete]} onPress={confirmDelete}>
              <AppIcon name="delete" color="#B8324A" size={20} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.sheetItemText, styles.deleteText]}>Delete Frame</Text>
                <Text style={[styles.sheetItemSub, styles.deleteSub]}>Permanently delete this Frame</Text>
              </View>
            </Pressable>

            <Pressable style={styles.sheetCancel} onPress={() => setOptionsVisible(false)}>
              <Text style={styles.sheetCancelText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Forward / Share Sheet */}
      <Modal visible={forwardVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setForwardVisible(false)} />
          <View style={styles.actionSheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Forward to Friends</Text>

            {friendsList.length === 0 ? (
              <View style={styles.noFriends}>
                <Text style={styles.noFriendsText}>No connections yet.</Text>
                <Text style={styles.noFriendsCopy}>Follow people in the Search tab to forward Frames directly into chats.</Text>
              </View>
            ) : (
              <FlatList
                data={friendsList}
                keyExtractor={(item) => item.id}
                style={{ maxHeight: 240, marginVertical: 8 }}
                renderItem={({ item }) => {
                  const isSent = Boolean(sentMap[item.id]);
                  return (
                    <View style={styles.friendRow}>
                      <Image source={{ uri: item.avatarUrl ?? undefined }} style={styles.friendAvatar} />
                      <View style={styles.friendMeta}>
                        <Text style={styles.friendName}>{item.displayName}</Text>
                        <Text style={styles.friendHandle}>@{item.username}</Text>
                      </View>
                      <Pressable
                        style={[styles.forwardBtn, isSent && styles.forwardBtnSent]}
                        disabled={isSent}
                        onPress={() => forwardToFriend(item.id, item.displayName)}
                      >
                        <Text style={[styles.forwardBtnText, isSent && styles.forwardBtnTextSent]}>
                          {isSent ? "✓ Sent" : "Send"}
                        </Text>
                      </Pressable>
                    </View>
                  );
                }}
              />
            )}

            <View style={styles.shareDivider} />

            <Pressable style={styles.sheetItem} onPress={shareExternal}>
              <AppIcon name="send" color={palette.ink} size={20} />
              <Text style={styles.sheetItemText}>Share via other apps...</Text>
            </Pressable>

            <Pressable style={styles.sheetCancel} onPress={() => setForwardVisible(false)}>
              <Text style={styles.sheetCancelText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </Pressable>
  );
}

function formatCapturedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Taken today";
  return `Taken at ${date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
}

function formatFrameLife(expiresAt: string, featured?: boolean) {
  const expires = new Date(expiresAt).getTime();
  if (Number.isNaN(expires)) return featured ? "Profile Frame" : "24h Feed";
  const diff = expires - Date.now();
  if (diff <= 0) return featured ? "Archived • Pinned" : "Archived to timeline";
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.max(1, Math.floor((diff % 3600000) / 60000));
  if (hours > 0) return `${hours}h ${minutes}m in feed`;
  return `${minutes}m in feed`;
}

const styles = StyleSheet.create({
  wrap: { backgroundColor: palette.whitePaper, borderRadius: 8, borderWidth: 1, borderColor: "#E4D9CA", padding: 14 },
  headerRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 },
  headerRight: { flexDirection: "row", gap: 4 },
  iconBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: palette.paperCream, alignItems: "center", justifyContent: "center" },
  timeRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 10 },
  timePill: { color: palette.ink, backgroundColor: "#F8E7B2", borderRadius: 12, overflow: "hidden", paddingHorizontal: 9, paddingVertical: 4, fontSize: 11, fontWeight: "900" },
  timePillPinned: { color: palette.whitePaper, backgroundColor: palette.ink, borderRadius: 12, overflow: "hidden", paddingHorizontal: 9, paddingVertical: 4, fontSize: 11, fontWeight: "900" },
  media: { marginVertical: 14 },
  privacy: { color: palette.mutedBrown, fontWeight: "800", marginTop: 8 },
  detail: { color: palette.ink, fontWeight: "900", marginTop: 12 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  actionSheet: { backgroundColor: palette.whitePaper, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 36, gap: 10 },
  sheetHandle: { width: 44, height: 5, borderRadius: 3, backgroundColor: "#D4C8B8", alignSelf: "center", marginBottom: 8 },
  sheetTitle: { fontSize: 18, fontWeight: "900", color: palette.ink, marginBottom: 6 },
  sheetItem: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12, backgroundColor: palette.paperCream },
  sheetItemDelete: { backgroundColor: "#FDF0F0" },
  sheetItemText: { fontSize: 15, fontWeight: "900", color: palette.ink },
  sheetItemSub: { fontSize: 12, color: palette.mutedBrown, fontWeight: "700", marginTop: 2 },
  deleteText: { color: "#B8324A" },
  deleteSub: { color: "#C05621" },
  sheetCancel: { alignItems: "center", paddingVertical: 14, borderRadius: 12, marginTop: 6, backgroundColor: palette.paperCream },
  sheetCancelText: { fontSize: 15, fontWeight: "900", color: palette.mutedBrown },
  noFriends: { padding: 18, alignItems: "center", gap: 6 },
  noFriendsText: { fontSize: 16, fontWeight: "900", color: palette.ink },
  noFriendsCopy: { fontSize: 13, color: palette.mutedBrown, textAlign: "center" },
  friendRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 8, paddingHorizontal: 6, borderBottomWidth: 1, borderColor: "#E4D9CA" },
  friendAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#E4D9CA" },
  friendMeta: { flex: 1 },
  friendName: { fontSize: 14, fontWeight: "900", color: palette.ink },
  friendHandle: { fontSize: 12, color: palette.mutedBrown, fontWeight: "700" },
  forwardBtn: { backgroundColor: palette.ink, paddingHorizontal: 16, paddingVertical: 7, borderRadius: 16 },
  forwardBtnSent: { backgroundColor: "#E4D9CA" },
  forwardBtnText: { color: palette.whitePaper, fontSize: 13, fontWeight: "900" },
  forwardBtnTextSent: { color: palette.ink },
  shareDivider: { height: 1, backgroundColor: "#E4D9CA", marginVertical: 6 }
});
