import { useState } from "react";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { Image, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { palette } from "@frames/ui";
import type { Privacy, ProfileVisibility } from "@frames/types";
import { AppIcon } from "../components/AppIcon";
import { FrameButton } from "../components/FrameButton";
import { updateMyProfile } from "../services/supabase";
import { useAppStore } from "../store/appStore";

export default function Settings() {
  const currentUser = useAppStore((state) => state.currentUser);
  const updateProfile = useAppStore((state) => state.updateProfile);
  const [displayName, setDisplayName] = useState(currentUser?.displayName ?? "");
  const [username, setUsername] = useState(currentUser?.username ?? "");
  const [email, setEmail] = useState(currentUser?.email ?? "");
  const [bio, setBio] = useState(currentUser?.bio ?? "");
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatarUrl ?? "");
  const [defaultPrivacy, setDefaultPrivacy] = useState<Privacy>(currentUser?.defaultPrivacy ?? "FRIENDS");
  const [profileVisibility, setProfileVisibility] = useState<ProfileVisibility>(currentUser?.profileVisibility ?? "PUBLIC");
  const [aboutOpen, setAboutOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [draftAvatarUri, setDraftAvatarUri] = useState<string | null>(null);
  const [draftAvatarSize, setDraftAvatarSize] = useState<256 | 512 | 1024>(512);
  const [cropAnchor, setCropAnchor] = useState<"top" | "center" | "bottom">("center");
  const completedFields = [displayName, email, username, bio, avatarUrl, defaultPrivacy, profileVisibility].filter(Boolean).length;
  const profilePercent = Math.round((completedFields / 7) * 100);
  const usernameLastChanged = currentUser?.usernameUpdatedAt ? new Date(currentUser.usernameUpdatedAt) : null;
  const usernameLocked = Boolean(usernameLastChanged && Date.now() - usernameLastChanged.getTime() < 90 * 24 * 60 * 60 * 1000);
  const usernameUnlockDate = usernameLastChanged ? new Date(usernameLastChanged.getTime() + 90 * 24 * 60 * 60 * 1000).toLocaleDateString() : null;
  const bioSuggestions = [
    "Away, leave a message",
    "Sleeping",
    "At work",
    "Travelling",
    "Collecting everyday moments",
    "Your life, framed automatically"
  ];

  const pickAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setMessage("Photo permission is needed to change your profile picture.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.92 });
    if (!result.canceled && result.assets[0]?.uri) {
      setDraftAvatarUri(result.assets[0].uri);
      setMessage("Preview your crop, choose a size, then apply the profile photo.");
    }
  };

  const applyAvatarCrop = async () => {
    if (!draftAvatarUri) return;
    const info = await new Promise<{ width: number; height: number }>((resolve, reject) => {
      Image.getSize(draftAvatarUri, (width, height) => resolve({ width, height }), reject);
    });
    const side = Math.min(info.width, info.height);
    const originX = Math.max(0, Math.round((info.width - side) / 2));
    const originY = cropAnchor === "top" ? 0 : cropAnchor === "bottom" ? Math.max(0, info.height - side) : Math.max(0, Math.round((info.height - side) / 2));
    const result = await ImageManipulator.manipulateAsync(
      draftAvatarUri,
      [
        { crop: { originX, originY, width: side, height: side } },
        { resize: { width: draftAvatarSize, height: draftAvatarSize } }
      ],
      { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
    );
    setAvatarUrl(result.uri);
    setDraftAvatarUri(null);
    setMessage(`Profile photo cropped to ${draftAvatarSize}x${draftAvatarSize}.`);
  };

  const save = async () => {
    if (!username.trim()) {
      setMessage("Username is required.");
      return;
    }
    const result = updateProfile({ displayName, username, email, bio, avatarUrl, defaultPrivacy, profileVisibility });
    if (!result.ok) {
      setMessage(result.message ?? "Profile could not be saved.");
      return;
    }
    const remote = await updateMyProfile({ displayName, username, email, bio, avatarUrl, defaultPrivacy, profileVisibility });
    if (remote.error) {
      setMessage(remote.error.message.includes("duplicate") ? "That username or email is already taken." : remote.error.message);
      return;
    }
    if (remote.profile) updateProfile(remote.profile);
    setMessage("Profile saved.");
    router.replace("/(tabs)/profile");
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Settings</Text>
      <View style={styles.completion}>
        <Text style={styles.label}>Profile {profilePercent}% complete</Text>
        <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${profilePercent}%` }]} /></View>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Public Profile</Text>
        <Image source={{ uri: avatarUrl || undefined }} style={styles.avatar} />
        <FrameButton icon="gallery" label="Choose Profile Photo" variant="secondary" onPress={() => { void pickAvatar(); }} />
        {draftAvatarUri ? (
          <View style={styles.cropPanel}>
            <Text style={styles.cropTitle}>Crop and Size</Text>
            <Image source={{ uri: draftAvatarUri }} style={styles.cropPreview} />
            <View style={styles.segmentRow}>
              {(["top", "center", "bottom"] as const).map((anchor) => <Text key={anchor} onPress={() => setCropAnchor(anchor)} style={[styles.segment, cropAnchor === anchor && styles.segmentActive]}>{anchor}</Text>)}
            </View>
            <View style={styles.segmentRow}>
              {([256, 512, 1024] as const).map((size) => <Text key={size} onPress={() => setDraftAvatarSize(size)} style={[styles.segment, draftAvatarSize === size && styles.segmentActive]}>{size}px</Text>)}
            </View>
            <FrameButton icon="check" label="Apply Cropped Photo" onPress={() => { void applyAvatarCrop(); }} />
          </View>
        ) : null}
      </View>
      <TextInput placeholder="Display name" style={styles.input} value={displayName} onChangeText={setDisplayName} />
      <TextInput placeholder="Email" style={styles.input} value={email} onChangeText={setEmail} autoCapitalize="none" />
      <TextInput placeholder="Username" style={[styles.input, usernameLocked && styles.inputLocked]} value={username} onChangeText={setUsername} autoCapitalize="none" editable={!usernameLocked} />
      <Text style={styles.help}>{usernameLocked ? `Username locked until ${usernameUnlockDate}.` : "Username can be changed once every 90 days."}</Text>
      <Pressable style={styles.aboutButton} onPress={() => setAboutOpen((value) => !value)}>
        <View style={styles.aboutButtonIcon}><AppIcon name="spark" color={palette.ink} size={18} /></View>
        <View style={styles.aboutButtonMeta}>
          <Text style={styles.aboutButtonTitle}>About</Text>
          <Text numberOfLines={1} style={styles.aboutButtonCopy}>{bio || "Add a short status for chats and profile visits."}</Text>
        </View>
        <Text style={styles.aboutButtonAction}>{aboutOpen ? "Close" : "Edit"}</Text>
      </Pressable>
      {aboutOpen ? (
        <View style={styles.aboutPanel}>
          <View style={styles.aboutInputWrap}>
            <AppIcon name="spark" color={palette.softPeach} size={18} />
            <TextInput
              placeholder="Write an About"
              placeholderTextColor={palette.mutedBrown}
              style={styles.aboutInput}
              value={bio}
              onChangeText={setBio}
              maxLength={90}
            />
            {bio ? (
              <Pressable accessibilityLabel="Clear About" style={styles.clearAbout} onPress={() => setBio("")}>
                <AppIcon name="delete" color={palette.mutedBrown} size={15} />
              </Pressable>
            ) : null}
          </View>
          <View style={styles.aboutControls}>
            <View style={styles.aboutChip}>
              <AppIcon name="clock" color={palette.ink} size={14} />
              <Text style={styles.aboutChipText}>Visible now</Text>
            </View>
            <View style={styles.aboutChip}>
              <AppIcon name={profileVisibility === "PUBLIC" ? "public" : "lock"} color={palette.ink} size={14} />
              <Text style={styles.aboutChipText}>{profileVisibility === "PUBLIC" ? "Profile viewers" : "Accepted friends"}</Text>
            </View>
          </View>
          <Text style={styles.suggestionsTitle}>Suggestions</Text>
          <View style={styles.suggestionGrid}>
            {bioSuggestions.map((item) => (
              <Pressable key={item} style={styles.suggestionRow} onPress={() => setBio(item)}>
                <Text style={styles.suggestionIcon}>{suggestionIcon(item)}</Text>
                <Text numberOfLines={1} style={styles.suggestionText}>{item}</Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.aboutPreview}>
            <Text style={styles.previewLabel}>Chat preview</Text>
            <View style={styles.previewCard}>
              <Image source={{ uri: avatarUrl || undefined }} style={styles.previewAvatar} />
              <View style={styles.previewMeta}>
                <Text style={styles.previewName}>{displayName || "Your name"}</Text>
                <Text numberOfLines={1} style={styles.previewBio}>{bio || "Write an About"}</Text>
              </View>
            </View>
          </View>
        </View>
      ) : null}
      <View style={styles.row}><View><Text style={styles.label}>Profile Visibility</Text><Text style={styles.help}>{profileVisibility === "PUBLIC" ? "People can find and open your profile." : "Only accepted friends can see your profile details."}</Text></View><Switch value={profileVisibility === "PUBLIC"} onValueChange={(value) => setProfileVisibility(value ? "PUBLIC" : "PRIVATE")} /></View>
      <View style={styles.row}><View><Text style={styles.label}>Default Frame Privacy</Text><Text style={styles.help}>{defaultPrivacy === "PUBLIC" ? "New Frames can appear in public feeds." : "New Frames are friends-only by default."}</Text></View><Switch value={defaultPrivacy === "PUBLIC"} onValueChange={(value) => setDefaultPrivacy(value ? "PUBLIC" : "FRIENDS")} /></View>
      <View style={styles.row}><Text style={styles.label}>Location Optional</Text><Switch value /></View>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      <FrameButton icon="check" label="Save Profile" onPress={() => { void save(); }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.paperCream },
  content: { padding: 22, paddingTop: 58, paddingBottom: 110, gap: 12 },
  title: { fontSize: 32, fontWeight: "900", color: palette.ink },
  completion: { backgroundColor: palette.whitePaper, borderRadius: 8, borderWidth: 1, borderColor: "#E4D9CA", padding: 16, gap: 8 },
  section: { backgroundColor: palette.whitePaper, borderRadius: 8, borderWidth: 1, borderColor: "#E4D9CA", padding: 16, gap: 12, alignItems: "center" },
  sectionTitle: { alignSelf: "flex-start", color: palette.ink, fontSize: 18, fontWeight: "900" },
  avatar: { width: 104, height: 104, borderRadius: 52, backgroundColor: "#E4D9CA" },
  cropPanel: { width: "100%", backgroundColor: palette.paperCream, borderRadius: 8, borderWidth: 1, borderColor: "#E4D9CA", padding: 12, gap: 10 },
  cropTitle: { color: palette.ink, fontWeight: "900" },
  cropPreview: { width: 180, height: 180, borderRadius: 90, backgroundColor: "#E4D9CA", alignSelf: "center" },
  segmentRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center" },
  segment: { minHeight: 38, borderRadius: 19, borderWidth: 1, borderColor: "#E4D9CA", backgroundColor: palette.whitePaper, color: palette.ink, fontWeight: "900", paddingHorizontal: 14, paddingVertical: 9, overflow: "hidden", textTransform: "capitalize" },
  segmentActive: { backgroundColor: palette.ink, borderColor: palette.ink, color: palette.whitePaper },
  progressTrack: { height: 8, borderRadius: 4, backgroundColor: "#E4D9CA", overflow: "hidden" },
  progressFill: { height: 8, borderRadius: 4, backgroundColor: palette.sunshine },
  input: { minHeight: 54, backgroundColor: palette.whitePaper, borderRadius: 8, paddingHorizontal: 16, borderWidth: 1, borderColor: "#E4D9CA", color: palette.ink },
  inputLocked: { color: palette.mutedBrown, backgroundColor: "#EFE7DA" },
  aboutButton: { minHeight: 72, backgroundColor: palette.whitePaper, borderRadius: 8, borderWidth: 1, borderColor: "#E4D9CA", padding: 14, flexDirection: "row", alignItems: "center", gap: 12 },
  aboutButtonIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: palette.sunshine, alignItems: "center", justifyContent: "center" },
  aboutButtonMeta: { flex: 1, gap: 3 },
  aboutButtonTitle: { color: palette.ink, fontSize: 17, fontWeight: "900" },
  aboutButtonCopy: { color: palette.mutedBrown, fontSize: 13, fontWeight: "700" },
  aboutButtonAction: { color: palette.ink, fontSize: 13, fontWeight: "900" },
  aboutPanel: { backgroundColor: "#FFF9ED", borderRadius: 8, borderWidth: 1, borderColor: "#E4D9CA", padding: 14, gap: 12 },
  aboutInputWrap: { minHeight: 56, borderRadius: 8, borderWidth: 1, borderColor: "#E4D9CA", backgroundColor: palette.whitePaper, flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 12 },
  aboutInput: { flex: 1, color: palette.ink, fontSize: 15, fontWeight: "800" },
  clearAbout: { width: 30, height: 30, borderRadius: 15, backgroundColor: "#F1E8DA", alignItems: "center", justifyContent: "center" },
  aboutControls: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  aboutChip: { minHeight: 36, borderRadius: 18, backgroundColor: "#F6E9CF", borderWidth: 1, borderColor: "#E4D9CA", paddingHorizontal: 12, flexDirection: "row", alignItems: "center", gap: 7 },
  aboutChipText: { color: palette.ink, fontSize: 12, fontWeight: "900" },
  suggestionsTitle: { color: palette.mutedBrown, fontSize: 13, fontWeight: "900", marginTop: 2 },
  suggestionGrid: { gap: 8 },
  suggestionRow: { minHeight: 42, borderRadius: 8, backgroundColor: palette.whitePaper, borderWidth: 1, borderColor: "#E4D9CA", paddingHorizontal: 12, flexDirection: "row", alignItems: "center", gap: 10 },
  suggestionIcon: { width: 34, color: palette.ink, fontSize: 11, textAlign: "center", fontWeight: "900" },
  suggestionText: { flex: 1, color: palette.ink, fontSize: 14, fontWeight: "800" },
  aboutPreview: { marginTop: 2, borderRadius: 8, backgroundColor: "#F6E9CF", padding: 12, gap: 9 },
  previewLabel: { color: palette.mutedBrown, fontSize: 12, fontWeight: "900" },
  previewCard: { minHeight: 76, borderRadius: 8, backgroundColor: palette.whitePaper, borderWidth: 1, borderColor: "#E4D9CA", padding: 11, flexDirection: "row", alignItems: "center", gap: 10 },
  previewAvatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: "#E4D9CA" },
  previewMeta: { flex: 1, gap: 4 },
  previewName: { color: palette.ink, fontSize: 15, fontWeight: "900" },
  previewBio: { color: palette.mutedBrown, fontSize: 12, fontWeight: "800" },
  row: { minHeight: 58, backgroundColor: palette.whitePaper, borderRadius: 8, padding: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  label: { color: palette.ink, fontWeight: "800" },
  help: { color: palette.mutedBrown, fontSize: 12, lineHeight: 17 },
  message: { color: palette.ink, backgroundColor: palette.whitePaper, borderRadius: 8, padding: 12, fontWeight: "800" }
});

function suggestionIcon(value: string) {
  if (value.includes("Away")) return "OOO";
  if (value.includes("Sleeping")) return "Zz";
  if (value.includes("work")) return "Job";
  if (value.includes("Travelling")) return "Go";
  if (value.includes("Collecting")) return "New";
  return "Frame";
}
