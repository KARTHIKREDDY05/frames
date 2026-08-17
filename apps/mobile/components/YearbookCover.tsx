import { ImageBackground, StyleSheet, Text, View } from "react-native";
import type { YearbookDto } from "@frames/types";
import { palette } from "@frames/ui";

export function YearbookCover({ yearbook }: { yearbook: YearbookDto }) {
  return (
    <View style={styles.book}>
      <ImageBackground source={{ uri: yearbook.coverUrl ?? undefined }} style={styles.cover} imageStyle={styles.image}>
        <Text style={styles.year}>{yearbook.year}</Text>
        <Text style={styles.title}>{yearbook.title}</Text>
        <Text style={styles.copy}>365 days. One story.</Text>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  book: { backgroundColor: palette.ink, borderRadius: 8, padding: 10 },
  cover: { height: 300, justifyContent: "space-between", padding: 22 },
  image: { borderRadius: 4, opacity: 0.72 },
  year: { color: palette.whitePaper, fontSize: 42, fontWeight: "900" },
  title: { color: palette.whitePaper, fontSize: 28, fontWeight: "900" },
  copy: { color: palette.sunshine, fontSize: 16, fontWeight: "800" }
});
