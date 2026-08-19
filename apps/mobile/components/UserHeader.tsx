import { StyleSheet, Text, View } from "react-native";
import type { UserDto } from "@frames/types";
import { palette } from "@frames/ui";
import { Avatar } from "./Avatar";

export function UserHeader({ user, meta }: { user: UserDto; meta: string }) {
  return (
    <View style={styles.row}>
      <Avatar uri={user.avatarUrl} />
      <View style={styles.textWrap}>
        <Text numberOfLines={1} style={styles.name}>{user.displayName}</Text>
        <Text numberOfLines={1} ellipsizeMode="tail" style={styles.meta}>@{user.username} • {meta}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1, minWidth: 0 },
  textWrap: { flex: 1, minWidth: 0 },
  name: { color: palette.ink, fontWeight: "900", fontSize: 15 },
  meta: { color: palette.mutedBrown, fontSize: 11, fontWeight: "700", marginTop: 2 }
});
