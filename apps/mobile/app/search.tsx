import Feather from "@expo/vector-icons/Feather";
import { StyleSheet, TextInput, View } from "react-native";
import { palette } from "@frames/ui";

export default function SearchArchive() {
  return (
    <View style={styles.container}>
      <View style={styles.search}><Feather name="search" color={palette.mutedBrown} size={20} /><TextInput placeholder="Date, caption, location, month, year" style={styles.input} /></View>
    </View>
  );
}

const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: palette.paperCream, padding: 22, paddingTop: 58 }, search: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: palette.whitePaper, borderRadius: 8, paddingHorizontal: 14 }, input: { flex: 1, height: 54 } });
