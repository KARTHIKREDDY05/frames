import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View, type StyleProp, type ViewStyle } from "react-native";
import type { FrameStyle, PhotoFilter, Privacy } from "@frames/types";
import { palette } from "@frames/ui";
import { AppIcon } from "../components/AppIcon";
import { FrameButton } from "../components/FrameButton";
import { ImageCropperModal, type CropRatio } from "../components/ImageCropperModal";
import { frameTemplateOptions, photoFilterOptions, PolaroidFrame, MAGNET_STAMP_OPTIONS } from "../components/PolaroidFrame";
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
  const [magnetStamp, setMagnetStamp] = useState<string | null>("cherry");
  const [profileFeatured, setProfileFeatured] = useState(false);
  const [message, setMessage] = useState("");
  const [posting, setPosting] = useState(false);
  const [cropperOpen, setCropperOpen] = useState(false);
  const [currentRatio, setCurrentRatio] = useState<CropRatio>("1:1");

  const mediaUrl = pendingMediaUrl;

  const suggestCaption = () => {
    const ideas = [
      "A small moment I wanted to keep.",
      "Today looked better through this Frame.",
      "One ordinary second, saved.",
      "Proof that today had a little magic.",
      "Framed memory • Unfiltered life.",
      "Just another chapter worth remembering."
    ];
    setCaption(ideas[Math.floor(Math.random() * ideas.length)] ?? ideas[0]!);
  };

  const handleApplyCrop = (croppedUri: string, meta: { ratio: CropRatio }) => {
    setCropperOpen(false);
    setCurrentRatio(meta.ratio);
    setPendingMediaUrl(croppedUri);
    setMessage(`Cropped to ${meta.ratio === "1:1" ? "Square (1:1)" : meta.ratio === "4:5" ? "Portrait (4:5)" : "Story (9:16)"}.`);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {/* Header Bar */}
      <View style={styles.topHeader}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <AppIcon name="arrow-left" color={palette.ink} size={18} />
        </Pressable>
        <Text style={styles.title}>Frame the Moment</Text>
        {mediaUrl ? (
          <Pressable style={styles.cropActionBtn} onPress={() => setCropperOpen(true)}>
            <AppIcon name="spark" color={palette.ink} size={16} />
            <Text style={styles.cropActionText}>Crop & Ratio</Text>
          </Pressable>
        ) : <View style={{ width: 36 }} />}
      </View>

      {/* Main Polaroid Frame Preview */}
      {mediaUrl ? (
        <View style={styles.frameWrapper}>
          <PolaroidFrame
            imageUrl={mediaUrl}
            caption={caption || "Fresh from today"}
            frameStyle={frameStyle}
            filterPreset={filterPreset}
            magnetStamp={magnetStamp}
          />
        </View>
      ) : (
        <View style={styles.noMedia}>
          <AppIcon name="camera" color={palette.ink} size={32} />
          <Text style={styles.noMediaTitle}>No media selected</Text>
          <Text style={styles.noMediaCopy}>Capture a photo or choose from your gallery before posting a Frame.</Text>
          <FrameButton icon="camera" label="Open Camera" onPress={() => router.replace("/(tabs)/camera")} />
        </View>
      )}

      {/* Magnetic Stamps & Fridge Pins Carousel */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Magnetic Stamps & Pins</Text>
        <Text style={styles.sectionSubtitle}>Pin to Polaroid</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.choices}>
        {MAGNET_STAMP_OPTIONS.map((option) => (
          <Pressable
            key={option.label}
            onPress={() => setMagnetStamp(option.value)}
            style={[styles.magnetChoiceCard, magnetStamp === option.value && styles.choiceActive]}
          >
            <Text style={{ fontSize: 24 }}>{option.icon}</Text>
            <Text numberOfLines={1} style={[styles.choiceLabel, magnetStamp === option.value && styles.choiceLabelActive]}>
              {option.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Frame Styles Carousel */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Physical Frame Styles</Text>
        <Text style={styles.sectionSubtitle}>{frameTemplateOptions.length} styles</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.choices}>
        {frameTemplateOptions.map((option) => (
          <Pressable
            key={option.value}
            onPress={() => setFrameStyle(option.value)}
            style={[styles.choiceCard, frameStyle === option.value && styles.choiceActive]}
          >
            <View style={[styles.choicePreview, previewStyleByFrame[option.value]]}>
              <View style={styles.choicePhoto} />
            </View>
            <Text numberOfLines={1} style={[styles.choiceLabel, frameStyle === option.value && styles.choiceLabelActive]}>
              {option.label}
            </Text>
            <Text numberOfLines={1} style={[styles.choiceGroup, frameStyle === option.value && styles.choiceLabelActive]}>
              {option.group}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Photo Filters Carousel */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Filter Lenses</Text>
        <Text style={styles.sectionSubtitle}>Analog Vibes</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.choices}>
        {photoFilterOptions.map((option) => (
          <Pressable
            key={option.value}
            onPress={() => setFilterPreset(option.value)}
            style={[styles.filterCard, filterPreset === option.value && styles.choiceActive]}
          >
            <View
              style={[
                styles.filterPreview,
                {
                  backgroundColor: option.tint === "transparent" ? palette.softPeach : option.tint,
                  opacity: option.value === "ORIGINAL" ? 1 : 0.88
                }
              ]}
            />
            <Text numberOfLines={1} style={[styles.choiceLabel, filterPreset === option.value && styles.choiceLabelActive]}>
              {option.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>


      {/* Caption & Assistant */}
      <View style={styles.card}>
        <View style={styles.captionHeader}>
          <Text style={styles.cardTitle}>Caption & Story Note</Text>
          <Pressable style={styles.aiBtn} onPress={suggestCaption}>
            <AppIcon name="spark" color={palette.ink} size={14} />
            <Text style={styles.aiBtnText}>AI Suggest</Text>
          </Pressable>
        </View>
        <TextInput
          style={styles.input}
          placeholder="Write a memory or note..."
          placeholderTextColor={palette.mutedBrown}
          value={caption}
          onChangeText={setCaption}
          maxLength={120}
        />
      </View>

      {/* Location Metadata */}
      <View style={styles.card}>
        <View style={styles.locationHeader}>
          <AppIcon name="public" color={palette.ink} size={16} />
          <Text style={styles.cardTitle}>Location Stamp</Text>
        </View>
        <Text style={styles.locationCopy}>
          {pendingCaptureMeta?.locationName ? `📍 ${pendingCaptureMeta.locationName}` : "Location off or unavailable for this Frame."}
        </Text>
      </View>

      {/* Privacy Selector */}
      <PrivacySelector value={privacy} onChange={setPrivacy} />

      {/* Keep on Profile Switch */}
      <View style={styles.featuredCard}>
        <View style={styles.featuredMeta}>
          <Text style={styles.featuredTitle}>Keep on Profile (Permanent)</Text>
          <Text style={styles.featuredCopy}>Preserve this Frame permanently in your profile Frames Box after the 24h feed expires.</Text>
        </View>
        <Switch
          value={profileFeatured}
          onValueChange={setProfileFeatured}
          thumbColor={palette.whitePaper}
          trackColor={{ false: "#E4D9CA", true: palette.ink }}
        />
      </View>

      {message ? <Text style={styles.statusToast}>{message}</Text> : null}

      {/* Submit Button */}
      <FrameButton
        icon="send"
        label={posting ? "Publishing Frame..." : "Share Frame"}
        disabled={!mediaUrl || posting}
        onPress={() => {
          if (!mediaUrl || posting) return;
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
        }}
      />

      {/* Image Cropper Modal */}
      <ImageCropperModal
        visible={cropperOpen}
        imageUri={mediaUrl}
        shape="rect"
        initialRatio={currentRatio}
        title="Crop Frame Ratio"
        onCancel={() => setCropperOpen(false)}
        onConfirm={handleApplyCrop}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.paperCream },
  content: { padding: 16, paddingTop: 52, paddingBottom: 100, gap: 14 },
  topHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  backBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 1.5, borderColor: palette.ink, backgroundColor: palette.whitePaper, alignItems: "center", justifyContent: "center", shadowColor: palette.ink, shadowOffset: { width: 2, height: 2 }, shadowOpacity: 0.8, shadowRadius: 0 },
  title: { fontSize: 20, fontWeight: "900", color: palette.ink, letterSpacing: -0.3 },
  cropActionBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: palette.acidYellow, borderWidth: 1.5, borderColor: palette.ink, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, shadowColor: palette.ink, shadowOffset: { width: 2, height: 2 }, shadowOpacity: 0.8, shadowRadius: 0 },
  cropActionText: { fontSize: 11, fontWeight: "900", color: palette.ink },
  frameWrapper: { alignItems: "center", marginVertical: 4 },
  card: { backgroundColor: palette.whitePaper, borderWidth: 1.5, borderColor: palette.ink, borderRadius: 8, padding: 14, gap: 8, shadowColor: palette.ink, shadowOffset: { width: 3, height: 3 }, shadowOpacity: 0.85, shadowRadius: 0 },
  cardTitle: { fontSize: 14, fontWeight: "900", color: palette.ink },
  captionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  aiBtn: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: palette.softLavender, borderWidth: 1, borderColor: palette.ink, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  aiBtnText: { fontSize: 10, fontWeight: "900", color: palette.ink },
  input: { height: 44, backgroundColor: palette.paperCream, borderRadius: 6, paddingHorizontal: 12, borderWidth: 1.5, borderColor: palette.ink, fontSize: 13, color: palette.ink, fontWeight: "600" },
  sectionHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4 },
  sectionTitle: { color: palette.ink, fontSize: 14, fontWeight: "900", textTransform: "uppercase", letterSpacing: 0.5 },
  sectionSubtitle: { color: palette.mutedBrown, fontSize: 11, fontWeight: "800" },
  choices: { gap: 8, paddingRight: 10 },
  choiceCard: { width: 110, backgroundColor: palette.whitePaper, borderRadius: 8, borderWidth: 1.5, borderColor: palette.ink, padding: 8, gap: 4, shadowColor: palette.ink, shadowOffset: { width: 2, height: 2 }, shadowOpacity: 0.8, shadowRadius: 0 },
  choiceActive: { backgroundColor: palette.acidYellow },
  choicePreview: { height: 60, borderRadius: 4, backgroundColor: palette.whitePaper, borderWidth: 1, borderColor: palette.ink, alignItems: "center", justifyContent: "center", padding: 4 },
  choicePhoto: { width: "70%", aspectRatio: 1, borderRadius: 2, backgroundColor: palette.softPeach },
  choiceLabel: { color: palette.ink, fontWeight: "900", fontSize: 11 },
  choiceGroup: { color: palette.mutedBrown, fontWeight: "800", fontSize: 9 },
  choiceLabelActive: { color: palette.ink },
  filterCard: { width: 88, backgroundColor: palette.whitePaper, borderRadius: 8, borderWidth: 1.5, borderColor: palette.ink, padding: 8, gap: 4, shadowColor: palette.ink, shadowOffset: { width: 2, height: 2 }, shadowOpacity: 0.8, shadowRadius: 0 },
  magnetChoiceCard: { width: 78, backgroundColor: palette.whitePaper, borderRadius: 8, borderWidth: 1.5, borderColor: palette.ink, padding: 8, gap: 4, alignItems: "center", justifyContent: "center", shadowColor: palette.ink, shadowOffset: { width: 2, height: 2 }, shadowOpacity: 0.8, shadowRadius: 0 },
  filterPreview: { height: 48, borderRadius: 4, borderWidth: 1, borderColor: palette.ink },
  preview_FILMSTRIP: { backgroundColor: "#181415", borderColor: "#181415" },
  preview_NEGATIVE_STRIP: { backgroundColor: "#0D0F13", borderColor: "#0D0F13" },
  preview_CONTACT_SHEET: { backgroundColor: "#211B1C", borderColor: "#211B1C" },
  preview_CINEMA: { backgroundColor: "#111111", borderColor: "#111111" },
  preview_TORN_PAPER: { borderStyle: "dashed", transform: [{ rotate: "-2deg" }] },
  preview_STICKER: { borderRadius: 14 },
  preview_WASHI_COLLAGE: { backgroundColor: "#FFF8EC" },
  preview_NOTEBOOK: { borderColor: palette.powderBlue },
  preview_POSTCARD: { backgroundColor: "#FBF1DA", borderColor: "#C6A77D" },
  preview_VINTAGE: { backgroundColor: "#F1DFC6", borderColor: "#B9966F" },
  preview_STAMP: { borderStyle: "dashed", backgroundColor: "#F8F0DA" },
  preview_MINIMAL: { backgroundColor: "transparent", borderColor: "transparent" },
  noMedia: { backgroundColor: palette.whitePaper, borderRadius: 8, borderWidth: 1.5, borderColor: palette.ink, padding: 24, gap: 10, alignItems: "center", shadowColor: palette.ink, shadowOffset: { width: 3, height: 3 }, shadowOpacity: 0.85, shadowRadius: 0 },
  noMediaTitle: { color: palette.ink, fontSize: 18, fontWeight: "900" },
  noMediaCopy: { color: palette.mutedBrown, fontSize: 13, textAlign: "center", lineHeight: 18 },
  locationHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  locationCopy: { color: palette.mutedBrown, fontSize: 12, fontWeight: "700" },
  featuredCard: { backgroundColor: palette.whitePaper, borderRadius: 8, borderWidth: 1.5, borderColor: palette.ink, padding: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, shadowColor: palette.ink, shadowOffset: { width: 3, height: 3 }, shadowOpacity: 0.85, shadowRadius: 0 },
  featuredMeta: { flex: 1 },
  featuredTitle: { color: palette.ink, fontWeight: "900", fontSize: 13 },
  featuredCopy: { color: palette.mutedBrown, fontSize: 11, lineHeight: 15, marginTop: 2 },
  statusToast: { color: palette.ink, backgroundColor: palette.softLavender, borderWidth: 1.5, borderColor: palette.ink, borderRadius: 6, padding: 10, fontWeight: "800", fontSize: 12, textAlign: "center" }
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
