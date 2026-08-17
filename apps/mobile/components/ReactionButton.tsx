import Feather from "@expo/vector-icons/Feather";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { palette } from "@frames/ui";

export function ReactionButton({ reactions, comments, liked, onReact, onComment, onShare }: { reactions: number; comments: number; liked?: boolean; onReact?: () => void; onComment?: () => void; onShare?: () => void }) {
  return (
    <View style={styles.row}>
      <Pressable style={styles.action} onPress={onReact}><Feather name="heart" color={liked ? "#B8324A" : palette.ink} size={20} /><Text style={[styles.label, liked && styles.liked]}>{reactions}</Text></Pressable>
      <Pressable style={styles.action} onPress={onComment}><Feather name="message-circle" color={palette.ink} size={20} /><Text style={styles.label}>{comments}</Text></Pressable>
      <Pressable style={styles.action} onPress={onShare}><Feather name="send" color={palette.ink} size={20} /></Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 14, marginTop: 12 },
  action: { flexDirection: "row", alignItems: "center", gap: 6 },
  label: { color: palette.ink, fontWeight: "900" },
  liked: { color: "#B8324A" }
});
