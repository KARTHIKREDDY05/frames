import { Link, router } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { palette } from "@frames/ui";
import { FrameButton } from "../components/FrameButton";
import { PaperBackground } from "../components/PaperBackground";
import { useAppStore } from "../store/appStore";

export default function Login() {
  const signIn = useAppStore((state) => state.signIn);
  const signInDemo = useAppStore((state) => state.signInDemo);
  const [email, setEmail] = useState("arjun@frames.local");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState("");
  return (
    <PaperBackground>
      <View style={styles.container}>
        <Text style={styles.title}>Welcome back</Text>
        <TextInput placeholder="Email" style={styles.input} value={email} onChangeText={setEmail} autoCapitalize="none" />
        <TextInput placeholder="Password" style={styles.input} value={password} onChangeText={setPassword} secureTextEntry />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <FrameButton label="Sign In" onPress={() => {
          if (!signIn(email, password)) {
            setError("No matching local account. Try the demo account or create one.");
            return;
          }
          router.replace("/(tabs)/home");
        }} />
        <FrameButton label="Use Demo Account" variant="secondary" onPress={() => { signInDemo(); router.replace("/(tabs)/home"); }} />
        <Link href="/register" style={styles.link}>Create an account</Link>
      </View>
    </PaperBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 28, justifyContent: "center", gap: 14 },
  title: { fontSize: 34, fontWeight: "900", color: palette.ink, marginBottom: 12 },
  input: { height: 54, backgroundColor: palette.whitePaper, borderRadius: 8, paddingHorizontal: 16, borderWidth: 1, borderColor: "#E4D9CA" },
  link: { color: palette.ink, textAlign: "center", fontWeight: "700", marginTop: 12 },
  error: { color: "#9B2C2C", fontWeight: "800" }
});
