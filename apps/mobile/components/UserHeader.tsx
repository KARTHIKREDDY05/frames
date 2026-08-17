import { StyleSheet, Text, View } from "react-native";
import type { UserDto } from "@frames/types";
import { palette } from "@frames/ui";
import { Avatar } from "./Avatar";

export function UserHeader({ user, meta }: { user: UserDto; meta: string }) {
  return (
    <View style={styles.row}>
      <Avatar uri={user.avatarUrl} />
      <View>
        <Text style={styles.name}>{user.displayName}</Text>
        <Text style={styles.meta}>@{user.username} - {meta}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  name: { color: palette.ink, fontWeight: "900", fontSize: 16 },
  meta: { color: palette.mutedBrown, marginTop: 2 }
});
