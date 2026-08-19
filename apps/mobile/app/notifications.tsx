import { useCallback, useEffect, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { palette } from "@frames/ui";
import type { UserDto } from "@frames/types";
import { AppIcon } from "../components/AppIcon";
import { answerFollowRequest, fetchMyFriendships, fetchRemoteNotifications, markRemoteNotificationsRead } from "../services/supabase";
import { useAppStore, type UserNotification } from "../store/appStore";

interface RequestRow {
  id: string;
  requesterId: string;
  receiverId: string;
  status: "PENDING" | "ACCEPTED" | "BLOCKED";
  user: UserDto | null;
}

export default function Notifications() {
  const currentUser = useAppStore((state) => state.currentUser);
  const postNotifications = useAppStore((state) => state.notifications.filter((notification) => !notification.recipientId || notification.recipientId === currentUser?.id));
  const markNotificationsRead = useAppStore((state) => state.markNotificationsRead);
  const mergeNotifications = useAppStore((state) => state.mergeNotifications);
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [message, setMessage] = useState("Loading notifications...");

  const load = useCallback(async () => {
    if (!currentUser) {
      setRequests([]);
      setMessage("Sign in to see follow requests.");
      return;
    }
    const [result, notificationResult] = await Promise.all([fetchMyFriendships(), fetchRemoteNotifications()]);
    if (result.error) {
      setMessage(result.error.message);
      return;
    }
    mergeNotifications(notificationResult.notifications);
    const rows = result.friendships.map((item) => {
      const otherId = item.requesterId === currentUser.id ? item.receiverId : item.requesterId;
      return { ...item, user: result.users.get(otherId) ?? null };
    });
    setRequests(rows);
    setMessage("");
  }, [currentUser, mergeNotifications]);

  useEffect(() => {
    void load();
  }, [load]);

  const answer = async (requestId: string, status: "ACCEPTED" | "BLOCKED") => {
    const { error } = await answerFollowRequest(requestId, status);
    if (error) {
      setMessage(error.message);
      return;
    }
    await load();
  };

  const markRead = () => {
    markNotificationsRead();
    void markRemoteNotificationsRead();
    void load();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Notifications</Text>
      <View style={styles.toolbar}>
        <Pressable style={styles.markRead} onPress={markRead}><AppIcon name="check" color={palette.ink} size={18} /><Text style={styles.markReadText}>Mark read</Text></Pressable>
        <Pressable style={styles.markRead} onPress={() => { void load(); }}><Text style={styles.markReadText}>Refresh</Text></Pressable>
      </View>
      {message ? <Text style={styles.empty}>{message}</Text> : null}
      {requests.some((request) => request.status === "PENDING" && request.receiverId === currentUser?.id) ? <Text style={styles.section}>Follow requests</Text> : null}
      {requests.filter((request) => request.status === "PENDING" && request.receiverId === currentUser?.id).map((request) => {
        return (
          <View key={request.id} style={[styles.item, styles.requestItem, styles.unread]}>
            <Image source={{ uri: request.user?.avatarUrl ?? undefined }} style={styles.avatar} />
            <View style={styles.requestMeta}>
              <Text style={styles.itemTitle}>{request.user?.displayName ?? "Someone"}</Text>
              <Text style={styles.body}>wants to follow you and see friends-only Frames.</Text>
            </View>
            <View style={styles.requestActions}>
              <Pressable style={styles.accept} onPress={() => { void answer(request.id, "ACCEPTED"); }}><Text style={styles.acceptText}>Confirm</Text></Pressable>
              <Pressable style={styles.decline} onPress={() => { void answer(request.id, "BLOCKED"); }}><Text style={styles.declineText}>Delete</Text></Pressable>
            </View>
          </View>
        );
      })}
      {requests.some((request) => request.receiverId !== currentUser?.id) ? <Text style={styles.section}>Your requests</Text> : null}
      {requests.filter((request) => request.receiverId !== currentUser?.id).map((request) => (
        <View key={request.id} style={styles.item}>
          <View style={styles.itemHeader}>
            <AppIcon name={request.status === "ACCEPTED" ? "check" : "clock"} color={palette.ink} size={18} />
            <Text style={styles.itemTitle}>{request.user?.displayName ?? "Profile"}</Text>
          </View>
          <Text style={styles.body}>{request.status === "ACCEPTED" ? "You are friends now. Chats and friends-only Frames are unlocked." : "Follow request sent."}</Text>
          <Text style={styles.status}>{request.status === "BLOCKED" ? "declined" : request.status.toLowerCase()}</Text>
        </View>
      ))}
      {postNotifications.length > 0 ? <Text style={styles.section}>Activity</Text> : null}
      {postNotifications.map((notification) => <PostNotificationCard key={notification.id} notification={notification} />)}
      {postNotifications.length === 0 && requests.length === 0 && !message ? <Text style={styles.empty}>No activity yet.</Text> : null}
    </ScrollView>
  );
}

function PostNotificationCard({ notification }: { notification: UserNotification }) {
  const icon = notification.type === "REACTION" ? "heart" : notification.type === "COMMENT" ? "comment" : notification.type === "SHARE" ? "send" : "bell";
  return (
    <View style={[styles.item, !notification.read && styles.unread]}>
      <View style={styles.itemHeader}>
        <AppIcon name={icon} color={palette.ink} size={18} />
        <Text style={styles.itemTitle}>{notification.title}</Text>
      </View>
      <Text style={styles.body}>{notification.body}</Text>
      <Text style={styles.status}>{new Date(notification.createdAt).toLocaleString()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.paperCream },
  content: { padding: 22, paddingTop: 58, paddingBottom: 110, gap: 12 },
  title: { fontSize: 32, fontWeight: "900", color: palette.ink },
  toolbar: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  section: { color: palette.ink, fontSize: 16, fontWeight: "900", marginTop: 8 },
  markRead: { alignSelf: "flex-start", minHeight: 42, borderRadius: 21, backgroundColor: palette.whitePaper, borderWidth: 1, borderColor: "#E4D9CA", paddingHorizontal: 14, flexDirection: "row", alignItems: "center", gap: 8 },
  markReadText: { color: palette.ink, fontWeight: "900" },
  empty: { color: palette.mutedBrown, backgroundColor: palette.whitePaper, padding: 16, borderRadius: 8, lineHeight: 22 },
  item: { backgroundColor: palette.whitePaper, padding: 16, borderRadius: 8, borderWidth: 1, borderColor: "#E4D9CA", gap: 8 },
  requestItem: { flexDirection: "row", alignItems: "center" },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: "#E4D9CA" },
  requestMeta: { flex: 1 },
  requestActions: { gap: 7, alignItems: "stretch" },
  unread: { borderColor: palette.sunshine },
  itemHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  itemTitle: { color: palette.ink, fontWeight: "900", fontSize: 16 },
  body: { color: palette.mutedBrown, lineHeight: 21 },
  actions: { flexDirection: "row", gap: 10 },
  accept: { minHeight: 34, borderRadius: 8, backgroundColor: "#2D8CFF", alignItems: "center", justifyContent: "center", paddingHorizontal: 14, flexDirection: "row", gap: 6 },
  acceptText: { color: palette.whitePaper, fontWeight: "900" },
  decline: { minHeight: 34, borderRadius: 8, backgroundColor: palette.whitePaper, borderWidth: 1, borderColor: "#E4D9CA", alignItems: "center", justifyContent: "center", paddingHorizontal: 14, flexDirection: "row", gap: 6 },
  declineText: { color: palette.ink, fontWeight: "900" },
  status: { color: palette.mutedBrown, fontWeight: "900", textTransform: "capitalize" }
});
