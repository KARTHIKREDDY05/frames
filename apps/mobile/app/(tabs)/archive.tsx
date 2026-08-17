import { Link } from "expo-router";
import { SectionList, StyleSheet, Text, View } from "react-native";
import { palette } from "@frames/ui";
import { PaperBackground } from "../../components/PaperBackground";
import { useAppStore } from "../../store/appStore";

export default function ArchiveTimeline() {
  const dailyFrames = useAppStore((state) => state.dailyFrames);
  return (
    <PaperBackground>
      <SectionList
        contentContainerStyle={styles.content}
        sections={[{ title: "AUGUST 2026", data: dailyFrames }]}
        keyExtractor={(item) => item.id}
        renderSectionHeader={({ section }) => <Text style={styles.section}>{section.title}</Text>}
        renderItem={({ item }) => (
          <Link href={`/daily/${item.date}`} style={styles.row}>
            <View>
              <Text style={styles.day}>{item.date.slice(8, 10)} AUG</Text>
              <Text style={styles.weekday}>{item.subtitle}</Text>
            </View>
            <Text style={styles.count}>{item.posts.length} Frames</Text>
          </Link>
        )}
      />
    </PaperBackground>
  );
}

const styles = StyleSheet.create({
  content: { padding: 22, paddingBottom: 110 },
  section: { fontSize: 15, color: palette.mutedBrown, fontWeight: "900", marginVertical: 18 },
  row: { padding: 18, marginBottom: 10, backgroundColor: palette.whitePaper, borderRadius: 8, borderWidth: 1, borderColor: "#E4D9CA" },
  day: { fontSize: 24, color: palette.ink, fontWeight: "900" },
  weekday: { color: palette.mutedBrown, marginTop: 4 },
  count: { color: palette.ink, fontWeight: "800", marginTop: 8 }
});
