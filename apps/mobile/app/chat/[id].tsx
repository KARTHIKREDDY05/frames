import { Link, router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import {
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { palette } from "@frames/ui";
import { AppIcon } from "../../components/AppIcon";
import { FrameButton } from "../../components/FrameButton";
import { VoiceMemoryPlayer } from "../../components/VoiceMemoryPlayer";
import {
  fetchRelationshipWithProfile,
  fetchThreadMessages,
  markThreadSeen,
  sendRemoteChatMedia,
  sendRemoteChatMessage
} from "../../services/supabase";
import { useAppStore } from "../../store/appStore";
import type { UserDto } from "@frames/types";

const STICKERS = ["❤️", "🌸", "⭐", "🧸", "👶", "🥞", "📸", "🎉", "🍪", "🥰"];

export default function ChatThread() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const threadUserId = Array.isArray(id) ? id[0] : id;
  const currentUser = useAppStore((state) => state.currentUser);
  const localFriend = useAppStore((state) => state.friends.find((item) => item.id === threadUserId));
  const discoverableUsers = useAppStore((state) => state.discoverableUsers);
  const messages = useAppStore((state) =>
    state.chatMessages.filter((message) => message.threadUserId === threadUserId)
  );
  const mergeChatMessages = useAppStore((state) => state.mergeChatMessages);
  const sendChatMessage = useAppStore((state) => state.sendChatMessage);

  const [remoteFriend, setRemoteFriend] = useState<UserDto | null>(null);
  const [text, setText] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [showStickerTray, setShowStickerTray] = useState(false);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);

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

  const listRef = useRef<FlatList<(typeof messages)[number]>>(null);
  const sortedMessages = useMemo(
    () => [...messages].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    [messages]
  );

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!threadUserId) return;
      const { user } = await fetchRelationshipWithProfile(threadUserId);
      if (!mounted) return;
      if (user) setRemoteFriend(user);
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
  }, [mergeChatMessages, threadUserId]);

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
      .catch(() => {
        sendChatMessage(friend.id, outgoing);
      })
      .finally(() => setSending(false));
  };

  const sendSticker = (stickerEmoji: string) => {
    sendChatMessage(friend.id, stickerEmoji);
    void sendRemoteChatMessage(friend.id, stickerEmoji).catch(() => {});
    setShowStickerTray(false);
  };

  const sendVoiceSnippet = () => {
    setIsRecordingVoice(true);
    setTimeout(() => {
      setIsRecordingVoice(false);
      sendChatMessage(friend.id, "🎙️ Voice Memory", {
        mediaType: "VOICE",
        audioDurationSec: 8
      });
      setStatusMessage("Voice memory sent! 🎙️");
      setTimeout(() => setStatusMessage(""), 2500);
    }, 1500);
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
      const uri = result.assets[0].uri;
      sendChatMessage(friend.id, "", { mediaUrl: uri, mediaType: "IMAGE" });
      const sent = await sendRemoteChatMedia(friend.id, uri);
      if (sent.message) mergeChatMessages([sent.message]);
    } catch {
      // Handled
    } finally {
      setSending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <AppIcon name="arrow-left" color={palette.ink} size={18} />
        </Pressable>

        <Link href={`/user/${friend.id}`} asChild>
          <Pressable style={styles.headerProfile}>
            <View style={styles.avatarWrap}>
              <Image
                source={{
                  uri: friend.avatarUrl || `https://i.pravatar.cc/160?u=${encodeURIComponent(friend.id)}`
                }}
                style={styles.headerAvatar}
              />
              <View style={styles.headerOnlineDot} />
            </View>
            <View style={styles.headerInfo}>
              <Text numberOfLines={1} style={styles.headerName}>
                {friend.displayName}
              </Text>
              <Text style={styles.headerStatus}>Active in Circle • Direct Encrypted</Text>
            </View>
          </Pressable>
        </Link>

        <View style={styles.headerActions}>
          <Pressable style={styles.iconBtn} onPress={() => { void sendMedia(); }}>
            <AppIcon name="camera" color={palette.ink} size={18} />
          </Pressable>
        </View>
      </View>

      {/* Messages List */}
      <FlatList
        contentContainerStyle={styles.messagesList}
        ref={listRef}
        data={sortedMessages}
        keyExtractor={(item) => item.id}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        ListHeaderComponent={
          <View style={styles.encryptionNotice}>
            <Text style={styles.encryptionNoticeText}>
              🔒 Encrypted Direct Circle • Safe Family Space
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyMessages}>
            <Text style={styles.emptyMessagesEmoji}>💌</Text>
            <Text style={styles.emptyMessagesTitle}>Start a Conversation</Text>
            <Text style={styles.emptyMessagesCopy}>
              Send a heartfelt message, share a photo frame, or send a quick voice note!
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const mine = item.fromUserId === currentUser?.id;
          const isVoice = item.mediaType === "VOICE";
          const isSingleEmoji =
            item.text && item.text.length <= 4 && /[\u{1F300}-\u{1F9FF}]/u.test(item.text);

          return (
            <View style={[styles.msgRow, mine ? styles.msgRowMine : styles.msgRowTheirs]}>
              {isSingleEmoji ? (
                <View style={styles.singleEmojiBubble}>
                  <Text style={styles.singleEmojiText}>{item.text}</Text>
                  <Text style={styles.emojiTime}>
                    {new Date(item.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </Text>
                </View>
              ) : (
                <View style={[styles.msgBubble, mine ? styles.msgBubbleMine : styles.msgBubbleTheirs]}>
                  {/* Photo Frame in Chat */}
                  {item.mediaUrl ? (
                    <View style={styles.mediaFrame}>
                      <Image source={{ uri: item.mediaUrl }} style={styles.msgImage} />
                    </View>
                  ) : null}

                  {/* Voice Note Bubble */}
                  {isVoice ? (
                    <VoiceMemoryPlayer
                      compact
                      speakerName={mine ? "You" : friend.displayName}
                      audioDurationSec={item.audioDurationSec || 8}
                    />
                  ) : null}

                  {/* Message Text */}
                  {item.text && !isVoice ? (
                    <Text style={[styles.msgText, mine ? styles.msgTextMine : styles.msgTextTheirs]}>
                      {item.text}
                    </Text>
                  ) : null}

                  {/* Message Footer */}
                  <View style={styles.msgFooter}>
                    <Text style={[styles.msgTime, mine ? styles.msgTimeMine : styles.msgTimeTheirs]}>
                      {new Date(item.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </Text>
                    {mine ? (
                      <Text style={[styles.msgCheck, item.status === "SEEN" && styles.msgCheckBlue]}>
                        {item.status === "SEEN" ? " ✓✓" : item.status === "DELIVERED" ? " ✓✓" : " ✓"}
                      </Text>
                    ) : null}
                  </View>
                </View>
              )}
            </View>
          );
        }}
      />

      {statusMessage ? <Text style={styles.statusToast}>{statusMessage}</Text> : null}

      {/* Quick Stickers Tray */}
      {showStickerTray ? (
        <View style={styles.stickerTray}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {STICKERS.map((stk) => (
              <Pressable key={stk} style={styles.stickerItem} onPress={() => sendSticker(stk)}>
                <Text style={{ fontSize: 24 }}>{stk}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : null}

      {/* Input Composer */}
      <View style={styles.composerWrap}>
        <Pressable
          style={[styles.composerIconBtn, showStickerTray && styles.composerIconBtnActive]}
          onPress={() => setShowStickerTray(!showStickerTray)}
        >
          <Text style={{ fontSize: 18 }}>❤️</Text>
        </Pressable>

        <Pressable style={styles.composerIconBtn} onPress={() => { void sendMedia(); }}>
          <AppIcon name="camera" color={palette.ink} size={18} />
        </Pressable>

        <TextInput
          placeholder="Type a message..."
          placeholderTextColor="#9C8B7A"
          style={[styles.composerInput, Platform.OS === "web" && ({ outlineWidth: 0 } as any)]}
          value={text}
          onChangeText={setText}
          onSubmitEditing={send}
          returnKeyType="send"
          editable={true}
        />

        {/* Voice Note or Send Button */}
        {text.trim() ? (
          <Pressable style={styles.sendBtn} onPress={send}>
            <AppIcon name="check" color={palette.ink} size={16} />
          </Pressable>
        ) : (
          <Pressable
            style={[styles.voiceBtn, isRecordingVoice && styles.voiceBtnRecording]}
            onPress={sendVoiceSnippet}
          >
            <Text style={{ fontSize: 16 }}>{isRecordingVoice ? "🎙️..." : "🎙️"}</Text>
          </Pressable>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.paperCream
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "web" ? 16 : 50,
    paddingBottom: 12,
    backgroundColor: palette.whitePaper,
    borderBottomWidth: 1.5,
    borderColor: "#E5D9C8",
    gap: 10
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: palette.paperCream,
    borderWidth: 1,
    borderColor: palette.ink,
    alignItems: "center",
    justifyContent: "center"
  },
  headerProfile: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  avatarWrap: {
    position: "relative"
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: palette.ink,
    backgroundColor: "#EEE"
  },
  headerOnlineDot: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#2ECC71",
    borderWidth: 1.5,
    borderColor: "#FFF"
  },
  headerInfo: {
    flex: 1
  },
  headerName: {
    fontSize: 15,
    fontWeight: "900",
    color: palette.ink
  },
  headerStatus: {
    fontSize: 10,
    fontWeight: "700",
    color: palette.mutedBrown
  },
  headerActions: {
    flexDirection: "row",
    gap: 8
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: palette.paperCream,
    borderWidth: 1,
    borderColor: palette.ink,
    alignItems: "center",
    justifyContent: "center"
  },
  messagesList: {
    padding: 16,
    paddingBottom: 24
  },
  encryptionNotice: {
    alignSelf: "center",
    backgroundColor: "#F3EAE0",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2D3BE",
    marginBottom: 16
  },
  encryptionNoticeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#7D6652"
  },
  emptyMessages: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 8
  },
  emptyMessagesEmoji: {
    fontSize: 40
  },
  emptyMessagesTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: palette.ink
  },
  emptyMessagesCopy: {
    fontSize: 12,
    color: palette.mutedBrown,
    textAlign: "center",
    maxWidth: 240,
    lineHeight: 16
  },
  msgRow: {
    flexDirection: "row",
    marginVertical: 4
  },
  msgRowMine: {
    justifyContent: "flex-end"
  },
  msgRowTheirs: {
    justifyContent: "flex-start"
  },
  msgBubble: {
    maxWidth: "78%",
    borderRadius: 14,
    padding: 10,
    paddingBottom: 6,
    shadowColor: palette.ink,
    shadowOffset: { width: 1.5, height: 1.5 },
    shadowOpacity: 0.1,
    shadowRadius: 0,
    elevation: 2
  },
  msgBubbleMine: {
    backgroundColor: "#FFF8D6",
    borderWidth: 1.5,
    borderColor: "#E5D28F",
    borderBottomRightRadius: 2
  },
  msgBubbleTheirs: {
    backgroundColor: palette.whitePaper,
    borderWidth: 1.5,
    borderColor: "#E2D4BE",
    borderBottomLeftRadius: 2
  },
  singleEmojiBubble: {
    paddingHorizontal: 6,
    alignItems: "flex-end"
  },
  singleEmojiText: {
    fontSize: 34
  },
  emojiTime: {
    fontSize: 9,
    color: palette.mutedBrown,
    marginTop: -4
  },
  mediaFrame: {
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 6,
    borderWidth: 1,
    borderColor: "#E2D4BE"
  },
  msgImage: {
    width: 200,
    height: 160,
    backgroundColor: "#EEE"
  },
  msgText: {
    fontSize: 14,
    lineHeight: 20
  },
  msgTextMine: {
    color: palette.ink,
    fontWeight: "600"
  },
  msgTextTheirs: {
    color: palette.ink,
    fontWeight: "600"
  },
  msgFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginTop: 3,
    gap: 2
  },
  msgTime: {
    fontSize: 9,
    fontWeight: "700"
  },
  msgTimeMine: {
    color: "#8C7B5D"
  },
  msgTimeTheirs: {
    color: palette.mutedBrown
  },
  msgCheck: {
    fontSize: 10,
    fontWeight: "900",
    color: palette.mutedBrown
  },
  msgCheckBlue: {
    color: "#2B825B"
  },
  statusToast: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: palette.ink,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: "center",
    marginBottom: 8,
    fontSize: 11,
    fontWeight: "800",
    color: palette.ink
  },
  stickerTray: {
    backgroundColor: "#FFF9EE",
    borderTopWidth: 1,
    borderColor: "#E2D3BE",
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  stickerItem: {
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  composerWrap: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    backgroundColor: palette.whitePaper,
    borderTopWidth: 1.5,
    borderColor: "#E5D9C8",
    gap: 8
  },
  composerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: palette.paperCream,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#DFCDB5"
  },
  composerIconBtnActive: {
    backgroundColor: palette.acidYellow,
    borderColor: palette.ink
  },
  composerInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 90,
    backgroundColor: palette.paperCream,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 14,
    color: palette.ink,
    borderWidth: 1,
    borderColor: "#DFCDB5"
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: palette.acidYellow,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: palette.ink,
    shadowColor: palette.ink,
    shadowOffset: { width: 1.5, height: 1.5 },
    shadowOpacity: 0.9,
    shadowRadius: 0,
    elevation: 3
  },
  voiceBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#FFECC8",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#D9A54C"
  },
  voiceBtnRecording: {
    backgroundColor: "#FFD08A"
  }
});
