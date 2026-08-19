import { Link } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { FlatList, Image, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import type { UserDto } from "@frames/types";
import { palette } from "@frames/ui";
import { AppIcon } from "../../components/AppIcon";
import { FrameButton } from "../../components/FrameButton";
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
          displayName: "Frames Friend",
          username: "friend",
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
        const unreadCount = threadMessages.filter((m) => m.fromUserId !== currentUser?.id && m.status !== "SEEN").length;
        return { user, last, unreadCount };
      })
      .filter((row) => row.last || friends.some((f) => f.id === row.user.id) || remoteFriends.some((f) => f.id === row.user.id))
      .filter((row) => {
        const needle = query.trim().toLowerCase();
        if (!needle) return true;
        return (
          row.user.displayName.toLowerCase().includes(needle) ||
          row.user.username.toLowerCase().includes(needle) ||
          (row.last?.text ?? "").toLowerCase().includes(needle)
        );
      })
      .sort((a, b) => new Date(b.last?.createdAt ?? 0).getTime() - new Date(a.last?.createdAt ?? 0).getTime());
  }, [currentUser?.id, discoverableUsers, friends, messages, query, remoteFriends]);

  return (
    <View style={styles.container}>
      <FlatList
        contentContainerStyle={styles.content}
        data={rows}
        keyExtractor={(item) => item.user.id}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <View>
                <Text style={styles.kicker}>ENCRYPTED DIRECT CHATS</Text>
                <Text style={styles.title}>Messages</Text>
              </View>
              <Link href="/(tabs)/search" asChild>
                <Pressable style={styles.composeBtn}>
                  <AppIcon name="user-plus" color={palette.ink} size={18} />
                </Pressable>
              </Link>
            </View>

            <View style={styles.searchBar}>
              <AppIcon name="search" color={palette.mutedBrown} size={16} />
              <TextInput
                placeholder="Search chats or messages..."
                placeholderTextColor={palette.mutedBrown}
                style={styles.searchInput}
                value={query}
                onChangeText={setQuery}
              />
              {query ? (
                <Pressable onPress={() => setQuery("")} style={styles.clearSearch}>
                  <Text style={styles.clearText}>✕</Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <AppIcon name="comment" color={palette.ink} size={36} />
            <Text style={styles.emptyTitle}>No conversations yet</Text>
            <Text style={styles.emptyCopy}>Connect with friends or accept follow requests to start messaging.</Text>
            <Link href="/(tabs)/search" asChild>
              <FrameButton icon="search" label="Discover Friends" />
            </Link>
          </View>
        }
        renderItem={({ item }) => {
          const { user, last, unreadCount } = item;
          const presence = getPresence(user);
          const mine = last?.fromUserId === currentUser?.id;

          return (
            <Link href={`/chat/${user.id}`} asChild>
              <Pressable style={[styles.chatCard, unreadCount > 0 && styles.chatCardUnread]}>
                <View style={styles.avatarWrap}>
                  <Image source={{ uri: user.avatarUrl ?? undefined }} style={styles.avatar} />
                  {presence.online ? <View style={styles.onlineBadge} /> : null}
                </View>

                <View style={styles.meta}>
                  <View style={styles.nameRow}>
                    <Text numberOfLines={1} style={styles.name}>{user.displayName}</Text>
                    <Text style={styles.time}>{last ? formatChatTime(last.createdAt) : "New"}</Text>
                  </View>

                  <View style={styles.snippetRow}>
                    <View style={styles.snippetLeft}>
                      {mine && last ? (
                        <Text style={[styles.tick, last.status === "SEEN" && styles.tickBlue]}>
                          {last.status === "SEEN" ? "✓✓ " : last.status === "DELIVERED" ? "✓✓ " : "✓ "}
                        </Text>
                      ) : null}
                      <Text numberOfLines={1} style={[styles.preview, unreadCount > 0 && styles.previewBold]}>
                        {last ? (last.mediaUrl && !last.text ? "📷 Photo Frame" : last.text) : "Tap to say hello..."}
                      </Text>
                    </View>

                    {unreadCount > 0 ? (
                      <View style={styles.unreadBadge}>
                        <Text style={styles.unreadCountText}>{unreadCount}</Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              </Pressable>
            </Link>
          );
        }}
      />
    </View>
  );
}

function formatChatTime(timestamp?: string | null) {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "";
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function getPresence(user: UserDto | null | undefined) {
  if (!user?.lastSeenAt) return { online: false, label: "Active recently" };
  const date = new Date(user.lastSeenAt);
  if (Number.isNaN(date.getTime())) return { online: false, label: "Active recently" };
  const diffMinutes = Math.floor((Date.now() - date.getTime()) / (1000 * 60));
  return { online: diffMinutes <= 5, label: diffMinutes <= 5 ? "Online" : "Offline" };
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.paperCream },
  content: { padding: 16, paddingTop: 52, paddingBottom: 90, gap: 10 },
  header: { gap: 12, marginBottom: 6 },
  titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  kicker: { fontSize: 9, fontWeight: "900", color: palette.mutedBrown, letterSpacing: 0.8 },
  title: { fontSize: 28, fontWeight: "900", color: palette.ink, letterSpacing: -0.5 },
  composeBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: palette.acidYellow, borderWidth: 1.5, borderColor: palette.ink, alignItems: "center", justifyContent: "center", shadowColor: palette.ink, shadowOffset: { width: 2, height: 2 }, shadowOpacity: 0.8, shadowRadius: 0 },
  searchBar: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: palette.whitePaper, borderWidth: 1.5, borderColor: palette.ink, borderRadius: 8, paddingHorizontal: 12, height: 42, shadowColor: palette.ink, shadowOffset: { width: 2, height: 2 }, shadowOpacity: 0.7, shadowRadius: 0 },
  searchInput: { flex: 1, fontSize: 13, color: palette.ink, fontWeight: "600" },
  clearSearch: { padding: 4 },
  clearText: { fontSize: 13, fontWeight: "900", color: palette.mutedBrown },
  chatCard: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: palette.whitePaper, borderWidth: 1.5, borderColor: palette.ink, borderRadius: 8, padding: 12, shadowColor: palette.ink, shadowOffset: { width: 3, height: 3 }, shadowOpacity: 0.85, shadowRadius: 0 },
  chatCardUnread: { backgroundColor: "#FFFFFF", borderColor: palette.ink, borderWidth: 2 },
  avatarWrap: { position: "relative" },
  avatar: { width: 48, height: 48, borderRadius: 24, borderWidth: 1.5, borderColor: palette.ink, backgroundColor: palette.softPeach },
  onlineBadge: { position: "absolute", bottom: 0, right: 0, width: 14, height: 14, borderRadius: 7, backgroundColor: "#25D366", borderWidth: 2, borderColor: palette.whitePaper },
  meta: { flex: 1, minWidth: 0, gap: 3 },
  nameRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  name: { fontSize: 15, fontWeight: "900", color: palette.ink, flex: 1 },
  time: { fontSize: 11, fontWeight: "700", color: palette.mutedBrown, marginLeft: 8 },
  snippetRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  snippetLeft: { flexDirection: "row", alignItems: "center", flex: 1, minWidth: 0 },
  tick: { fontSize: 12, fontWeight: "900", color: palette.mutedBrown },
  tickBlue: { color: "#34B7F1" },
  preview: { fontSize: 13, color: palette.mutedBrown, fontWeight: "500", flex: 1 },
  previewBold: { color: palette.ink, fontWeight: "800" },
  unreadBadge: { backgroundColor: palette.acidYellow, borderWidth: 1.5, borderColor: palette.ink, borderRadius: 10, minWidth: 20, height: 20, alignItems: "center", justifyContent: "center", paddingHorizontal: 5, marginLeft: 8 },
  unreadCountText: { fontSize: 10, fontWeight: "900", color: palette.ink },
  empty: { padding: 40, alignItems: "center", gap: 12, borderWidth: 1.5, borderStyle: "dashed", borderColor: palette.ink, borderRadius: 8, backgroundColor: "rgba(255,255,255,0.6)", marginTop: 20 },
  emptyTitle: { fontSize: 17, fontWeight: "900", color: palette.ink },
  emptyCopy: { fontSize: 13, color: palette.mutedBrown, textAlign: "center", maxWidth: 260, lineHeight: 18 }
});
