import { Link, router } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { palette } from "@frames/ui";
import { FrameButton } from "../components/FrameButton";
import { PaperBackground } from "../components/PaperBackground";
import { ensureUserProfile, shouldShowOAuthProvider, signInWithOAuthProvider, signInWithVerifiedEmail, supabase } from "../services/supabase";
import { useAppStore } from "../store/appStore";

const oauthProviders = [
  { id: "google" as const, label: "Continue with Google", icon: "google" as const },
  { id: "github" as const, label: "Continue with GitHub", icon: "github" as const }
];

export default function Login() {
  const setCurrentUser = useAppStore((state) => state.setCurrentUser);
  const completeIntro = useAppStore((state) => state.completeIntro);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const login = async () => {
    setError("");
    if (!email.trim() || !password) {
      setError("Email and password are required.");
      return;
    }
    setLoading(true);
    const { data, error: authError } = await signInWithVerifiedEmail(email, password);
    setLoading(false);
    if (authError) {
      setError(authError.message.includes("Email not confirmed") ? "Confirm your email before signing in." : authError.message);
      return;
    }
    const authUser = data.user;
    if (authUser) {
      const { profile, error: profileError } = await ensureUserProfile(authUser);
      if (profileError) {
        setError(profileError.message);
        return;
      }
      setCurrentUser(profile);
    }
    completeIntro();
    router.replace("/(tabs)/home");
  };
  const startOAuth = async (provider: "google" | "github") => {
    setError("");
    setLoading(true);
    const { error: authError } = await signInWithOAuthProvider(provider);
    setLoading(false);
    if (authError) {
      const providerName = provider[0]!.toUpperCase() + provider.slice(1);
      setError(authError.message.toLowerCase().includes("provider")
        ? `${providerName} OAuth is not enabled in Supabase yet. Enable ${providerName} in Supabase Auth Providers.`
        : authError.message);
      return;
    }
    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData?.session?.user) {
      const { profile } = await ensureUserProfile(sessionData.session.user);
      if (profile) setCurrentUser(profile);
      completeIntro();
      router.replace("/(tabs)/home");
    }
  };
  return (
    <PaperBackground>
      <View style={styles.container}>
        <Text style={styles.title}>Welcome back</Text>
        <TextInput placeholder="Email" style={styles.input} value={email} onChangeText={setEmail} autoCapitalize="none" />
        <TextInput placeholder="Password" style={styles.input} value={password} onChangeText={setPassword} secureTextEntry />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <FrameButton icon="check" label={loading ? "Signing In..." : "Sign In"} onPress={() => { void login(); }} />
        {oauthProviders.filter((provider) => shouldShowOAuthProvider(provider.id)).map((provider) => (
          <FrameButton
            key={provider.id}
            icon={provider.icon}
            label={provider.label}
            variant="secondary"
            onPress={() => { void startOAuth(provider.id); }}
          />
        ))}
        <Text style={styles.accountPrompt}>New to Frames?</Text>
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
  accountPrompt: { color: palette.mutedBrown, textAlign: "center", fontWeight: "800", marginTop: 8 },
  error: { color: "#9B2C2C", fontWeight: "800" }
});
