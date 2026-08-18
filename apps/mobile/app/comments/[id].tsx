import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { FlatList, StyleSheet, Text, TextInput, View } from "react-native";
import { palette } from "@frames/ui";
import { FrameButton } from "../../components/FrameButton";
import { createRemoteComment } from "../../services/supabase";
import { useAppStore } from "../../store/appStore";

export default function Comments() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const postId = Array.isArray(id) ? id[0] : id;
  const [text, setText] = useState("");
  const comments = useAppStore((state) => state.comments.filter((comment) => comment.postId === postId));
  const post = useAppStore((state) => state.posts.find((item) => item.id === postId));
  const currentUser = useAppStore((state) => state.currentUser);
  const commentOnPost = useAppStore((state) => state.commentOnPost);
  const mergeComments = useAppStore((state) => state.mergeComments);
  const [message, setMessage] = useState("");
  const sortedComments = [...comments].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const submit = async () => {
    if (!postId || !text.trim()) return;
    setMessage("");
    if (post) {
      const result = await createRemoteComment(post, text);
      if (result.comment && currentUser) {
        mergeComments([{ id: result.comment.id, postId, user: currentUser, text, createdAt: result.comment.createdAt }]);
        setText("");
        return;
      } else if (result.error) {
        setMessage(result.error.message);
      }
    }
    commentOnPost(postId, text);
    setText("");
  };
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Comments</Text>
      <FlatList
        data={sortedComments}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={styles.empty}>No comments yet.</Text>}
        renderItem={({ item }) => <Text style={styles.comment}>{item.user.displayName}: {item.text}</Text>}
      />
      {message ? <Text style={styles.message}>{message}</Text> : null}
      <TextInput style={styles.input} placeholder="Write a comment" value={text} onChangeText={setText} />
      <FrameButton icon="comment" label="Post Comment" onPress={() => { void submit(); }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.paperCream, padding: 22, paddingTop: 58, gap: 12 },
  title: { fontSize: 32, fontWeight: "900", color: palette.ink },
  comment: { backgroundColor: palette.whitePaper, padding: 14, borderRadius: 8, color: palette.ink },
  empty: { color: palette.mutedBrown, paddingVertical: 20 },
  message: { color: palette.ink, backgroundColor: "#F8E7B2", padding: 12, borderRadius: 8, fontWeight: "800" },
  input: { height: 54, backgroundColor: palette.whitePaper, borderRadius: 8, paddingHorizontal: 14 }
});
