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
  const friend = localFriend ?? remoteFriend;
  const presence = getPresence(friend);
  const listRef = useRef<FlatList<(typeof messages)[number]>>(null);
  const sortedMessages = useMemo(() => [...messages].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()), [messages]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!threadUserId) return;
      const { relation, user } = await fetchRelationshipWithProfile(threadUserId);
      if (!mounted) return;
      setRemoteFriend(user);
      setAccepted(relation?.status === "ACCEPTED" || Boolean(localFriend));
      const chatResult = await fetchThreadMessages(threadUserId);
      if (!mounted) return;
      mergeChatMessages(chatResult.messages);
      await markThreadSeen(threadUserId);
    };
    void load();
    const interval = setInterval(() => { void load(); }, 15000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [localFriend, mergeChatMessages, threadUserId]);

  if (!friend || !accepted) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Chat unavailable</Text>
        <Text style={styles.copy}>You can message someone after the follow request is accepted.</Text>
        <Link href="/(tabs)/search" asChild><FrameButton icon="search" label="Find Friends" /></Link>
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
      setStatusMessage("Message saved locally only. Check that the follow request is accepted on both accounts.");
    }).finally(() => setSending(false));
  };

  const sendMedia = async () => {
    setStatusMessage("");
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setStatusMessage("Gallery permission is needed to send media.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.85 });
    if (result.canceled || !result.assets[0]?.uri) return;
    setSending(true);
    const sent = await sendRemoteChatMedia(friend.id, result.assets[0].uri);
    if (sent.message) mergeChatMessages([sent.message]);
    else setStatusMessage(sent.error?.message ?? "Could not send media.");
    setSending(false);
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={styles.header}>
        <Pressable style={styles.headerIcon} onPress={() => router.back()}><AppIcon name="arrow-left" color={palette.whitePaper} size={20} /></Pressable>
        <Link href={`/user/${friend.id}`} asChild>
          <Pressable style={styles.profileTap}>
            <Image source={{ uri: friend.avatarUrl ?? undefined }} style={styles.avatar} />
            <View style={styles.headerMeta}>
              <Text style={styles.name}>{friend.displayName}</Text>
              <Text style={[styles.handle, presence.online && styles.onlineText]}>{presence.online ? "Online now" : presence.label}</Text>
              {friend.bio ? <Text numberOfLines={1} style={styles.chatBio}>{friend.bio}</Text> : null}
            </View>
          </Pressable>
        </Link>
        <Pressable style={styles.headerIcon}><AppIcon name="camera" color={palette.whitePaper} size={19} /></Pressable>
        <Pressable style={styles.headerIcon}><AppIcon name="settings" color={palette.whitePaper} size={19} /></Pressable>
      </View>
      <FlatList
        contentContainerStyle={styles.messages}
        ref={listRef}
        data={sortedMessages}
        keyExtractor={(item) => item.id}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        ListEmptyComponent={<Text style={styles.empty}>No messages yet. Send the first Frame note.</Text>}
        renderItem={({ item }) => {
          const mine = item.fromUserId === currentUser?.id;
          return (
            <View style={[styles.messageWrap, mine ? styles.messageMine : styles.messageTheirs]}>
              {item.mediaUrl ? <Image source={{ uri: item.mediaUrl }} style={[styles.chatImage, mine ? styles.mineImage : styles.theirsImage]} /> : null}
              {item.text ? <Text style={[styles.bubble, mine ? styles.mine : styles.theirs]}>{item.text}</Text> : null}
              <Text style={[styles.messageStatus, mine ? styles.statusMine : styles.statusTheirs]}>
                {mine ? `${statusLabel(item.status)} ${formatMessageTime(statusTime(item))}` : `Received ${formatMessageTime(item.createdAt)}`}
              </Text>
            </View>
          );
        }}
      />
      {statusMessage ? <Text style={styles.statusMessage}>{statusMessage}</Text> : null}
      <View style={styles.composer}>
        <Pressable style={styles.composerIcon} onPress={() => { void sendMedia(); }}><AppIcon name="gallery" color={palette.whitePaper} size={18} /></Pressable>
        <TextInput style={styles.input} value={text} onChangeText={setText} placeholder="Message" placeholderTextColor="#A79EA0" />
        <Pressable style={[styles.sendIcon, sending && styles.sending]} disabled={sending} onPress={send}><AppIcon name="send" color={palette.whitePaper} size={18} /></Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function statusLabel(status?: string) {
  if (status === "SEEN") return "Seen";
  if (status === "DELIVERED") return "Delivered";
  return "Sent";
}

function statusTime(message: { status?: string; createdAt: string; deliveredAt?: string; seenAt?: string }) {
  if (message.status === "SEEN" && message.seenAt) return message.seenAt;
  if (message.status === "DELIVERED" && message.deliveredAt) return message.deliveredAt;
  return message.createdAt;
}

function formatMessageTime(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function getPresence(user?: UserDto | null) {
  if (!user?.lastSeenAt) return { online: false, label: "Offline" };
  const seen = parsePresenceTime(user.lastSeenAt);
  if (Number.isNaN(seen)) return { online: false, label: "Offline" };
  const minutes = Math.max(0, Math.floor((Date.now() - seen) / 60000));
  if (minutes <= 2) return { online: true, label: "Online now" };
  if (minutes < 60) return { online: false, label: `Last seen ${minutes}m ago` };
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return { online: false, label: `Last seen ${hours}h ago` };
  if (hours < 48) return { online: false, label: "Last seen yesterday" };
  return { online: false, label: `Last seen ${Math.floor(hours / 24)}d ago` };
}

function parsePresenceTime(value: string) {
  if (/[zZ]|[+-]\d{2}:?\d{2}$/.test(value)) return new Date(value).getTime();
  return new Date(`${value.replace(" ", "T")}Z`).getTime();
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#171414" },
  header: { padding: 14, paddingTop: 48, backgroundColor: "#221C1D", borderBottomWidth: 1, borderBottomColor: "#342829", flexDirection: "row", alignItems: "center", gap: 10 },
  headerIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#342829", alignItems: "center", justifyContent: "center" },
  profileTap: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  headerMeta: { flex: 1 },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: "#E4D9CA" },
  name: { color: palette.whitePaper, fontSize: 17, fontWeight: "900" },
  handle: { color: "#A79EA0", fontWeight: "800" },
  chatBio: { color: "#D8CFC7", fontSize: 11, fontWeight: "800", marginTop: 2 },
  onlineText: { color: "#6DE189" },
  title: { color: palette.ink, fontSize: 30, fontWeight: "900", margin: 22, marginTop: 58 },
  copy: { color: palette.mutedBrown, marginHorizontal: 22, marginBottom: 18, lineHeight: 22 },
  messages: { padding: 16, gap: 10, flexGrow: 1, justifyContent: "flex-end" },
  empty: { color: "#A79EA0", textAlign: "center", marginBottom: 40 },
  messageWrap: { maxWidth: "82%", gap: 4 },
  messageMine: { alignSelf: "flex-end", alignItems: "flex-end" },
  messageTheirs: { alignSelf: "flex-start", alignItems: "flex-start" },
  bubble: { maxWidth: "78%", borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10, overflow: "hidden", fontWeight: "800", lineHeight: 20 },
  mine: { alignSelf: "flex-end", backgroundColor: "#7B2CE5", color: palette.whitePaper, borderBottomRightRadius: 5 },
  theirs: { alignSelf: "flex-start", backgroundColor: "#2E292A", color: palette.whitePaper, borderBottomLeftRadius: 5 },
  messageStatus: { fontSize: 10, fontWeight: "800" },
  statusMine: { color: "#BCA8E8" },
  statusTheirs: { color: "#777173" },
  chatImage: { width: 170, height: 170, borderRadius: 14, backgroundColor: "#342829" },
  mineImage: { borderBottomRightRadius: 5 },
  theirsImage: { borderBottomLeftRadius: 5 },
  statusMessage: { color: "#F8E7B2", backgroundColor: "#221C1D", paddingHorizontal: 14, paddingVertical: 9, fontWeight: "800" },
  composer: { padding: 12, backgroundColor: "#221C1D", borderTopWidth: 1, borderTopColor: "#342829", flexDirection: "row", gap: 8, alignItems: "center" },
  composerIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#342829", alignItems: "center", justifyContent: "center" },
  input: { flex: 1, minHeight: 42, borderRadius: 21, backgroundColor: "#171414", paddingHorizontal: 16, color: palette.whitePaper, borderWidth: 1, borderColor: "#342829" },
  sendIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: "#7B2CE5", alignItems: "center", justifyContent: "center" },
  sending: { opacity: 0.55 }
});
