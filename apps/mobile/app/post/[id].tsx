import { useLocalSearchParams } from "expo-router";
import { ScrollView, StyleSheet } from "react-native";
import { palette } from "@frames/ui";
import { FrameCard } from "../../components/FrameCard";
import { useAppStore } from "../../store/appStore";

export default function PostDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const posts = useAppStore((state) => state.posts);
  const post = posts.find((item) => item.id === id) ?? posts[0];
  if (!post) return null;
  return <ScrollView style={styles.container} contentContainerStyle={styles.content}><FrameCard post={post} /></ScrollView>;
}

const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: palette.paperCream }, content: { padding: 18, paddingTop: 58 } });
