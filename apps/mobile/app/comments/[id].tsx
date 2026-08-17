import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { FlatList, StyleSheet, Text, TextInput, View } from "react-native";
import { palette } from "@frames/ui";
import { FrameButton } from "../../components/FrameButton";
import { useAppStore } from "../../store/appStore";

export default function Comments() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const postId = Array.isArray(id) ? id[0] : id;
  const [text, setText] = useState("");
  const comments = useAppStore((state) => state.comments.filter((comment) => comment.postId === postId));
  const commentOnPost = useAppStore((state) => state.commentOnPost);
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Comments</Text>
      <FlatList
        data={comments}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={styles.empty}>No comments yet.</Text>}
        renderItem={({ item }) => <Text style={styles.comment}>{item.user.displayName}: {item.text}</Text>}
      />
      <TextInput style={styles.input} placeholder="Write a comment" value={text} onChangeText={setText} />
      <FrameButton label="Post Comment" onPress={() => { if (postId) commentOnPost(postId, text); setText(""); }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.paperCream, padding: 22, paddingTop: 58, gap: 12 },
  title: { fontSize: 32, fontWeight: "900", color: palette.ink },
  comment: { backgroundColor: palette.whitePaper, padding: 14, borderRadius: 8, color: palette.ink },
  empty: { color: palette.mutedBrown, paddingVertical: 20 },
  input: { height: 54, backgroundColor: palette.whitePaper, borderRadius: 8, paddingHorizontal: 14 }
});
