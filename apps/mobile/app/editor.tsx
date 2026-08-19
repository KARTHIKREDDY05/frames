import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View, type StyleProp, type ViewStyle } from "react-native";
import type { FrameStyle, PhotoFilter, Privacy } from "@frames/types";
import { palette } from "@frames/ui";
import { FrameButton } from "../components/FrameButton";
import { frameTemplateOptions, photoFilterOptions, PolaroidFrame } from "../components/PolaroidFrame";
import { PrivacySelector } from "../components/PrivacySelector";
import { createRemotePost } from "../services/supabase";
import { useAppStore } from "../store/appStore";

export default function FrameEditor() {
  const mergePosts = useAppStore((state) => state.mergePosts);
  const pendingMediaUrl = useAppStore((state) => state.pendingMediaUrl);
  const pendingCaptureMeta = useAppStore((state) => state.pendingCaptureMeta);
  const setPendingMediaUrl = useAppStore((state) => state.setPendingMediaUrl);
  const setPendingCaptureMeta = useAppStore((state) => state.setPendingCaptureMeta);
  const [caption, setCaption] = useState("");
  const [privacy, setPrivacy] = useState<Privacy>("FRIENDS");
  const [frameStyle, setFrameStyle] = useState<FrameStyle>("POLAROID");
  const [filterPreset, setFilterPreset] = useState<PhotoFilter>(pendingCaptureMeta?.filterPreset ?? "ORIGINAL");
  const [profileFeatured, setProfileFeatured] = useState(false);
  const [message, setMessage] = useState("");
  const [posting, setPosting] = useState(false);
  const mediaUrl = pendingMediaUrl;
  const suggestCaption = () => {
    const ideas = [
      "A small moment I wanted to keep.",
      "Today looked better through this Frame.",
      "One ordinary second, saved.",
      "Proof that the day had a little magic."
    ];
    setCaption(ideas[Math.floor(Math.random() * ideas.length)] ?? ideas[0]!);
  };
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Frame the moment</Text>
      {mediaUrl ? (
        <PolaroidFrame imageUrl={mediaUrl} caption={caption || "Fresh from today"} frameStyle={frameStyle} filterPreset={filterPreset} />
      ) : (
        <View style={styles.noMedia}>
          <Text style={styles.noMediaTitle}>No media selected</Text>
          <Text style={styles.noMediaCopy}>Capture a photo or choose from your gallery before posting a Frame.</Text>
          <FrameButton icon="camera" label="Open Camera" onPress={() => router.replace("/(tabs)/camera")} />
        </View>
      )}
      <View style={styles.templateHeader}>
        <Text style={styles.sectionTitle}>Frame templates</Text>
        <Text style={styles.templateCount}>{frameTemplateOptions.length} styles</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.choices}>
        {frameTemplateOptions.map((option) => (
          <Pressable key={option.value} onPress={() => setFrameStyle(option.value)} style={[styles.choiceCard, frameStyle === option.value && styles.choiceActive]}>
            <View style={[styles.choicePreview, previewStyleByFrame[option.value]]}>
              <View style={styles.choicePhoto} />
            </View>
            <Text numberOfLines={1} style={[styles.choiceLabel, frameStyle === option.value && styles.choiceLabelActive]}>{option.label}</Text>
            <Text numberOfLines={1} style={[styles.choiceGroup, frameStyle === option.value && styles.choiceLabelActive]}>{option.group}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <View style={styles.templateHeader}>
        <Text style={styles.sectionTitle}>Photo filters</Text>
        <Text style={styles.templateCount}>saved with Frame</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.choices}>
        {photoFilterOptions.map((option) => (
          <Pressable key={option.value} onPress={() => setFilterPreset(option.value)} style={[styles.filterCard, filterPreset === option.value && styles.choiceActive]}>
            <View style={[styles.filterPreview, { backgroundColor: option.tint === "transparent" ? palette.softPeach : option.tint, opacity: option.value === "ORIGINAL" ? 1 : 0.88 }]} />
            <Text numberOfLines={1} style={[styles.choiceLabel, filterPreset === option.value && styles.choiceLabelActive]}>{option.label}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <TextInput style={styles.input} placeholder="Add a caption" value={caption} onChangeText={setCaption} />
      <View style={styles.locationCard}>
        <Text style={styles.locationTitle}>Location</Text>
        <Text style={styles.locationCopy}>
          {pendingCaptureMeta?.locationName ? `Saved from capture: ${pendingCaptureMeta.locationName}` : "Location off or unavailable for this Frame."}
        </Text>
      </View>
      <FrameButton icon="spark" label="AI Caption Assist" variant="secondary" onPress={suggestCaption} />
      <PrivacySelector value={privacy} onChange={setPrivacy} />

      <View style={styles.featuredCard}>
        <View style={styles.featuredMeta}>
          <Text style={styles.featuredTitle}>Keep on Profile</Text>
          <Text style={styles.featuredCopy}>Keep this Frame permanently on your profile grid after the 24-hour feed expires.</Text>
        </View>
        <Switch
          value={profileFeatured}
          onValueChange={setProfileFeatured}
          thumbColor={palette.whitePaper}
          trackColor={{ false: "#E4D9CA", true: palette.ink }}
        />
      </View>

      {message ? <Text style={styles.message}>{message}</Text> : null}
      <FrameButton icon="send" label={posting ? "Posting..." : "Post Frame"} onPress={() => {
        if (!mediaUrl) return;
        if (posting) return;
        setPosting(true);
        setMessage("");
        void createRemotePost({
          caption,
          privacy,
          frameStyle,
          mediaUrl,
          filterPreset,
          profileFeatured,
          locationName: pendingCaptureMeta?.locationName,
          latitude: pendingCaptureMeta?.latitude,
          longitude: pendingCaptureMeta?.longitude
        }).then(({ post, error }) => {
          if (post) {
            mergePosts([post]);
            setPendingMediaUrl(null);
            setPendingCaptureMeta(null);
            router.replace(privacy === "PUBLIC" ? "/(tabs)/feed" : "/(tabs)/home");
            return;
          }
          setMessage(error?.message ? `Could not publish: ${error.message}` : "Could not publish. Supabase did not return the post.");
        }).finally(() => setPosting(false));
      }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.paperCream, padding: 22, paddingTop: 58, gap: 16 },
  content: { gap: 16, paddingBottom: 120 },
  title: { fontSize: 30, fontWeight: "900", color: palette.ink },
  templateHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionTitle: { color: palette.ink, fontSize: 19, fontWeight: "900" },
  templateCount: { color: palette.mutedBrown, fontSize: 12, fontWeight: "900" },
  choices: { gap: 10, paddingRight: 18 },
  choiceCard: { width: 116, backgroundColor: palette.whitePaper, borderRadius: 8, borderWidth: 1, borderColor: "#E4D9CA", padding: 10, gap: 7 },
  choiceActive: { backgroundColor: palette.ink, borderColor: palette.ink },
  choicePreview: { height: 78, borderRadius: 6, backgroundColor: palette.whitePaper, borderWidth: 1, borderColor: "#E4D9CA", alignItems: "center", justifyContent: "center", padding: 8 },
  choicePhoto: { width: "72%", aspectRatio: 1, borderRadius: 3, backgroundColor: palette.softPeach },
  choiceLabel: { color: palette.ink, fontWeight: "900", fontSize: 13 },
  choiceGroup: { color: palette.mutedBrown, fontWeight: "800", fontSize: 11 },
  choiceLabelActive: { color: palette.whitePaper },
  filterCard: { width: 92, backgroundColor: palette.whitePaper, borderRadius: 8, borderWidth: 1, borderColor: "#E4D9CA", padding: 10, gap: 7 },
  filterPreview: { height: 54, borderRadius: 7, borderWidth: 1, borderColor: "#E4D9CA" },
  preview_FILMSTRIP: { backgroundColor: "#181415", borderColor: "#181415" },
  preview_NEGATIVE_STRIP: { backgroundColor: "#0D0F13", borderColor: "#0D0F13" },
  preview_CONTACT_SHEET: { backgroundColor: "#211B1C", borderColor: "#211B1C" },
  preview_CINEMA: { backgroundColor: "#111111", borderColor: "#111111" },
  preview_TORN_PAPER: { borderStyle: "dashed", transform: [{ rotate: "-2deg" }] },
  preview_STICKER: { borderRadius: 18 },
  preview_WASHI_COLLAGE: { backgroundColor: "#FFF8EC" },
  preview_NOTEBOOK: { borderColor: palette.powderBlue },
  preview_POSTCARD: { backgroundColor: "#FBF1DA", borderColor: "#C6A77D" },
  preview_VINTAGE: { backgroundColor: "#F1DFC6", borderColor: "#B9966F" },
  preview_STAMP: { borderStyle: "dashed", backgroundColor: "#F8F0DA" },
  preview_MINIMAL: { backgroundColor: "transparent", borderColor: "transparent" },
  noMedia: { backgroundColor: palette.whitePaper, borderRadius: 8, borderWidth: 1, borderColor: "#E4D9CA", padding: 18, gap: 12 },
  noMediaTitle: { color: palette.ink, fontSize: 22, fontWeight: "900" },
  noMediaCopy: { color: palette.mutedBrown, fontSize: 15, lineHeight: 22 },
  input: { height: 54, backgroundColor: palette.whitePaper, borderRadius: 8, paddingHorizontal: 14, borderWidth: 1, borderColor: "#E4D9CA" },
  locationCard: { backgroundColor: palette.whitePaper, borderRadius: 8, borderWidth: 1, borderColor: "#E4D9CA", padding: 12, gap: 4 },
  locationTitle: { color: palette.ink, fontWeight: "900" },
  locationCopy: { color: palette.mutedBrown, lineHeight: 20, fontWeight: "700" },
  featuredCard: { backgroundColor: palette.whitePaper, borderRadius: 8, borderWidth: 1, borderColor: "#E4D9CA", padding: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  featuredMeta: { flex: 1 },
  featuredTitle: { color: palette.ink, fontWeight: "900", fontSize: 14 },
  featuredCopy: { color: palette.mutedBrown, fontSize: 11, lineHeight: 16, marginTop: 2 },
  message: { color: palette.ink, backgroundColor: "#F8E7B2", borderRadius: 8, padding: 12, fontWeight: "800", lineHeight: 20 }
});

const previewStyleByFrame: Partial<Record<FrameStyle, StyleProp<ViewStyle>>> = {
  FILMSTRIP: styles.preview_FILMSTRIP,
  NEGATIVE_STRIP: styles.preview_NEGATIVE_STRIP,
  CONTACT_SHEET: styles.preview_CONTACT_SHEET,
  CINEMA: styles.preview_CINEMA,
  TORN_PAPER: styles.preview_TORN_PAPER,
  STICKER: styles.preview_STICKER,
  WASHI_COLLAGE: styles.preview_WASHI_COLLAGE,
  NOTEBOOK: styles.preview_NOTEBOOK,
  POSTCARD: styles.preview_POSTCARD,
  VINTAGE: styles.preview_VINTAGE,
  STAMP: styles.preview_STAMP,
  MINIMAL: styles.preview_MINIMAL
};
