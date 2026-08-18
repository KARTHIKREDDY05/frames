import { Link } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { FlatList, Image, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import type { UserDto } from "@frames/types";
import { palette } from "@frames/ui";
import { AppIcon } from "../../components/AppIcon";
import { FrameButton } from "../../components/FrameButton";
import { PaperBackground } from "../../components/PaperBackground";
import { fetchMyChatMessages, fetchMyFriendships } from "../../services/supabase";
import { useAppStore } from "../../store/appStore";

export default function ChatsScreen() {
  const currentUser = useAppStore((state) => state.currentUser);
  const friends = useAppStore((state) => state.friends);
  const discoverableUsers = useAppStore((state) => state.discoverableUsers);
  const messages = useAppStore((state) => state.chatMessages);
  const mergeChatMessages = useAppStore((state) => state.mergeChatMessages);
  const [remoteFriends, setRemoteFriends] = useState<UserDto[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let mounted = true;
    const loadRemoteFriends = async () => {
      if (!currentUser) return;
      const [result, chatResult] = await Promise.all([fetchMyFriendships(), fetchMyChatMessages()]);
      if (!mounted || result.error) return;
      mergeChatMessages(chatResult.messages);
      const accepted = result.friendships
        .filter((friendship) => friendship.status === "ACCEPTED")
        .map((friendship) => {
          const otherId = friendship.requesterId === currentUser.id ? friendship.receiverId : friendship.requesterId;
          return result.users.get(otherId);
        })
        .filter((user): user is UserDto => Boolean(user));
      setRemoteFriends(accepted);
    };
    void loadRemoteFriends();
    return () => {
      mounted = false;
    };
  }, [currentUser, mergeChatMessages]);

  const rows = useMemo(() => {
    const byId = new Map<string, UserDto>();
    [...friends, ...remoteFriends, ...discoverableUsers].forEach((user) => byId.set(user.id, user));
    messages.forEach((message) => {
      if (!byId.has(message.threadUserId)) {
        byId.set(message.threadUserId, {
          id: message.threadUserId,
          displayName: "Frames user",
          username: "frames_friend",
          avatarUrl: null,
          bio: null,
          defaultPrivacy: "FRIENDS",
          profileVisibility: "PRIVATE",
          lastSeenAt: null
        });
      }
    });
    return Array.from(byId.values())
      .map((user) => {
        const threadMessages = messages
          .filter((message) => message.threadUserId === user.id)
          .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        const last = threadMessages[threadMessages.length - 1] ?? null;
        return { user, last, unread: threadMessages.some((message) => message.fromUserId !== currentUser?.id && message.status !== "SEEN") };
      })
      .filter((row) => row.last || friends.some((friend) => friend.id === row.user.id) || remoteFriends.some((friend) => friend.id === row.user.id))
      .filter((row) => {
        const needle = query.trim().toLowerCase();
        if (!needle) return true;
        return row.user.displayName.toLowerCase().includes(needle) || row.user.username.toLowerCase().includes(needle);
      })
      .sort((a, b) => new Date(b.last?.createdAt ?? 0).getTime() - new Date(a.last?.createdAt ?? 0).getTime());
  }, [currentUser?.id, discoverableUsers, friends, messages, query, remoteFriends]);

  return (
    <PaperBackground>
      <FlatList
        contentContainerStyle={styles.content}
        data={rows}
        keyExtractor={(item) => item.user.id}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <View>
                <Text style={styles.kicker}>FRIENDS</Text>
                <Text style={styles.title}>Chats</Text>
              </View>
              <Link href="/(tabs)/search" asChild>
                <Pressable style={styles.compose}><AppIcon name="user-plus" color={palette.ink} size={20} /></Pressable>
              </Link>
            </View>
            <View style={styles.search}>
              <AppIcon name="search" color={palette.mutedBrown} size={18} />
              <TextInput placeholder="Search chats" style={styles.input} value={query} onChangeText={setQuery} />
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No chats yet.</Text>
            <Text style={styles.emptyCopy}>Chats open after a follow request is accepted both ways.</Text>
            <Link href="/(tabs)/search" asChild><FrameButton icon="user-plus" label="Find Friends" /></Link>
          </View>
        }
        renderItem={({ item }) => {
          const { user, last, unread } = item;
          const presence = getPresence(user);
          return (
            <Link href={`/chat/${user.id}`} asChild>
              <Pressable style={styles.row}>
                <View style={styles.avatarWrap}>
                  <Image source={{ uri: user.avatarUrl ?? undefined }} style={styles.avatar} />
                  <View style={[styles.onlineDot, !presence.online && styles.offlineDot]} />
                </View>
                <View style={styles.meta}>
                  <View style={styles.nameRow}>
                    <Text style={styles.name}>{user.displayName}</Text>
                    <Text style={[styles.presence, presence.online && styles.presenceOnline]}>{presence.label}</Text>
                  </View>
                  {user.bio ? <Text numberOfLines={1} style={styles.aboutLine}>{user.bio}</Text> : null}
                  <Text numberOfLines={1} style={styles.preview}>{last ? `${last.fromUserId === currentUser?.id ? statusLabel(last.status) : "Received"} - ${last.text}` : "Tap to start a conversation"}</Text>
                </View>
                <View style={styles.trailing}>
                  <Text style={styles.time}>{last ? formatListTime(last.createdAt) : "new"}</Text>
                  {unread || !last ? <View style={styles.unreadDot} /> : null}
                </View>
              </Pressable>
            </Link>
          );
        }}
      />
    </PaperBackground>
  );
}

function statusLabel(status?: string) {
  if (status === "SEEN") return "Seen";
  if (status === "DELIVERED") return "Delivered";
  return "Sent";
}

function formatListTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const today = new Date();
  const startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const startMessageDay = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const dayDiff = Math.round((startToday - startMessageDay) / 86400000);
  if (dayDiff === 0) return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  if (dayDiff === 1) return "Yesterday";
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function getPresence(user: UserDto) {
  if (!user.lastSeenAt) return { online: false, label: "Offline" };
  const seen = parsePresenceTime(user.lastSeenAt);
  if (Number.isNaN(seen)) return { online: false, label: "Offline" };
  const minutes = Math.max(0, Math.floor((Date.now() - seen) / 60000));
  if (minutes <= 2) return { online: true, label: "Online" };
  if (minutes < 60) return { online: false, label: `${minutes}m ago` };
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return { online: false, label: `${hours}h ago` };
  if (hours < 48) return { online: false, label: "Yesterday" };
  return { online: false, label: `${Math.floor(hours / 24)}d ago` };
}

function parsePresenceTime(value: string) {
  if (/[zZ]|[+-]\d{2}:?\d{2}$/.test(value)) return new Date(value).getTime();
  return new Date(`${value.replace(" ", "T")}Z`).getTime();
}

const styles = StyleSheet.create({
  content: { padding: 18, paddingTop: 34, paddingBottom: 110, gap: 10 },
  header: { gap: 14, marginBottom: 6 },
  titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  kicker: { color: palette.mutedBrown, fontSize: 12, fontWeight: "900" },
  title: { color: palette.ink, fontSize: 34, fontWeight: "900" },
  compose: { width: 44, height: 44, borderRadius: 22, backgroundColor: palette.whitePaper, borderWidth: 1, borderColor: "#E4D9CA", alignItems: "center", justifyContent: "center" },
  search: { minHeight: 46, borderRadius: 23, backgroundColor: palette.whitePaper, borderWidth: 1, borderColor: "#E4D9CA", flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14 },
  input: { flex: 1, color: palette.ink },
  row: { minHeight: 80, backgroundColor: palette.whitePaper, borderRadius: 8, borderWidth: 1, borderColor: "#E4D9CA", padding: 12, flexDirection: "row", alignItems: "center", gap: 12 },
  avatarWrap: { position: "relative" },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: "#E4D9CA" },
  onlineDot: { position: "absolute", right: 1, bottom: 1, width: 13, height: 13, borderRadius: 7, backgroundColor: "#59C36A", borderWidth: 2, borderColor: palette.whitePaper },
  offlineDot: { backgroundColor: "#A79EA0" },
  meta: { flex: 1 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  name: { color: palette.ink, fontSize: 16, fontWeight: "900" },
  presence: { color: palette.mutedBrown, fontSize: 10, fontWeight: "900" },
  presenceOnline: { color: "#2F9D55" },
  aboutLine: { color: palette.ink, fontSize: 11, fontWeight: "800", marginTop: 2 },
  preview: { color: palette.mutedBrown, marginTop: 3 },
  trailing: { alignItems: "flex-end", gap: 8 },
  time: { color: palette.mutedBrown, fontSize: 11, fontWeight: "800" },
  unreadDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: palette.softPeach },
  empty: { gap: 12, paddingTop: 130 },
  emptyTitle: { color: palette.ink, fontSize: 28, fontWeight: "900" },
  emptyCopy: { color: palette.mutedBrown, fontSize: 16, lineHeight: 23 }
});
