import type { PropsWithChildren } from "react";
import { StyleSheet, View } from "react-native";
import { palette } from "@frames/ui";

export function PaperBackground({ children }: PropsWithChildren) {
  return (
    <View style={styles.container}>
      <View style={styles.surface}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.paperCream,
    alignItems: "center"
  },
  surface: {
    flex: 1,
    width: "100%",
    maxWidth: 430,
    backgroundColor: palette.paperCream
  }
});
