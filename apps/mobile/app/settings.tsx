import { useState } from "react";
import { ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { palette } from "@frames/ui";
import type { Privacy } from "@frames/types";
import { FrameButton } from "../components/FrameButton";
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
  const completedFields = [displayName, email, username, bio, avatarUrl, defaultPrivacy].filter(Boolean).length;
  const profilePercent = Math.round((completedFields / 6) * 100);
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Settings</Text>
      <View style={styles.completion}>
        <Text style={styles.label}>Profile {profilePercent}% complete</Text>
        <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${profilePercent}%` }]} /></View>
      </View>
      <TextInput placeholder="Display name" style={styles.input} value={displayName} onChangeText={setDisplayName} />
      <TextInput placeholder="Email" style={styles.input} value={email} onChangeText={setEmail} autoCapitalize="none" />
      <TextInput placeholder="Username" style={styles.input} value={username} onChangeText={setUsername} autoCapitalize="none" />
      <TextInput placeholder="Bio" style={[styles.input, styles.bio]} value={bio} onChangeText={setBio} multiline />
      <TextInput placeholder="Avatar URL" style={styles.input} value={avatarUrl} onChangeText={setAvatarUrl} autoCapitalize="none" />
      <View style={styles.row}><Text style={styles.label}>Default Post Privacy</Text><Switch value={defaultPrivacy === "PUBLIC"} onValueChange={(value) => setDefaultPrivacy(value ? "PUBLIC" : "FRIENDS")} /></View>
      <View style={styles.row}><Text style={styles.label}>Location Optional</Text><Switch value /></View>
      <FrameButton label="Save Profile" onPress={() => updateProfile({ displayName, username, email, bio, avatarUrl, defaultPrivacy })} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.paperCream },
  content: { padding: 22, paddingTop: 58, paddingBottom: 110, gap: 12 },
  title: { fontSize: 32, fontWeight: "900", color: palette.ink },
  completion: { backgroundColor: palette.whitePaper, borderRadius: 8, borderWidth: 1, borderColor: "#E4D9CA", padding: 16, gap: 8 },
  progressTrack: { height: 8, borderRadius: 4, backgroundColor: "#E4D9CA", overflow: "hidden" },
  progressFill: { height: 8, borderRadius: 4, backgroundColor: palette.sunshine },
  input: { minHeight: 54, backgroundColor: palette.whitePaper, borderRadius: 8, paddingHorizontal: 16, borderWidth: 1, borderColor: "#E4D9CA", color: palette.ink },
  bio: { minHeight: 92, paddingTop: 14, textAlignVertical: "top" },
  row: { minHeight: 58, backgroundColor: palette.whitePaper, borderRadius: 8, padding: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  label: { color: palette.ink, fontWeight: "800" }
});
