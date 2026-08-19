import { useState } from "react";
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
  const [saving, setSaving] = useState(false);

  const bioSuggestions = [
    "Away, leave a message",
    "Living in the moment",
    "Collecting everyday memories",
    "Frames daily scrapbooker",
    "Your life, framed automatically",
    "Exploring & capturing"
  ];

  const pickAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setMessage("Photo permission is needed to change your profile picture.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9
    });
    if (!result.canceled && result.assets[0]?.uri) {
      setAvatarUrl(result.assets[0].uri);
      setMessage("New profile photo selected. Tap Save to apply.");
    }
  };

  const save = async () => {
    if (!username.trim()) {
      setMessage("Username is required.");
      return;
    }
    setSaving(true);
    setMessage("");
    const result = updateProfile({ displayName, username, email, bio, avatarUrl, defaultPrivacy, profileVisibility });
    if (!result.ok) {
      setMessage(result.message ?? "Profile could not be saved.");
      setSaving(false);
      return;
    }
    const remote = await updateMyProfile({ displayName, username, email, bio, avatarUrl, defaultPrivacy, profileVisibility });
    setSaving(false);
    if (remote.error) {
      setMessage(remote.error.message.includes("duplicate") ? "That username or email is already taken." : remote.error.message);
      return;
    }
    if (remote.profile) updateProfile(remote.profile);
    router.replace("/(tabs)/profile");
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <AppIcon name="arrow-left" color={palette.ink} size={20} />
        </Pressable>
        <Text style={styles.title}>Settings</Text>
        <View style={{ width: 38 }} />
      </View>

      {/* Profile Photo Section */}
      <View style={styles.avatarCard}>
        <Image source={{ uri: avatarUrl || undefined }} style={styles.avatar} />
        <View style={styles.avatarMeta}>
          <Text style={styles.avatarTitle}>{displayName || "Your Name"}</Text>
          <Text style={styles.avatarHandle}>@{username || "username"}</Text>
          <Pressable style={styles.changePhotoBtn} onPress={() => { void pickAvatar(); }}>
            <Text style={styles.changePhotoText}>Change Photo</Text>
          </Pressable>
        </View>
      </View>

      {/* Basic Profile Details */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Profile Information</Text>

        <Text style={styles.fieldLabel}>Display Name</Text>
        <TextInput placeholder="Display Name" style={styles.input} value={displayName} onChangeText={setDisplayName} />

        <Text style={styles.fieldLabel}>Username</Text>
        <TextInput placeholder="Username" style={styles.input} value={username} onChangeText={setUsername} autoCapitalize="none" />

        <Text style={styles.fieldLabel}>Email</Text>
        <TextInput placeholder="Email Address" style={styles.input} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
      </View>

      {/* About & Bio Status */}
      <View style={styles.card}>
        <Pressable style={styles.aboutHeader} onPress={() => setAboutOpen((v) => !v)}>
          <View style={styles.aboutTitleRow}>
            <AppIcon name="spark" color={palette.ink} size={18} />
            <Text style={styles.cardTitle}>About & Bio Status</Text>
          </View>
          <Text style={styles.aboutToggleText}>{aboutOpen ? "Hide" : "Edit"}</Text>
        </Pressable>

        <Text numberOfLines={2} style={styles.currentBioText}>
          {bio ? `"${bio}"` : "No status set. Add a short bio for chats and profile visits."}
        </Text>

        {aboutOpen ? (
          <View style={styles.aboutEditor}>
            <TextInput
              placeholder="What's on your mind? (Status / Bio)"
              placeholderTextColor={palette.mutedBrown}
              style={styles.bioInput}
              value={bio}
              onChangeText={setBio}
              multiline
              maxLength={140}
            />
            <Text style={styles.suggestionTitle}>Quick Presets:</Text>
            <View style={styles.suggestions}>
              {bioSuggestions.map((suggestion) => (
                <Pressable key={suggestion} style={styles.suggestionTag} onPress={() => setBio(suggestion)}>
                  <Text style={styles.suggestionText}>{suggestion}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}
      </View>

      {/* Privacy Settings */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Account Privacy</Text>

        <View style={styles.settingRow}>
          <View style={styles.settingMeta}>
            <Text style={styles.settingLabel}>Private Account</Text>
            <Text style={styles.settingDescription}>Only accepted followers can see your profile and friends-only Frames.</Text>
          </View>
          <Switch
            value={profileVisibility === "PRIVATE"}
            onValueChange={(val) => setProfileVisibility(val ? "PRIVATE" : "PUBLIC")}
            thumbColor={palette.whitePaper}
            trackColor={{ false: "#E4D9CA", true: palette.ink }}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingMeta}>
            <Text style={styles.settingLabel}>Friends Only by Default</Text>
            <Text style={styles.settingDescription}>New camera captures will default to Friends privacy.</Text>
          </View>
          <Switch
            value={defaultPrivacy === "FRIENDS"}
            onValueChange={(val) => setDefaultPrivacy(val ? "FRIENDS" : "PUBLIC")}
            thumbColor={palette.whitePaper}
            trackColor={{ false: "#E4D9CA", true: palette.ink }}
          />
        </View>
      </View>

      {/* App Info / About */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>About Frames</Text>
        <Text style={styles.appVersion}>Frames v1.0.0 • Mobile Scrapbook</Text>
        <Text style={styles.appTagline}>"Capture now, organize never, remember forever."</Text>
      </View>

      {message ? <Text style={styles.messageText}>{message}</Text> : null}

      <FrameButton icon="check" label={saving ? "Saving Changes..." : "Save Settings"} onPress={() => { void save(); }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.paperCream },
  content: { padding: 18, paddingTop: 46, paddingBottom: 110, gap: 14 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: palette.whitePaper, borderWidth: 1, borderColor: "#E4D9CA", alignItems: "center", justifyContent: "center" },
  title: { fontSize: 22, fontWeight: "900", color: palette.ink },
  avatarCard: {
    backgroundColor: palette.whitePaper,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E4D9CA",
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 16
  },
  avatar: { width: 68, height: 68, borderRadius: 34, backgroundColor: "#E4D9CA", borderWidth: 2, borderColor: palette.whitePaper },
  avatarMeta: { flex: 1, gap: 4 },
  avatarTitle: { fontSize: 18, fontWeight: "900", color: palette.ink },
  avatarHandle: { fontSize: 13, color: palette.mutedBrown, fontWeight: "700" },
  changePhotoBtn: { alignSelf: "flex-start", backgroundColor: palette.paperCream, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12, marginTop: 2 },
  changePhotoText: { fontSize: 12, fontWeight: "800", color: palette.ink },
  card: { backgroundColor: palette.whitePaper, borderRadius: 14, borderWidth: 1, borderColor: "#E4D9CA", padding: 16, gap: 10 },
  cardTitle: { fontSize: 16, fontWeight: "900", color: palette.ink },
  fieldLabel: { fontSize: 12, fontWeight: "800", color: palette.mutedBrown, marginTop: 4 },
  input: {
    height: 48,
    backgroundColor: palette.paperCream,
    borderRadius: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#E4D9CA",
    fontSize: 15,
    color: palette.ink
  },
  aboutHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  aboutTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  aboutToggleText: { fontSize: 13, fontWeight: "900", color: palette.ink },
  currentBioText: { fontSize: 13, color: palette.mutedBrown, fontStyle: "italic", lineHeight: 18 },
  aboutEditor: { gap: 8, marginTop: 4 },
  bioInput: {
    minHeight: 70,
    backgroundColor: palette.paperCream,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E4D9CA",
    fontSize: 14,
    color: palette.ink,
    textAlignVertical: "top"
  },
  suggestionTitle: { fontSize: 11, fontWeight: "800", color: palette.mutedBrown, marginTop: 4 },
  suggestions: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  suggestionTag: { backgroundColor: palette.paperCream, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, borderWidth: 1, borderColor: "#E4D9CA" },
  suggestionText: { fontSize: 11, color: palette.ink, fontWeight: "700" },
  settingRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, paddingVertical: 6 },
  settingMeta: { flex: 1 },
  settingLabel: { fontSize: 14, fontWeight: "800", color: palette.ink },
  settingDescription: { fontSize: 11, color: palette.mutedBrown, marginTop: 2, lineHeight: 16 },
  appVersion: { fontSize: 13, fontWeight: "800", color: palette.ink },
  appTagline: { fontSize: 12, color: palette.mutedBrown, fontStyle: "italic" },
  messageText: { color: "#9B2C2C", fontSize: 13, fontWeight: "800", textAlign: "center" }
});
