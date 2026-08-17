import { useLocalSearchParams } from "expo-router";
import { ScrollView, StyleSheet, Text } from "react-native";
import { palette } from "@frames/ui";
import { ScrapbookPage } from "../../components/ScrapbookPage";
import { useAppStore } from "../../store/appStore";

export default function DailyFrameScreen() {
  const { date } = useLocalSearchParams<{ date: string }>();
  const dailyFrames = useAppStore((state) => state.dailyFrames);
  const frame = dailyFrames.find((item) => item.date === date) ?? dailyFrames[0]!;
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{frame.title}</Text>
      <Text style={styles.subtitle}>{frame.subtitle}</Text>
      <ScrapbookPage frame={frame} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.paperCream },
  content: { padding: 22, paddingTop: 58 },
  title: { fontSize: 32, fontWeight: "900", color: palette.ink },
  subtitle: { color: palette.mutedBrown, fontSize: 17, marginBottom: 20 }
});
