import { Link, router } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { palette } from "@frames/ui";
import { FrameButton } from "../components/FrameButton";
import { PaperBackground } from "../components/PaperBackground";
import { createVerifiedEmailAccount, ensureUserProfile, shouldShowOAuthProvider, signInWithOAuthProvider, supabase } from "../services/supabase";
import { useAppStore } from "../store/appStore";

const oauthProviders = [
  { id: "google" as const, label: "Continue with Google", icon: "google" as const },
  { id: "github" as const, label: "Continue with GitHub", icon: "github" as const }
];

export default function Register() {
  const setCurrentUser = useAppStore((state) => state.setCurrentUser);
  const completeIntro = useAppStore((state) => state.completeIntro);
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const createAccount = async () => {
    setError("");
    setStatus("");
    if (!email.trim() || !password || !username.trim()) {
      setError("Email, password, and username are required.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setSubmitting(true);
    const { error: signUpError } = await createVerifiedEmailAccount({ displayName, email, password, username });
    setSubmitting(false);
    if (signUpError) {
      setError(signUpError.message);
      return;
    }
    setStatus("Verification email sent. Confirm your email before signing in.");
    completeIntro();
  };

  const startOAuth = async (provider: "google" | "github") => {
    setError("");
    setSubmitting(true);
    const { error: authError } = await signInWithOAuthProvider(provider);
    setSubmitting(false);
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
        <Text style={styles.title}>Start your scrapbook</Text>
        <TextInput placeholder="Display name" style={styles.input} value={displayName} onChangeText={setDisplayName} />
        <TextInput placeholder="Email" style={styles.input} value={email} onChangeText={setEmail} autoCapitalize="none" />
        <TextInput placeholder="Username - required" style={styles.input} value={username} onChangeText={setUsername} autoCapitalize="none" />
        <TextInput placeholder="Password - required, 8+ characters" style={styles.input} value={password} onChangeText={setPassword} secureTextEntry />
        <Text style={styles.help}>Email verification is mandatory. Username is required and can be changed once every 90 days. Bio, avatar, and privacy can be completed later from Profile.</Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {status ? <Text style={styles.status}>{status}</Text> : null}
        <FrameButton icon="check" label={submitting ? "Sending..." : "Create Verified Account"} onPress={() => { void createAccount(); }} />
        {oauthProviders.filter((provider) => shouldShowOAuthProvider(provider.id)).map((provider) => (
          <FrameButton
            key={provider.id}
            icon={provider.icon}
            label={provider.label}
            variant="secondary"
            onPress={() => { void startOAuth(provider.id); }}
          />
        ))}
        <Text style={styles.accountPrompt}>Already a user?</Text>
        <Link href="/login" style={styles.link}>Log in</Link>
      </View>
    </PaperBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 28, justifyContent: "center", gap: 14 },
  title: { fontSize: 34, fontWeight: "900", color: palette.ink, marginBottom: 12 },
  input: { height: 54, backgroundColor: palette.whitePaper, borderRadius: 8, paddingHorizontal: 16, borderWidth: 1, borderColor: "#E4D9CA" },
  help: { color: palette.mutedBrown, lineHeight: 20 },
  accountPrompt: { color: palette.mutedBrown, textAlign: "center", fontWeight: "800", marginTop: 8 },
  link: { color: palette.ink, textAlign: "center", fontWeight: "900" },
  status: { color: "#276749", fontWeight: "800", backgroundColor: "#E6F4EA", borderRadius: 8, padding: 12 },
  error: { color: "#9B2C2C", fontWeight: "800" }
});
