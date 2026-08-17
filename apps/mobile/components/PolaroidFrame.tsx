import { Image, StyleSheet, Text, View } from "react-native";
import { palette } from "@frames/ui";
import { WashiTape } from "./WashiTape";

export function PolaroidFrame({ imageUrl, caption }: { imageUrl: string; caption?: string | null }) {
  return (
    <View style={styles.card}>
      <WashiTape />
      <Image source={{ uri: imageUrl }} style={styles.image} />
      <Text style={styles.caption}>{caption}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: palette.whitePaper, padding: 14, paddingBottom: 46, borderRadius: 8, borderWidth: 1, borderColor: "#E4D9CA", width: "100%", maxWidth: 560, alignSelf: "center" },
  image: { width: "100%", aspectRatio: 1, maxHeight: 520, borderRadius: 6, backgroundColor: palette.softPeach },
  caption: { color: palette.mutedBrown, marginTop: 12, fontSize: 15 }
});
