import { Link, router } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { palette } from "@frames/ui";
import { AppIcon } from "../components/AppIcon";
import { FrameButton } from "../components/FrameButton";
import { PaperBackground } from "../components/PaperBackground";
import {
  createVerifiedEmailAccount,
  ensureUserProfile,
  shouldShowOAuthProvider,
  signInWithOAuthProvider,
  supabase
} from "../services/supabase";
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
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const createAccount = async () => {
    setError("");
    setStatus("");
    if (!email.trim() || !password || !username.trim()) {
      setError("Email, username, and password are required.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setSubmitting(true);
    const { error: signUpError } = await createVerifiedEmailAccount({
      displayName: displayName.trim() || username.trim(),
      email: email.trim(),
      password,
      username: username.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_")
    });
    setSubmitting(false);
    if (signUpError) {
      setError(signUpError.message);
      return;
    }
    setStatus("✨ Verification email sent! Check your inbox to confirm your account.");
    completeIntro();
  };

  const startOAuth = async (provider: "google" | "github") => {
    setError("");
    setSubmitting(true);
    const { error: authError } = await signInWithOAuthProvider(provider);
    setSubmitting(false);
    if (authError) {
      const providerName = provider[0]!.toUpperCase() + provider.slice(1);
      setError(
        authError.message.toLowerCase().includes("provider")
          ? `${providerName} sign-up is configuring. Try Email sign-up in the meantime.`
          : authError.message
      );
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
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Header Badge */}
          <View style={styles.brandBadgeRow}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoBadgeText}>F</Text>
            </View>
            <View style={styles.vintageStamp}>
              <Text style={styles.vintageStampText}>JOIN THE CIRCLE</Text>
            </View>
          </View>

          <Text style={styles.title}>Start Your Scrapbook</Text>
          <Text style={styles.subtitle}>
            A safe, private haven for family memories, voice notes, and daily moments.
          </Text>

          {/* Error / Success Banners */}
          {error ? (
            <View style={styles.errorBox}>
              <AppIcon name="close" color="#A83232" size={16} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {status ? (
            <View style={styles.statusBox}>
              <AppIcon name="check" color="#1E6E3E" size={16} />
              <Text style={styles.statusText}>{status}</Text>
            </View>
          ) : null}

          {/* Form Fields */}
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>YOUR NAME / FAMILY NAME</Text>
              <TextInput
                placeholder="e.g. Karthik Reddy or The Reddy Family"
                placeholderTextColor="#9C8875"
                style={styles.input}
                value={displayName}
                onChangeText={setDisplayName}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>UNIQUE USERNAME (@handle)</Text>
              <TextInput
                placeholder="e.g. karthik_reddy"
                placeholderTextColor="#9C8875"
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
              <TextInput
                placeholder="e.g. karthik@gmail.com"
                placeholderTextColor="#9C8875"
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>PASSWORD (8+ CHARACTERS)</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  placeholder="Create a strong password"
                  placeholderTextColor="#9C8875"
                  style={[styles.input, { flex: 1, borderWidth: 0 }]}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <Pressable
                  style={styles.eyeBtn}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Text style={styles.eyeBtnText}>{showPassword ? "Hide" : "Show"}</Text>
                </Pressable>
              </View>
            </View>

            <FrameButton
              icon="check"
              label={submitting ? "Creating Account..." : "Create Free Scrapbook Account"}
              onPress={() => { void createAccount(); }}
            />

            {/* Social Logins */}
            {oauthProviders
              .filter((provider) => shouldShowOAuthProvider(provider.id))
              .map((provider) => (
                <FrameButton
                  key={provider.id}
                  icon={provider.icon}
                  label={provider.label}
                  variant="secondary"
                  onPress={() => { void startOAuth(provider.id); }}
                />
              ))}

            {/* Footer Navigation */}
            <View style={styles.footerRow}>
              <Text style={styles.footerPrompt}>Already have an account?</Text>
              <Link href="/login" asChild>
                <Pressable>
                  <Text style={styles.footerLink}>Log In Here ›</Text>
                </Pressable>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </PaperBackground>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 24,
    paddingTop: Platform.OS === "web" ? 36 : 60,
    paddingBottom: 40,
    justifyContent: "center",
    maxWidth: 480,
    alignSelf: "center",
    width: "100%"
  },
  brandBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16
  },
  logoBadge: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: palette.acidYellow,
    borderWidth: 2,
    borderColor: palette.ink,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: palette.ink,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.9,
    shadowRadius: 0,
    elevation: 4
  },
  logoBadgeText: {
    fontSize: 24,
    fontWeight: "900",
    color: palette.ink
  },
  vintageStamp: {
    backgroundColor: "#F4EDE2",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#B8A38E"
  },
  vintageStampText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#6B5846",
    letterSpacing: 1
  },
  title: {
    fontSize: 30,
    fontWeight: "900",
    color: palette.ink,
    letterSpacing: -0.5
  },
  subtitle: {
    fontSize: 13,
    color: palette.mutedBrown,
    fontWeight: "600",
    marginTop: 4,
    marginBottom: 18,
    lineHeight: 18
  },
  errorBox: {
    backgroundColor: "#FCE8E8",
    borderRadius: 8,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#E59E9E",
    marginBottom: 14
  },
  errorText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#9C2626",
    flex: 1
  },
  statusBox: {
    backgroundColor: "#EBF8F0",
    borderRadius: 8,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#A3D9B5",
    marginBottom: 14
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1B5E33",
    flex: 1
  },
  form: {
    gap: 12
  },
  inputContainer: {
    gap: 4
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: "900",
    color: palette.ink,
    letterSpacing: 0.8
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: palette.whitePaper,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "#E2D3BE",
    paddingHorizontal: 12
  },
  input: {
    height: 50,
    backgroundColor: palette.whitePaper,
    borderRadius: 8,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: "#E2D3BE",
    fontSize: 14,
    color: palette.ink
  },
  eyeBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6
  },
  eyeBtnText: {
    fontSize: 12,
    fontWeight: "800",
    color: palette.mutedBrown
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 16
  },
  footerPrompt: {
    fontSize: 13,
    fontWeight: "700",
    color: palette.mutedBrown
  },
  footerLink: {
    fontSize: 13,
    fontWeight: "900",
    color: palette.ink,
    textDecorationLine: "underline"
  }
});
