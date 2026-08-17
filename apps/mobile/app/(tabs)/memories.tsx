import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { palette } from "@frames/ui";
import { useAppStore } from "../../store/appStore";

export default function MemoriesScreen() {
  const [mode, setMode] = useState<"monthly" | "yearly">("monthly");
  const dailyFrames = useAppStore((state) => state.dailyFrames);
  const totalFrames = dailyFrames.reduce((sum, frame) => sum + frame.posts.length, 0);
  const monthly = useMemo(() => {
    const groups = new Map<string, number>();
    dailyFrames.forEach((frame) => {
      const date = new Date(`${frame.date}T00:00:00`);
      const label = date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
      groups.set(label, (groups.get(label) ?? 0) + frame.posts.length);
    });
    return Array.from(groups.entries()).map(([label, count]) => ({ label, count }));
  }, [dailyFrames]);
  const yearly = useMemo(() => {
    const groups = new Map<string, number>();
    dailyFrames.forEach((frame) => {
      const label = frame.date.slice(0, 4);
      groups.set(label, (groups.get(label) ?? 0) + frame.posts.length);
    });
    return Array.from(groups.entries()).map(([label, count]) => ({ label, count }));
  }, [dailyFrames]);
  const items = mode === "monthly" ? monthly : yearly;
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Memories</Text>
      <View style={styles.tabs}>
        <Pressable onPress={() => setMode("monthly")} style={[styles.tabButton, mode === "monthly" && styles.activeButton]}><Text style={[styles.tabText, mode === "monthly" && styles.activeText]}>Monthly</Text></Pressable>
        <Pressable onPress={() => setMode("yearly")} style={[styles.tabButton, mode === "yearly" && styles.activeButton]}><Text style={[styles.tabText, mode === "yearly" && styles.activeText]}>Yearly</Text></Pressable>
      </View>
      {dailyFrames.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No generated memories yet.</Text>
          <Text style={styles.emptyCopy}>Post a Frame, then use the archive simulation or wait for the backend worker to generate memory cards.</Text>
        </View>
      ) : (
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Current Memories</Text>
          <Text style={styles.summaryStat}>{dailyFrames.length} Daily Cards</Text>
          <Text style={styles.summaryStat}>{totalFrames} Archived Frames</Text>
        </View>
      )}
      {items.map((item) => (
        <View key={item.label} style={styles.memoryRow}>
          <Text style={styles.memoryLabel}>{item.label}</Text>
          <Text style={styles.memoryCount}>{item.count} Frames</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.paperCream },
  content: { padding: 22, paddingTop: 58, paddingBottom: 110, gap: 16 },
  title: { fontSize: 34, fontWeight: "900", color: palette.ink },
  tabs: { flexDirection: "row", gap: 10 },
  tabButton: { backgroundColor: palette.whitePaper, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: "#E4D9CA" },
  activeButton: { backgroundColor: palette.ink, borderColor: palette.ink },
  tabText: { color: palette.ink, fontWeight: "800" },
  activeText: { color: palette.whitePaper },
  emptyCard: { backgroundColor: palette.whitePaper, borderRadius: 8, borderWidth: 1, borderColor: "#E4D9CA", padding: 18, gap: 8 },
  emptyTitle: { color: palette.ink, fontSize: 22, fontWeight: "900" },
  emptyCopy: { color: palette.mutedBrown, fontSize: 16, lineHeight: 23 },
  summaryCard: { backgroundColor: palette.whitePaper, borderRadius: 8, borderWidth: 1, borderColor: "#E4D9CA", padding: 18, gap: 8 },
  summaryTitle: { color: palette.ink, fontSize: 22, fontWeight: "900" },
  summaryStat: { color: palette.mutedBrown, fontWeight: "800" },
  memoryRow: { minHeight: 64, backgroundColor: palette.whitePaper, borderRadius: 8, borderWidth: 1, borderColor: "#E4D9CA", padding: 14, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  memoryLabel: { color: palette.ink, fontWeight: "900" },
  memoryCount: { color: palette.mutedBrown, fontWeight: "800" }
});
