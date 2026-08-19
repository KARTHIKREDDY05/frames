import { Link, router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Alert, FlatList, Image, Modal, Platform, Pressable, Share, StyleSheet, Text, View } from "react-native";
import type { PostDto, UserDto } from "@frames/types";
import { palette } from "@frames/ui";
import { DateStamp } from "./DateStamp";
import { PolaroidFrame } from "./PolaroidFrame";
import { ReactionButton } from "./ReactionButton";
import { UserHeader } from "./UserHeader";
import { WashiTape } from "./WashiTape";
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

  const lastTap = useRef<number>(0);
  const [showHeartPop, setShowHeartPop] = useState(false);
  const [optionsVisible, setOptionsVisible] = useState(false);
  const [forwardVisible, setForwardVisible] = useState(false);
  const [friendsList, setFriendsList] = useState<UserDto[]>(storeFriends);
  const [sentMap, setSentMap] = useState<Record<string, boolean>>({});

  const handleDoubleTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      if (!liked) {
        reactToPost(post.id);
        void toggleRemoteReaction(post, false);
      }
      setShowHeartPop(true);
      setTimeout(() => setShowHeartPop(false), 700);
    }
    lastTap.current = now;
  };

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

  const forwardToFriend = (friendId: string, _friendName: string) => {
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
      {/* Top Washi Tape Pill */}
      <WashiTape
        label={post.profileFeatured ? "★ PINNED" : lifeLabel}
        color={post.profileFeatured ? "yellow" : "lavender"}
        tilt="-1.5deg"
      />

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

      <Pressable style={styles.media} onPress={handleDoubleTap}>
        <PolaroidFrame imageUrl={post.mediaUrl} caption={post.caption} frameStyle={post.frameStyle} filterPreset={post.filterPreset} />
        {showHeartPop ? (
          <View style={styles.heartPop}>
            <AppIcon name="heart" color="#E63946" size={56} />
          </View>
        ) : null}
      </Pressable>

      <View style={styles.metaFooter}>
        <DateStamp value={new Date(post.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }).toUpperCase()} />
        <View style={[styles.privacyChip, post.privacy === "PUBLIC" ? styles.privacyPublic : styles.privacyFriends]}>
          <Text style={styles.privacyText}>{post.privacy === "PUBLIC" ? "🌍 PUBLIC" : "🔒 FRIENDS"}</Text>
        </View>
      </View>

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
  if (Number.isNaN(expires)) return featured ? "PINNED" : "24H FEED";
  const diff = expires - Date.now();
  if (diff <= 0) return featured ? "PINNED" : "ARCHIVED";
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.max(1, Math.floor((diff % 3600000) / 60000));
  if (hours > 0) return `${hours}H LEFT`;
  return `${minutes}M LEFT`;
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: palette.whitePaper,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: palette.ink,
    padding: 16,
    paddingTop: 18,
    marginVertical: 6,
    position: "relative",
    shadowColor: palette.ink,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.9,
    shadowRadius: 0,
    elevation: 4
  },
  headerRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginTop: 4 },
  headerRight: { flexDirection: "row", gap: 4 },
  iconBtn: { width: 34, height: 34, borderRadius: 17, borderWidth: 1.5, borderColor: palette.ink, backgroundColor: palette.softLavender, alignItems: "center", justifyContent: "center" },
  media: { marginVertical: 12, position: "relative" },
  heartPop: { position: "absolute", top: "40%", left: "40%", transform: [{ translateX: -10 }, { translateY: -10 }], shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 10 },
  metaFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8 },
  privacyChip: { paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1.5, borderColor: palette.ink, borderRadius: 4 },
  privacyPublic: { backgroundColor: palette.acidYellow },
  privacyFriends: { backgroundColor: palette.softLavender },
  privacyText: { fontSize: 10, fontWeight: "900", color: palette.ink, letterSpacing: 0.5 },
  detail: { color: palette.ink, fontWeight: "900", marginTop: 12, fontSize: 13 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  actionSheet: { backgroundColor: palette.whitePaper, borderTopLeftRadius: 20, borderTopRightRadius: 20, borderWidth: 2, borderColor: palette.ink, borderBottomWidth: 0, padding: 20, paddingBottom: 36, gap: 10 },
  sheetHandle: { width: 44, height: 5, borderRadius: 3, backgroundColor: palette.ink, alignSelf: "center", marginBottom: 8 },
  sheetTitle: { fontSize: 18, fontWeight: "900", color: palette.ink, marginBottom: 6, letterSpacing: -0.3 },
  sheetItem: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 8, borderWidth: 1.5, borderColor: palette.ink, backgroundColor: palette.paperCream, shadowColor: palette.ink, shadowOffset: { width: 2, height: 2 }, shadowOpacity: 0.8, shadowRadius: 0, elevation: 2 },
  sheetItemDelete: { backgroundColor: "#FDF0F0", borderColor: "#B8324A" },
  sheetItemText: { fontSize: 14, fontWeight: "900", color: palette.ink },
  sheetItemSub: { fontSize: 11, color: palette.mutedBrown, fontWeight: "700", marginTop: 2 },
  deleteText: { color: "#B8324A" },
  deleteSub: { color: "#C05621" },
  sheetCancel: { alignItems: "center", paddingVertical: 12, borderRadius: 8, borderWidth: 1.5, borderColor: palette.ink, marginTop: 6, backgroundColor: palette.softLavender },
  sheetCancelText: { fontSize: 14, fontWeight: "900", color: palette.ink },
  noFriends: { padding: 18, alignItems: "center", gap: 6 },
  noFriendsText: { fontSize: 16, fontWeight: "900", color: palette.ink },
  noFriendsCopy: { fontSize: 13, color: palette.mutedBrown, textAlign: "center" },
  friendRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 8, paddingHorizontal: 6, borderBottomWidth: 1, borderColor: "#E4D9CA" },
  friendAvatar: { width: 40, height: 40, borderRadius: 20, borderWidth: 1.5, borderColor: palette.ink, backgroundColor: palette.softLavender },
  friendMeta: { flex: 1 },
  friendName: { fontSize: 14, fontWeight: "900", color: palette.ink },
  friendHandle: { fontSize: 12, color: palette.mutedBrown, fontWeight: "700" },
  forwardBtn: { backgroundColor: palette.acidYellow, borderWidth: 1.5, borderColor: palette.ink, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 6, shadowColor: palette.ink, shadowOffset: { width: 2, height: 2 }, shadowOpacity: 0.8, shadowRadius: 0 },
  forwardBtnSent: { backgroundColor: palette.softLavender },
  forwardBtnText: { color: palette.ink, fontSize: 12, fontWeight: "900" },
  forwardBtnTextSent: { color: palette.mutedBrown },
  shareDivider: { height: 1, backgroundColor: palette.ink, marginVertical: 6 }
});
