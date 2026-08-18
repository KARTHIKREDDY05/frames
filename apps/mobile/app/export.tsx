import { StyleSheet, Text, View } from "react-native";
import { palette } from "@frames/ui";
import { FrameButton } from "../components/FrameButton";

export default function ExportModal() {
  return <View style={styles.container}><Text style={styles.title}>Export</Text><FrameButton icon="archive" label="PDF Scrapbook" /><FrameButton icon="memory" label="Video Montage" variant="secondary" /></View>;
}

const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: palette.paperCream, padding: 22, paddingTop: 58, gap: 14 }, title: { fontSize: 32, fontWeight: "900", color: palette.ink } });
