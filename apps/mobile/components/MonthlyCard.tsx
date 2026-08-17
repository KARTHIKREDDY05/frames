import { ImageBackground, StyleSheet, Text, View } from "react-native";
import type { MonthlyCollageDto } from "@frames/types";
import { palette } from "@frames/ui";

export function MonthlyCard({ collage }: { collage: MonthlyCollageDto }) {
  return (
    <View style={styles.card}>
      <ImageBackground source={{ uri: collage.coverUrl ?? undefined }} style={styles.cover} imageStyle={styles.coverImage}>
        <Text style={styles.title}>{collage.title}</Text>
        <Text style={styles.year}>{collage.year}</Text>
      </ImageBackground>
      <Text style={styles.stats}>{String(collage.metadata.frames)} Frames - {String(collage.metadata.places)} Places - {String(collage.metadata.friends)} Friends</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: palette.whitePaper, borderRadius: 8, borderWidth: 1, borderColor: "#E4D9CA", padding: 12 },
  cover: { height: 230, justifyContent: "flex-end", padding: 18, overflow: "hidden" },
  coverImage: { borderRadius: 6 },
  title: { color: palette.whitePaper, fontSize: 30, fontWeight: "900" },
  year: { color: palette.whitePaper, fontSize: 18, fontWeight: "800" },
  stats: { marginTop: 12, color: palette.ink, fontWeight: "900" }
});
