import { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { Image, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { palette } from "@frames/ui";
import type { Privacy, ProfileVisibility } from "@frames/types";
import { AppIcon } from "../components/AppIcon";
import { FrameButton } from "../components/FrameButton";
import { ImageCropperModal } from "../components/ImageCropperModal";
import { updateMyProfile } from "../services/supabase";
import { useAppStore } from "../store/appStore";

const USERNAME_COOLDOWN_MS = 30 * 24 * 60 * 60 * 1000;

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
  const [cropperVisible, setCropperVisible] = useState(false);
  const [rawPickedUri, setRawPickedUri] = useState<string | null>(null);

  const bioSuggestions = [
    "Away, leave a message",
    "Living in the moment",
    "Collecting everyday memories",
    "Frames daily scrapbooker",
    "Your life, framed automatically",
    "Exploring & capturing"
  ];

  // Calculate username change availability
  const lastUsernameUpdate = currentUser?.usernameUpdatedAt ? new Date(currentUser.usernameUpdatedAt).getTime() : 0;
  const timeSinceUpdate = Date.now() - lastUsernameUpdate;
  const isUsernameLocked = lastUsernameUpdate > 0 && timeSinceUpdate < USERNAME_COOLDOWN_MS;
  const daysRemaining = Math.ceil((USERNAME_COOLDOWN_MS - timeSinceUpdate) / (24 * 60 * 60 * 1000));

  const pickAvatar = async () => {
    try {
      if (Platform.OS !== "web") {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          setMessage("Photo permission is needed to change your profile picture.");
          return;
        }
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.95
      });
      if (!result.canceled && result.assets[0]?.uri) {
        setRawPickedUri(result.assets[0].uri);
        setCropperVisible(true);
      }
    } catch {
      // Handled
    }
  };

  const handleCroppedAvatar = (croppedUri: string) => {
    setCropperVisible(false);
    setAvatarUrl(croppedUri);
    setMessage("Profile picture framed. Tap Save Settings to update.");
  };

  const save = async () => {
    // 1. Validate Mandatory Display Name
    const cleanName = displayName.trim();
    if (!cleanName || cleanName.length < 2) {
      setMessage("Display Name is required (minimum 2 characters).");
      return;
    }

    // 2. Validate Mandatory Username
    const cleanUsername = username.trim().toLowerCase();
    if (!cleanUsername) {
      setMessage("Username is required.");
      return;
    }
    if (!/^[a-z0-9_]{3,30}$/.test(cleanUsername)) {
      setMessage("Username must be 3-30 characters and use only letters, numbers, and underscores.");
      return;
    }

    // 3. Validate Mandatory Email
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setMessage("A valid email address is required.");
      return;
    }

    setSaving(true);
    setMessage("");

    const result = updateProfile({
      displayName: cleanName,
      username: cleanUsername,
      email: cleanEmail,
      bio,
      avatarUrl,
      defaultPrivacy,
      profileVisibility
    });

    if (!result.ok) {
      setMessage(result.message ?? "Profile could not be saved.");
      setSaving(false);
      return;
    }

    const remote = await updateMyProfile({
      displayName: cleanName,
      username: cleanUsername,
      email: cleanEmail,
      bio,
      avatarUrl,
      defaultPrivacy,
      profileVisibility
    });

    setSaving(false);
    if (remote.error) {
      setMessage(remote.error.message.includes("duplicate") || remote.error.message.includes("unique") ? "That username is already taken by another user." : remote.error.message);
      return;
    }
    if (remote.profile) updateProfile(remote.profile);
    router.replace("/(tabs)/profile");
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <AppIcon name="arrow-left" color={palette.ink} size={18} />
        </Pressable>
        <Text style={styles.title}>Settings</Text>
        <View style={{ width: 36 }} />
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

      {/* Basic Profile Details - Mandatory & Validated */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Identity & Verification</Text>

        <View style={styles.fieldHeader}>
          <Text style={styles.fieldLabel}>Display Name</Text>
          <Text style={styles.requiredTag}>* Required</Text>
        </View>
        <TextInput
          placeholder="Display Name (e.g. Alex Rivera)"
          placeholderTextColor={palette.mutedBrown}
          style={styles.input}
          value={displayName}
          onChangeText={setDisplayName}
          maxLength={40}
        />

        <View style={styles.fieldHeader}>
          <Text style={styles.fieldLabel}>Username (Unique Primary Handle)</Text>
          <Text style={styles.requiredTag}>* Required</Text>
        </View>
        <TextInput
          placeholder="username"
          placeholderTextColor={palette.mutedBrown}
          style={[styles.input, isUsernameLocked && styles.inputLocked]}
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          maxLength={30}
          editable={!isUsernameLocked || username === currentUser?.username}
        />
        <View style={styles.cooldownWrap}>
          {isUsernameLocked && username !== currentUser?.username ? (
            <Text style={styles.cooldownLockedText}>
              🔒 Username locked. Cooldown active for {daysRemaining} more day{daysRemaining === 1 ? "" : "s"}.
            </Text>
          ) : (
            <Text style={styles.cooldownHelpText}>
              ⓘ Usernames are unique primary handles and can only be changed once per month (30 days).
            </Text>
          )}
        </View>

        <View style={styles.fieldHeader}>
          <Text style={styles.fieldLabel}>Email Address</Text>
          <Text style={styles.requiredTag}>* Required</Text>
        </View>
        <TextInput
          placeholder="email@example.com"
          placeholderTextColor={palette.mutedBrown}
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
      </View>

      {/* About & Bio Status */}
      <View style={styles.card}>
        <Pressable style={styles.aboutHeader} onPress={() => setAboutOpen((v) => !v)}>
          <View style={styles.aboutTitleRow}>
            <AppIcon name="spark" color={palette.ink} size={16} />
            <Text style={styles.cardTitle}>Bio & Chat Status</Text>
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

      {/* Save Action */}
      {message ? <Text style={styles.message}>{message}</Text> : null}

      <FrameButton
        icon="check"
        label={saving ? "Saving Changes..." : "Save Settings"}
        disabled={saving}
        onPress={() => { void save(); }}
      />

      <ImageCropperModal
        visible={cropperVisible}
        imageUri={rawPickedUri}
        shape="circle"
        initialRatio="1:1"
        title="Crop & Frame Avatar"
        onCancel={() => setCropperVisible(false)}
        onConfirm={handleCroppedAvatar}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.paperCream },
  content: { padding: 16, paddingTop: 52, paddingBottom: 60, gap: 14 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  backBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 1.5, borderColor: palette.ink, backgroundColor: palette.whitePaper, alignItems: "center", justifyContent: "center", shadowColor: palette.ink, shadowOffset: { width: 2, height: 2 }, shadowOpacity: 0.8, shadowRadius: 0 },
  title: { fontSize: 24, fontWeight: "900", color: palette.ink, letterSpacing: -0.5 },
  avatarCard: { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: palette.whitePaper, borderWidth: 1.5, borderColor: palette.ink, borderRadius: 8, padding: 14, shadowColor: palette.ink, shadowOffset: { width: 3, height: 3 }, shadowOpacity: 0.85, shadowRadius: 0 },
  avatar: { width: 64, height: 64, borderRadius: 32, borderWidth: 1.5, borderColor: palette.ink, backgroundColor: palette.softPeach },
  avatarMeta: { flex: 1, gap: 3 },
  avatarTitle: { fontSize: 16, fontWeight: "900", color: palette.ink },
  avatarHandle: { fontSize: 12, fontWeight: "700", color: palette.mutedBrown },
  changePhotoBtn: { alignSelf: "flex-start", backgroundColor: palette.acidYellow, borderWidth: 1.5, borderColor: palette.ink, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4, marginTop: 4 },
  changePhotoText: { fontSize: 10, fontWeight: "900", color: palette.ink },
  card: { backgroundColor: palette.whitePaper, borderWidth: 1.5, borderColor: palette.ink, borderRadius: 8, padding: 16, gap: 10, shadowColor: palette.ink, shadowOffset: { width: 3, height: 3 }, shadowOpacity: 0.85, shadowRadius: 0 },
  cardTitle: { fontSize: 15, fontWeight: "900", color: palette.ink, letterSpacing: -0.2 },
  fieldHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 },
  fieldLabel: { fontSize: 12, fontWeight: "900", color: palette.ink },
  requiredTag: { fontSize: 9, fontWeight: "900", color: "#B8324A", letterSpacing: 0.5 },
  input: { backgroundColor: palette.paperCream, borderWidth: 1.5, borderColor: palette.ink, borderRadius: 6, paddingHorizontal: 12, height: 42, fontSize: 13, color: palette.ink, fontWeight: "600" },
  inputLocked: { backgroundColor: "#ECE7DE", opacity: 0.8 },
  cooldownWrap: { marginTop: -4 },
  cooldownHelpText: { fontSize: 10, color: palette.mutedBrown, fontWeight: "600", lineHeight: 14 },
  cooldownLockedText: { fontSize: 10, color: "#B8324A", fontWeight: "800", lineHeight: 14 },
  aboutHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  aboutTitleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  aboutToggleText: { fontSize: 12, fontWeight: "900", color: palette.ink },
  currentBioText: { fontSize: 12, color: palette.mutedBrown, fontStyle: "italic", lineHeight: 16 },
  aboutEditor: { gap: 8, marginTop: 6 },
  bioInput: { backgroundColor: palette.paperCream, borderWidth: 1.5, borderColor: palette.ink, borderRadius: 6, padding: 10, height: 64, fontSize: 12, color: palette.ink, textAlignVertical: "top", fontWeight: "600" },
  suggestionTitle: { fontSize: 11, fontWeight: "900", color: palette.ink },
  suggestions: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  suggestionTag: { backgroundColor: palette.softLavender, borderWidth: 1, borderColor: palette.ink, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  suggestionText: { fontSize: 10, fontWeight: "700", color: palette.ink },
  settingRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10, paddingVertical: 4 },
  settingMeta: { flex: 1 },
  settingLabel: { fontSize: 13, fontWeight: "900", color: palette.ink },
  settingDescription: { fontSize: 11, color: palette.mutedBrown, fontWeight: "600", marginTop: 2, lineHeight: 15 },
  message: { color: "#B8324A", fontSize: 12, fontWeight: "800", textAlign: "center" }
});
