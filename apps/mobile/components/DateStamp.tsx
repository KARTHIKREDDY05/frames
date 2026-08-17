import { StyleSheet, Text } from "react-native";
import { palette } from "@frames/ui";

export function DateStamp({ value }: { value: string }) {
  return <Text style={styles.stamp}>{value}</Text>;
}

const styles = StyleSheet.create({
  stamp: { alignSelf: "flex-start", borderWidth: 1, borderColor: palette.ink, color: palette.ink, paddingHorizontal: 8, paddingVertical: 4, fontSize: 12, fontWeight: "900", transform: [{ rotate: "-2deg" }] }
});
