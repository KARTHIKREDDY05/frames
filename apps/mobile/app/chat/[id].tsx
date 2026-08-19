import { Link, router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { FlatList, Image, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { palette } from "@frames/ui";
import { AppIcon } from "../../components/AppIcon";
import { FrameButton } from "../../components/FrameButton";
import { fetchRelationshipWithProfile, fetchThreadMessages, markThreadSeen, sendRemoteChatMedia, sendRemoteChatMessage } from "../../services/supabase";
import { useAppStore } from "../../store/appStore";
import type { UserDto } from "@frames/types";

export default function ChatThread() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const threadUserId = Array.isArray(id) ? id[0] : id;
  const currentUser = useAppStore((state) => state.currentUser);
  const localFriend = useAppStore((state) => state.friends.find((item) => item.id === threadUserId));
  const messages = useAppStore((state) => state.chatMessages.filter((message) => message.threadUserId === threadUserId));
  const mergeChatMessages = useAppStore((state) => state.mergeChatMessages);
  const sendChatMessage = useAppStore((state) => state.sendChatMessage);
  const [remoteFriend, setRemoteFriend] = useState<UserDto | null>(null);
  const [accepted, setAccepted] = useState(Boolean(localFriend));
  const [text, setText] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [sending, setSending] = useState(false);
  const friend = remoteFriend ?? localFriend;
  const presence = getPresence(friend);
  const listRef = useRef<FlatList<(typeof messages)[number]>>(null);
  const sortedMessages = useMemo(() => [...messages].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()), [messages]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!threadUserId) return;
      const { relation, user } = await fetchRelationshipWithProfile(threadUserId);
      if (!mounted) return;
      if (user) setRemoteFriend(user);
      setAccepted(relation?.status === "ACCEPTED" || Boolean(localFriend));
      const chatResult = await fetchThreadMessages(threadUserId);
      if (!mounted) return;
      mergeChatMessages(chatResult.messages);
      await markThreadSeen(threadUserId);
    };
    void load();
    const interval = setInterval(() => { void load(); }, 8000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [localFriend, mergeChatMessages, threadUserId]);

  if (!friend || !accepted) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable style={styles.headerIcon} onPress={() => router.back()}>
            <AppIcon name="arrow-left" color={palette.ink} size={20} />
          </Pressable>
          <Text style={styles.headerTitle}>Chat</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Chat unavailable</Text>
          <Text style={styles.emptyCopy}>You can message each other once your follow request is accepted.</Text>
          <Link href="/(tabs)/search" asChild>
            <FrameButton icon="search" label="Find Friends" />
          </Link>
        </View>
      </View>
    );
  }

  const send = () => {
    if (!text.trim() || sending) return;
    const outgoing = text;
    setText("");
    setSending(true);
    setStatusMessage("");
    void sendRemoteChatMessage(friend.id, outgoing).then(({ message }) => {
      if (message) {
        mergeChatMessages([message]);
        return;
      }
      sendChatMessage(friend.id, outgoing);
      setStatusMessage("Message saved locally. Will sync when online.");
    }).finally(() => setSending(false));
  };

  const sendMedia = async () => {
    setStatusMessage("");
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setStatusMessage("Gallery permission is needed to send media.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85
    });
    if (result.canceled || !result.assets[0]?.uri) return;
    setSending(true);
    const sent = await sendRemoteChatMedia(friend.id, result.assets[0].uri);
    if (sent.message) mergeChatMessages([sent.message]);
    else setStatusMessage(sent.error?.message ?? "Could not send media.");
    setSending(false);
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.headerIcon} onPress={() => router.back()}>
          <AppIcon name="arrow-left" color={palette.ink} size={20} />
        </Pressable>

        <Link href={`/user/${friend.id}`} asChild>
          <Pressable style={styles.profileTap}>
            <Image source={{ uri: friend.avatarUrl ?? undefined }} style={styles.avatar} />
            <View style={styles.headerMeta}>
              <Text numberOfLines={1} style={styles.name}>{friend.displayName}</Text>
              <View style={styles.statusRow}>
                <View style={[styles.presenceDot, presence.online && styles.presenceDotOnline]} />
                <Text style={styles.handle}>{presence.online ? "Online" : `@${friend.username}`}</Text>
              </View>
              {friend.bio ? (
                <Text numberOfLines={1} style={styles.chatBio}>"{friend.bio}"</Text>
              ) : null}
            </View>
          </Pressable>
        </Link>

        <Pressable style={styles.headerActionIcon} onPress={() => { void sendMedia(); }}>
          <AppIcon name="camera" color={palette.ink} size={20} />
        </Pressable>

        <Link href={`/user/${friend.id}`} asChild>
          <Pressable style={styles.headerActionIcon}>
            <AppIcon name="settings" color={palette.ink} size={20} />
          </Pressable>
        </Link>
      </View>

      {/* Messages */}
      <FlatList
        contentContainerStyle={styles.messages}
        ref={listRef}
        data={sortedMessages}
        keyExtractor={(item) => item.id}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        ListEmptyComponent={<Text style={styles.empty}>No messages yet. Say hello with your first Frame note!</Text>}
        renderItem={({ item }) => {
          const mine = item.fromUserId === currentUser?.id;
          return (
            <View style={[styles.messageWrap, mine ? styles.messageMine : styles.messageTheirs]}>
              {item.mediaUrl ? (
                <Image source={{ uri: item.mediaUrl }} style={[styles.chatImage, mine ? styles.mineImage : styles.theirsImage]} />
              ) : null}
              {item.text ? (
                <View style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
                  <Text style={[styles.bubbleText, mine ? styles.bubbleTextMine : styles.bubbleTextTheirs]}>{item.text}</Text>
                </View>
              ) : null}
              <View style={[styles.statusLine, mine ? styles.statusLineMine : styles.statusLineTheirs]}>
                <Text style={styles.statusText}>
                  {formatMessageTime(item.createdAt)}
                  {mine ? ` • ${statusLabel(item.status)}` : ""}
                </Text>
              </View>
            </View>
          );
        }}
      />

      {statusMessage ? <Text style={styles.statusMessage}>{statusMessage}</Text> : null}

      {/* Input Composer */}
      <View style={styles.composer}>
        <Pressable style={styles.composerIcon} onPress={() => { void sendMedia(); }}>
          <AppIcon name="gallery" color={palette.ink} size={20} />
        </Pressable>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Type a message..."
          placeholderTextColor={palette.mutedBrown}
          onSubmitEditing={send}
        />
        <Pressable style={[styles.sendIcon, (!text.trim() || sending) && styles.sendIconDisabled]} disabled={!text.trim() || sending} onPress={send}>
          <AppIcon name="send" color={palette.whitePaper} size={18} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function statusLabel(status?: string) {
  if (status === "SEEN") return "Seen ✓✓";
  if (status === "DELIVERED") return "Delivered ✓";
  return "Sent";
}

function formatMessageTime(timestamp?: string | null) {
  if (!timestamp) return "Just now";
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "Just now";
  const now = new Date();
  const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function getPresence(user: UserDto | null | undefined) {
  if (!user?.lastSeenAt) return { online: false, label: "Active recently" };
  const date = new Date(user.lastSeenAt);
  if (Number.isNaN(date.getTime())) return { online: false, label: "Active recently" };
  const diffMinutes = Math.floor((Date.now() - date.getTime()) / (1000 * 60));
  if (diffMinutes <= 5) return { online: true, label: "Online now" };
  if (diffMinutes < 60) return { online: false, label: `Active ${diffMinutes}m ago` };
  if (diffMinutes < 1440) return { online: false, label: `Active ${Math.floor(diffMinutes / 60)}h ago` };
  return { online: false, label: `Active ${date.toLocaleDateString()}` };
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.paperCream },
  header: {
    paddingTop: 48,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: palette.whitePaper,
    borderBottomWidth: 1,
    borderColor: "#E4D9CA",
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: "900", color: palette.ink, textAlign: "center" },
  headerIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: "#F0E8DC", alignItems: "center", justifyContent: "center" },
  headerActionIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: "#F0E8DC", alignItems: "center", justifyContent: "center" },
  profileTap: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#E4D9CA", borderWidth: 2, borderColor: palette.whitePaper },
  headerMeta: { flex: 1 },
  name: { fontSize: 16, fontWeight: "900", color: palette.ink },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 1 },
  presenceDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: palette.mutedBrown },
  presenceDotOnline: { backgroundColor: "#38A169" },
  handle: { fontSize: 12, fontWeight: "700", color: palette.mutedBrown },
  chatBio: { fontSize: 11, fontStyle: "italic", color: palette.mutedBrown, marginTop: 1 },
  messages: { padding: 16, gap: 12, paddingBottom: 24 },
  empty: { color: palette.mutedBrown, textAlign: "center", marginTop: 60, fontWeight: "700" },
  messageWrap: { maxWidth: "80%", gap: 4 },
  messageMine: { alignSelf: "flex-end", alignItems: "flex-end" },
  messageTheirs: { alignSelf: "flex-start", alignItems: "flex-start" },
  bubble: { borderRadius: 18, paddingHorizontal: 15, paddingVertical: 10 },
  mine: { backgroundColor: palette.ink, borderBottomRightRadius: 4 },
  theirs: { backgroundColor: palette.whitePaper, borderWidth: 1, borderColor: "#E4D9CA", borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 15, lineHeight: 20 },
  bubbleTextMine: { color: palette.whitePaper, fontWeight: "600" },
  bubbleTextTheirs: { color: palette.ink, fontWeight: "600" },
  chatImage: { width: 220, height: 220, borderRadius: 14, marginBottom: 4, backgroundColor: "#E4D9CA" },
  mineImage: { alignSelf: "flex-end" },
  theirsImage: { alignSelf: "flex-start" },
  statusLine: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 4 },
  statusLineMine: { justifyContent: "flex-end" },
  statusLineTheirs: { justifyContent: "flex-start" },
  statusText: { fontSize: 11, fontWeight: "700", color: palette.mutedBrown },
  statusMessage: { marginHorizontal: 16, marginBottom: 6, color: "#9B2C2C", fontSize: 12, fontWeight: "800", textAlign: "center" },
  composer: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: palette.whitePaper,
    borderTopWidth: 1,
    borderColor: "#E4D9CA",
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  composerIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: "#F0E8DC", alignItems: "center", justifyContent: "center" },
  input: {
    flex: 1,
    minHeight: 44,
    backgroundColor: palette.paperCream,
    borderRadius: 22,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#E4D9CA",
    color: palette.ink,
    fontSize: 15
  },
  sendIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: palette.ink, alignItems: "center", justifyContent: "center" },
  sendIconDisabled: { opacity: 0.4 },
  emptyState: { flex: 1, padding: 28, justifyContent: "center", alignItems: "center", gap: 14 },
  emptyTitle: { fontSize: 24, fontWeight: "900", color: palette.ink },
  emptyCopy: { fontSize: 15, color: palette.mutedBrown, textAlign: "center", lineHeight: 22 }
});
