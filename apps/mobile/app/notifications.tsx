import { Link, router } from "expo-router";
import { useEffect, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { UserNotification } from "../store/appStore";
import type { UserDto } from "@frames/types";
import { palette } from "@frames/ui";
import { AppIcon } from "../components/AppIcon";
import { answerFollowRequest, fetchMyFriendships, fetchRemoteNotifications, markRemoteNotificationsRead } from "../services/supabase";
import { useAppStore } from "../store/appStore";

export default function NotificationsScreen() {
  const notifications = useAppStore((state) => state.notifications);
  const markNotificationsRead = useAppStore((state) => state.markNotificationsRead);
  const mergeNotifications = useAppStore((state) => state.mergeNotifications);
  const currentUser = useAppStore((state) => state.currentUser);
  const [message, setMessage] = useState("");
  const [requests, setRequests] = useState<Array<{ id: string; status: "PENDING" | "ACCEPTED" | "BLOCKED"; receiverId: string; user?: UserDto }>>([]);

  const load = async () => {
    setMessage("");
    try {
      const [{ notifications: remoteNotifications }, friendshipResult] = await Promise.all([
        fetchRemoteNotifications(),
        fetchMyFriendships()
      ]);
      mergeNotifications(remoteNotifications);
      if (!currentUser) return;
      const mapped = friendshipResult.friendships.map((friendship) => {
        const otherId = friendship.requesterId === currentUser.id ? friendship.receiverId : friendship.requesterId;
        const otherUser = friendshipResult.users.get(otherId);
        return {
          id: friendship.id,
          status: friendship.status,
          receiverId: friendship.receiverId,
          user: otherUser
        };
      });
      setRequests(mapped);
    } catch {
      // Keep store notifications visible
    }
  };

  useEffect(() => {
    void load();
  }, [currentUser]);

  const answer = async (requestId: string, status: "ACCEPTED" | "BLOCKED") => {
    const { error } = await answerFollowRequest(requestId, status);
    if (error) {
      setMessage(error.message);
      return;
    }
    await load();
  };

  const markRead = async () => {
    markNotificationsRead();
    await markRemoteNotificationsRead();
    await load();
  };

  const postNotifications = notifications.filter((item) => !item.recipientId || item.recipientId === currentUser?.id);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.topBar}>
        <Pressable style={styles.iconButton} onPress={() => router.back()}>
          <AppIcon name="arrow-left" color={palette.ink} size={18} />
        </Pressable>
        <Text style={styles.title}>Notifications</Text>
        <Pressable style={styles.markRead} onPress={markRead}>
          <AppIcon name="check" color={palette.ink} size={16} />
          <Text style={styles.markReadText}>Mark read</Text>
        </Pressable>
      </View>

      {message ? <Text style={styles.errorText}>{message}</Text> : null}

      {/* Follow Requests Section */}
      {requests.some((request) => request.status === "PENDING" && request.receiverId === currentUser?.id) ? (
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionTitle}>Follow Requests</Text>
          {requests.filter((request) => request.status === "PENDING" && request.receiverId === currentUser?.id).map((request) => (
            <View key={request.id} style={[styles.card, styles.requestCard]}>
              <Link href={request.user?.id ? `/user/${request.user.id}` : "#"} asChild>
                <Pressable style={styles.userClickable}>
                  <Image source={{ uri: request.user?.avatarUrl ?? undefined }} style={styles.avatar} />
                  <View style={styles.requestMeta}>
                    <Text style={styles.userName}>{request.user?.displayName ?? "Someone"}</Text>
                    <Text style={styles.userSub}>wants to follow your Frames</Text>
                  </View>
                </Pressable>
              </Link>
              <View style={styles.requestBtns}>
                <Pressable style={styles.confirmBtn} onPress={() => { void answer(request.id, "ACCEPTED"); }}>
                  <Text style={styles.confirmBtnText}>Confirm</Text>
                </Pressable>
                <Pressable style={styles.deleteBtn} onPress={() => { void answer(request.id, "BLOCKED"); }}>
                  <Text style={styles.deleteBtnText}>Delete</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      ) : null}

      {/* Your Connections Section */}
      {requests.some((request) => request.receiverId !== currentUser?.id) ? (
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionTitle}>Your Connections</Text>
          {requests.filter((request) => request.receiverId !== currentUser?.id).map((request) => (
            <Link key={request.id} href={request.user?.id ? `/user/${request.user.id}` : "#"} asChild>
              <Pressable style={styles.card}>
                <View style={styles.itemHeader}>
                  <AppIcon name={request.status === "ACCEPTED" ? "check" : "clock"} color={palette.ink} size={18} />
                  <Text style={styles.userName}>{request.user?.displayName ?? "Profile"}</Text>
                </View>
                <Text style={styles.bodyText}>
                  {request.status === "ACCEPTED" ? "You are friends now." : "Follow request pending."}
                </Text>
              </Pressable>
            </Link>
          ))}
        </View>
      ) : null}

      {/* Activity Section */}
      <View style={styles.sectionWrap}>
        <Text style={styles.sectionTitle}>Activity</Text>
        {postNotifications.map((notification) => (
          <PostNotificationCard key={notification.id} notification={notification} />
        ))}
        {postNotifications.length === 0 && requests.length === 0 && !message ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>All caught up</Text>
            <Text style={styles.emptyCopy}>Reactions, comments, and connection updates will appear here.</Text>
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}

function PostNotificationCard({ notification }: { notification: UserNotification }) {
  const icon = notification.type === "REACTION" ? "heart" : notification.type === "COMMENT" ? "comment" : notification.type === "SHARE" ? "send" : "bell";
  const targetUrl = notification.postId ? (notification.type === "COMMENT" ? `/comments/${notification.postId}` : `/post/${notification.postId}`) : "/(tabs)/home";

  return (
    <Link href={targetUrl as any} asChild>
      <Pressable style={[styles.card, !notification.read && styles.unreadCard]}>
        <View style={styles.itemHeader}>
          <AppIcon name={icon} color={palette.ink} size={18} />
          <Text style={styles.userName}>{notification.title}</Text>
        </View>
        <Text style={styles.bodyText}>{notification.body}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.timestamp}>{new Date(notification.createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</Text>
          {notification.postId ? <Text style={styles.viewLink}>View Frame ›</Text> : null}
        </View>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.paperCream },
  content: { padding: 16, paddingTop: 52, paddingBottom: 60, gap: 16 },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  iconButton: { width: 36, height: 36, borderRadius: 18, borderWidth: 1.5, borderColor: palette.ink, backgroundColor: palette.whitePaper, alignItems: "center", justifyContent: "center", shadowColor: palette.ink, shadowOffset: { width: 2, height: 2 }, shadowOpacity: 0.8, shadowRadius: 0 },
  title: { fontSize: 24, fontWeight: "900", color: palette.ink, letterSpacing: -0.5 },
  markRead: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: palette.acidYellow, borderWidth: 1.5, borderColor: palette.ink, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, shadowColor: palette.ink, shadowOffset: { width: 2, height: 2 }, shadowOpacity: 0.8, shadowRadius: 0 },
  markReadText: { fontSize: 11, fontWeight: "900", color: palette.ink },
  errorText: { color: "#B8324A", fontSize: 12, fontWeight: "700", textAlign: "center" },
  sectionWrap: { gap: 8 },
  sectionTitle: { fontSize: 14, fontWeight: "900", color: palette.ink, textTransform: "uppercase", letterSpacing: 0.8, marginTop: 4 },
  card: { backgroundColor: palette.whitePaper, borderWidth: 1.5, borderColor: palette.ink, borderRadius: 8, padding: 14, gap: 6, shadowColor: palette.ink, shadowOffset: { width: 3, height: 3 }, shadowOpacity: 0.85, shadowRadius: 0, elevation: 3 },
  unreadCard: { backgroundColor: palette.softLavender },
  requestCard: { gap: 10 },
  userClickable: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, borderWidth: 1.5, borderColor: palette.ink, backgroundColor: palette.softPeach },
  requestMeta: { flex: 1 },
  userName: { fontSize: 14, fontWeight: "900", color: palette.ink },
  userSub: { fontSize: 12, color: palette.mutedBrown, fontWeight: "700", marginTop: 1 },
  requestBtns: { flexDirection: "row", gap: 8 },
  confirmBtn: { flex: 1, backgroundColor: palette.acidYellow, borderWidth: 1.5, borderColor: palette.ink, paddingVertical: 8, borderRadius: 6, alignItems: "center", shadowColor: palette.ink, shadowOffset: { width: 2, height: 2 }, shadowOpacity: 0.8, shadowRadius: 0 },
  confirmBtnText: { fontSize: 12, fontWeight: "900", color: palette.ink },
  deleteBtn: { flex: 1, backgroundColor: palette.whitePaper, borderWidth: 1.5, borderColor: palette.ink, paddingVertical: 8, borderRadius: 6, alignItems: "center" },
  deleteBtnText: { fontSize: 12, fontWeight: "900", color: palette.mutedBrown },
  itemHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  bodyText: { fontSize: 13, color: palette.ink, lineHeight: 18, fontWeight: "600" },
  metaRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 },
  timestamp: { fontSize: 10, color: palette.mutedBrown, fontWeight: "700" },
  viewLink: { fontSize: 11, fontWeight: "900", color: palette.ink },
  emptyCard: { padding: 32, alignItems: "center", gap: 6, borderWidth: 1.5, borderStyle: "dashed", borderColor: palette.ink, borderRadius: 8, backgroundColor: "rgba(255,255,255,0.6)" },
  emptyTitle: { fontSize: 16, fontWeight: "900", color: palette.ink },
  emptyCopy: { fontSize: 13, color: palette.mutedBrown, textAlign: "center" }
});
