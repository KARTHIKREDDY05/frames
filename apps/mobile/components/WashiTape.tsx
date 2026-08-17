import { StyleSheet, View } from "react-native";
import { palette } from "@frames/ui";

export function WashiTape() {
  return <View style={styles.tape} />;
}

const styles = StyleSheet.create({
  tape: { position: "absolute", top: -12, left: "36%", width: 112, height: 28, backgroundColor: palette.sunshine, opacity: 0.86, zIndex: 2 }
});
