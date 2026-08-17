import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { palette } from "@frames/ui";
import { FrameButton } from "../components/FrameButton";
import { PaperBackground } from "../components/PaperBackground";
import { useAppStore } from "../store/appStore";

export default function Register() {
  const signUp = useAppStore((state) => state.signUp);
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  return (
    <PaperBackground>
      <View style={styles.container}>
        <Text style={styles.title}>Start your scrapbook</Text>
        <TextInput placeholder="Display name" style={styles.input} value={displayName} onChangeText={setDisplayName} />
        <TextInput placeholder="Email" style={styles.input} value={email} onChangeText={setEmail} autoCapitalize="none" />
        <TextInput placeholder="Username - optional" style={styles.input} value={username} onChangeText={setUsername} autoCapitalize="none" />
        <TextInput placeholder="Password - optional for this test build" style={styles.input} value={password} onChangeText={setPassword} secureTextEntry />
        <Text style={styles.help}>You can complete username, password, bio, avatar, and privacy later from Profile.</Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <FrameButton label="Create Account" onPress={() => {
          if (!displayName.trim() || !email.trim()) {
            setError("Name and email are required.");
            return;
          }
          signUp({ displayName, username, email, password });
          router.replace("/(tabs)/home");
        }} />
      </View>
    </PaperBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 28, justifyContent: "center", gap: 14 },
  title: { fontSize: 34, fontWeight: "900", color: palette.ink, marginBottom: 12 },
  input: { height: 54, backgroundColor: palette.whitePaper, borderRadius: 8, paddingHorizontal: 16, borderWidth: 1, borderColor: "#E4D9CA" },
  help: { color: palette.mutedBrown, lineHeight: 20 },
  error: { color: "#9B2C2C", fontWeight: "800" }
});
