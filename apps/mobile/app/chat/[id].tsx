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
  const discoverableUsers = useAppStore((state) => state.discoverableUsers);
  const messages = useAppStore((state) => state.chatMessages.filter((message) => message.threadUserId === threadUserId));
  const mergeChatMessages = useAppStore((state) => state.mergeChatMessages);
  const sendChatMessage = useAppStore((state) => state.sendChatMessage);
  const [remoteFriend, setRemoteFriend] = useState<UserDto | null>(null);
  const [accepted, setAccepted] = useState(true);
  const [text, setText] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [sending, setSending] = useState(false);

  const friend =
    remoteFriend ??
    localFriend ??
    discoverableUsers.find((u) => u.id === threadUserId) ?? {
      id: threadUserId ?? "friend",
      displayName: "Frames Friend",
      username: "friend",
      avatarUrl: null,
      bio: null,
      defaultPrivacy: "FRIENDS",
      profileVisibility: "PUBLIC",
      lastSeenAt: null
    };

  const presence = getPresence(friend);
  const listRef = useRef<FlatList<(typeof messages)[number]>>(null);
  const sortedMessages = useMemo(
    () => [...messages].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    [messages]
  );

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!threadUserId) return;
      const { relation, user } = await fetchRelationshipWithProfile(threadUserId);
      if (!mounted) return;
      if (user) setRemoteFriend(user);
      if (relation) setAccepted(relation.status === "ACCEPTED" || Boolean(localFriend));
      const chatResult = await fetchThreadMessages(threadUserId);
      if (!mounted) return;
      mergeChatMessages(chatResult.messages);
      await markThreadSeen(threadUserId);
    };
    void load();
    const interval = setInterval(() => { void load(); }, 6000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [localFriend, mergeChatMessages, threadUserId]);

  if (!friend) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable style={styles.iconBtn} onPress={() => router.back()}>
            <AppIcon name="arrow-left" color={palette.ink} size={18} />
          </Pressable>
          <Text style={styles.headerName}>Chat</Text>
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Chat unavailable</Text>
          <Link href="/(tabs)/chats" asChild>
            <FrameButton icon="comment" label="Back to Chats" />
          </Link>
        </View>
      </View>
    );
  }

  const send = () => {
    if (!text.trim() || sending) return;
    const outgoing = text.trim();
    setText("");
    setSending(true);
    setStatusMessage("");

    void sendRemoteChatMessage(friend.id, outgoing)
      .then(({ message }) => {
        if (message) {
          mergeChatMessages([message]);
          return;
        }
        sendChatMessage(friend.id, outgoing);
      })
      .finally(() => setSending(false));
  };

  const sendMedia = async () => {
    setStatusMessage("");
    try {
      if (Platform.OS !== "web") {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          setStatusMessage("Gallery permission is needed to send media.");
          return;
        }
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
    } catch {
      // Handled
    } finally {
      setSending(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      {/* WhatsApp Style Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <AppIcon name="arrow-left" color={palette.ink} size={18} />
        </Pressable>

        <Link href={`/user/${friend.id}`} asChild>
          <Pressable style={styles.headerProfile}>
            <View style={styles.avatarWrap}>
              <Image source={{ uri: friend.avatarUrl ?? undefined }} style={styles.headerAvatar} />
              {presence.online ? <View style={styles.headerOnlineDot} /> : null}
            </View>
            <View style={styles.headerInfo}>
              <Text numberOfLines={1} style={styles.headerName}>{friend.displayName}</Text>
              <Text style={[styles.headerStatus, presence.online && styles.headerStatusOnline]}>
                {presence.online ? "Online" : `@${friend.username}`}
              </Text>
            </View>
          </Pressable>
        </Link>

        <View style={styles.headerActions}>
          <Pressable style={styles.iconBtn} onPress={() => { void sendMedia(); }}>
            <AppIcon name="camera" color={palette.ink} size={18} />
          </Pressable>
          <Link href={`/user/${friend.id}`} asChild>
            <Pressable style={styles.iconBtn}>
              <AppIcon name="settings" color={palette.ink} size={18} />
            </Pressable>
          </Link>
        </View>
      </View>

      {/* WhatsApp Doodle Paper Messages Area */}
      <FlatList
        contentContainerStyle={styles.messagesList}
        ref={listRef}
        data={sortedMessages}
        keyExtractor={(item) => item.id}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        ListHeaderComponent={
          <View style={styles.encryptionNotice}>
            <Text style={styles.encryptionNoticeText}>🔒 Messages are end-to-end synced with your Frames circle.</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyMessages}>
            <Text style={styles.emptyMessagesTitle}>No messages yet</Text>
            <Text style={styles.emptyMessagesCopy}>Send a message or a Frame photo to start chatting!</Text>
          </View>
        }
        renderItem={({ item }) => {
          const mine = item.fromUserId === currentUser?.id;
          return (
            <View style={[styles.msgRow, mine ? styles.msgRowMine : styles.msgRowTheirs]}>
              <View style={[styles.msgBubble, mine ? styles.msgBubbleMine : styles.msgBubbleTheirs]}>
                {item.mediaUrl ? (
                  <View style={styles.mediaFrame}>
                    <Image source={{ uri: item.mediaUrl }} style={styles.msgImage} />
                  </View>
                ) : null}
                {item.text ? (
                  <Text style={[styles.msgText, mine ? styles.msgTextMine : styles.msgTextTheirs]}>
                    {item.text}
                  </Text>
                ) : null}
                <View style={styles.msgFooter}>
                  <Text style={[styles.msgTime, mine ? styles.msgTimeMine : styles.msgTimeTheirs]}>
                    {formatMessageTime(item.createdAt)}
                  </Text>
                  {mine ? (
                    <Text style={[styles.msgCheck, item.status === "SEEN" && styles.msgCheckBlue]}>
                      {item.status === "SEEN" ? " ✓✓" : item.status === "DELIVERED" ? " ✓✓" : " ✓"}
                    </Text>
                  ) : null}
                </View>
              </View>
            </View>
          );
        }}
      />

      {statusMessage ? <Text style={styles.statusToast}>{statusMessage}</Text> : null}

      {/* WhatsApp Style Composer */}
      <View style={styles.composerWrap}>
        <View style={styles.composerInputRow}>
          <Pressable style={styles.attachBtn} onPress={() => { void sendMedia(); }}>
            <AppIcon name="gallery" color={palette.ink} size={18} />
          </Pressable>

          <TextInput
            style={styles.textInput}
            value={text}
            onChangeText={setText}
            placeholder="Type a message..."
            placeholderTextColor={palette.mutedBrown}
            multiline
            onSubmitEditing={send}
          />
        </View>

        <Pressable
          style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnDisabled]}
          onPress={text.trim() ? send : () => { void sendMedia(); }}
        >
          <AppIcon name={text.trim() ? "send" : "camera"} color={palette.ink} size={18} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function formatMessageTime(timestamp?: string | null) {
  if (!timestamp) return "Just now";
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "Just now";
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
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
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 12, paddingTop: 48, paddingBottom: 10, backgroundColor: palette.whitePaper, borderBottomWidth: 2, borderBottomColor: palette.ink, shadowColor: palette.ink, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 0 },
  backBtn: { width: 34, height: 34, borderRadius: 17, borderWidth: 1.5, borderColor: palette.ink, backgroundColor: palette.paperCream, alignItems: "center", justifyContent: "center" },
  headerProfile: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1, marginLeft: 8 },
  avatarWrap: { position: "relative" },
  headerAvatar: { width: 38, height: 38, borderRadius: 19, borderWidth: 1.5, borderColor: palette.ink, backgroundColor: palette.softPeach },
  headerOnlineDot: { position: "absolute", bottom: 0, right: 0, width: 12, height: 12, borderRadius: 6, backgroundColor: "#25D366", borderWidth: 2, borderColor: palette.whitePaper },
  headerInfo: { flex: 1, minWidth: 0 },
  headerName: { fontSize: 15, fontWeight: "900", color: palette.ink },
  headerStatus: { fontSize: 11, fontWeight: "700", color: palette.mutedBrown },
  headerStatusOnline: { color: "#25D366", fontWeight: "900" },
  headerActions: { flexDirection: "row", gap: 6 },
  iconBtn: { width: 34, height: 34, borderRadius: 17, borderWidth: 1.5, borderColor: palette.ink, backgroundColor: palette.paperCream, alignItems: "center", justifyContent: "center" },
  messagesList: { padding: 14, paddingBottom: 20, gap: 10 },
  encryptionNotice: { alignSelf: "center", backgroundColor: "rgba(255,255,255,0.7)", borderWidth: 1, borderColor: palette.ink, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4, marginVertical: 8 },
  encryptionNoticeText: { fontSize: 10, fontWeight: "700", color: palette.mutedBrown, textAlign: "center" },
  emptyMessages: { padding: 32, alignItems: "center", gap: 6, marginTop: 40 },
  emptyMessagesTitle: { fontSize: 15, fontWeight: "900", color: palette.ink },
  emptyMessagesCopy: { fontSize: 12, color: palette.mutedBrown, textAlign: "center" },
  msgRow: { flexDirection: "row", width: "100%" },
  msgRowMine: { justifyContent: "flex-end" },
  msgRowTheirs: { justifyContent: "flex-start" },
  msgBubble: { maxWidth: "80%", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1.5, borderColor: palette.ink, shadowColor: palette.ink, shadowOffset: { width: 2, height: 2 }, shadowOpacity: 0.8, shadowRadius: 0 },
  msgBubbleMine: { backgroundColor: palette.acidYellow, borderBottomRightRadius: 2 },
  msgBubbleTheirs: { backgroundColor: palette.whitePaper, borderBottomLeftRadius: 2 },
  mediaFrame: { borderRadius: 8, overflow: "hidden", borderWidth: 1, borderColor: palette.ink, marginBottom: 6 },
  msgImage: { width: 200, height: 200, borderRadius: 6 },
  msgText: { fontSize: 14, lineHeight: 19, fontWeight: "600" },
  msgTextMine: { color: palette.ink },
  msgTextTheirs: { color: palette.ink },
  msgFooter: { flexDirection: "row", justifyContent: "flex-end", alignItems: "center", marginTop: 4, gap: 3 },
  msgTime: { fontSize: 9, fontWeight: "700" },
  msgTimeMine: { color: "rgba(17,17,17,0.7)" },
  msgTimeTheirs: { color: palette.mutedBrown },
  msgCheck: { fontSize: 10, fontWeight: "900", color: palette.mutedBrown },
  msgCheckBlue: { color: "#2D8CFF" },
  statusToast: { alignSelf: "center", backgroundColor: palette.whitePaper, borderWidth: 1, borderColor: palette.ink, borderRadius: 4, paddingHorizontal: 8, paddingVertical: 2, fontSize: 11, fontWeight: "700", color: palette.mutedBrown, marginBottom: 4 },
  composerWrap: { flexDirection: "row", alignItems: "flex-end", gap: 8, padding: 10, backgroundColor: palette.whitePaper, borderTopWidth: 2, borderTopColor: palette.ink },
  composerInputRow: { flex: 1, flexDirection: "row", alignItems: "center", backgroundColor: palette.paperCream, borderWidth: 1.5, borderColor: palette.ink, borderRadius: 20, paddingHorizontal: 10, minHeight: 42, maxHeight: 100 },
  attachBtn: { padding: 6 },
  textInput: { flex: 1, fontSize: 14, color: palette.ink, fontWeight: "600", maxHeight: 90, paddingVertical: 8 },
  sendBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: palette.acidYellow, borderWidth: 2, borderColor: palette.ink, alignItems: "center", justifyContent: "center", shadowColor: palette.ink, shadowOffset: { width: 2, height: 2 }, shadowOpacity: 0.9, shadowRadius: 0 },
  sendBtnDisabled: { backgroundColor: palette.softLavender },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: "900", color: palette.ink }
});
