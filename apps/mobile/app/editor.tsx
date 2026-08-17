import { router } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import type { FrameStyle, Privacy } from "@frames/types";
import { palette } from "@frames/ui";
import { FrameButton } from "../components/FrameButton";
import { PolaroidFrame } from "../components/PolaroidFrame";
import { PrivacySelector } from "../components/PrivacySelector";
import { useAppStore } from "../store/appStore";

export default function FrameEditor() {
  const createPost = useAppStore((state) => state.createPost);
  const pendingMediaUrl = useAppStore((state) => state.pendingMediaUrl);
  const setPendingMediaUrl = useAppStore((state) => state.setPendingMediaUrl);
  const [caption, setCaption] = useState("");
  const [privacy, setPrivacy] = useState<Privacy>("FRIENDS");
  const [frameStyle, setFrameStyle] = useState<FrameStyle>("POLAROID");
  const frameChoices: Array<[string, FrameStyle]> = [["Polaroid", "POLAROID"], ["Filmstrip", "FILMSTRIP"], ["Torn Paper", "TORN_PAPER"], ["Sticker", "STICKER"], ["Vintage", "VINTAGE"], ["Minimal", "MINIMAL"]];
  const mediaUrl = pendingMediaUrl;
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Frame the moment</Text>
      {mediaUrl ? (
        <PolaroidFrame imageUrl={mediaUrl} caption={caption || "Fresh from today"} />
      ) : (
        <View style={styles.noMedia}>
          <Text style={styles.noMediaTitle}>No media selected</Text>
          <Text style={styles.noMediaCopy}>Capture a photo or choose from your gallery before posting a Frame.</Text>
          <FrameButton label="Open Camera" onPress={() => router.replace("/(tabs)/camera")} />
        </View>
      )}
      <View style={styles.choices}>
        {frameChoices.map(([label, value]) => <Text key={value} onPress={() => setFrameStyle(value)} style={[styles.choice, frameStyle === value && styles.choiceActive]}>{label}</Text>)}
      </View>
      <TextInput style={styles.input} placeholder="Add a caption" value={caption} onChangeText={setCaption} />
      <PrivacySelector value={privacy} onChange={setPrivacy} />
      <FrameButton label="Post Frame" onPress={() => {
        if (!mediaUrl) return;
        createPost({ caption, privacy, frameStyle, mediaUrl });
        setPendingMediaUrl(null);
        router.replace("/(tabs)/home");
      }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.paperCream, padding: 22, paddingTop: 58, gap: 16 },
  content: { gap: 16, paddingBottom: 120 },
  title: { fontSize: 30, fontWeight: "900", color: palette.ink },
  choices: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  choice: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: palette.whitePaper, borderRadius: 8, color: palette.ink, fontWeight: "700", overflow: "hidden" },
  choiceActive: { backgroundColor: palette.sunshine },
  noMedia: { backgroundColor: palette.whitePaper, borderRadius: 8, borderWidth: 1, borderColor: "#E4D9CA", padding: 18, gap: 12 },
  noMediaTitle: { color: palette.ink, fontSize: 22, fontWeight: "900" },
  noMediaCopy: { color: palette.mutedBrown, fontSize: 15, lineHeight: 22 },
  input: { height: 54, backgroundColor: palette.whitePaper, borderRadius: 8, paddingHorizontal: 14, borderWidth: 1, borderColor: "#E4D9CA" }
});
