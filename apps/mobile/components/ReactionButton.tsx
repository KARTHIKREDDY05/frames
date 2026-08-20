import { Pressable, StyleSheet, Text, View } from "react-native";
import { palette } from "@frames/ui";
import { AppIcon } from "./AppIcon";

export function ReactionButton({
  reactions,
  comments,
  liked,
  onReact,
  onComment,
  onShare
}: {
  reactions: number;
  comments: number;
  liked?: boolean;
  onReact?: () => void;
  onComment?: () => void;
  onShare?: () => void;
}) {
  return (
    <View style={styles.row}>
      <Pressable style={[styles.actionBadge, liked && styles.likedBadge]} onPress={onReact}>
        <AppIcon name="heart" color={liked ? "#B8324A" : palette.ink} size={18} />
        <Text style={[styles.label, liked && styles.likedLabel]}>{reactions} {reactions === 1 ? "Like" : "Likes"}</Text>
      </Pressable>

      <Pressable style={styles.actionBadge} onPress={onComment}>
        <AppIcon name="comment" color={palette.ink} size={18} />
        <Text style={styles.label}>{comments} {comments === 1 ? "Comment" : "Comments"}</Text>
      </Pressable>

      <Pressable style={styles.shareBadge} onPress={onShare}>
        <AppIcon name="send" color={palette.ink} size={16} />
        <Text style={styles.shareLabel}>Share</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 10
  },
  actionBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: palette.whitePaper,
    borderWidth: 1.5,
    borderColor: palette.ink,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5
  },
  likedBadge: {
    backgroundColor: "rgba(230, 57, 70, 0.12)",
    borderColor: "#B8324A"
  },
  label: {
    fontSize: 11,
    fontWeight: "900",
    color: palette.ink
  },
  likedLabel: {
    color: "#B8324A"
  },
  shareBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: palette.acidYellow,
    borderWidth: 1.5,
    borderColor: palette.ink,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginLeft: "auto"
  },
  shareLabel: {
    fontSize: 11,
    fontWeight: "900",
    color: palette.ink
  }
});
