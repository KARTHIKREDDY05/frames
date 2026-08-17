import { StyleSheet, Text, View } from "react-native";
import { palette } from "@frames/ui";

export default function Notifications() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Notifications</Text>
      <Text style={styles.item}>Your daily Frame is ready</Text>
      <Text style={styles.item}>Maya reacted to your Frame.</Text>
    </View>
  );
}

const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: palette.paperCream, padding: 22, paddingTop: 58, gap: 12 }, title: { fontSize: 32, fontWeight: "900", color: palette.ink }, item: { backgroundColor: palette.whitePaper, padding: 16, borderRadius: 8, color: palette.ink } });
