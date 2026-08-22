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
  ensureUserProfile,
  shouldShowOAuthProvider,
  signInWithOAuthProvider,
  signInWithVerifiedEmail,
  supabase
} from "../services/supabase";
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
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const login = async () => {
    setError("");
    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }
    setLoading(true);
    const { data, error: authError } = await signInWithVerifiedEmail(email.trim(), password);
    setLoading(false);
    if (authError) {
      setError(
        authError.message.includes("Email not confirmed")
          ? "Please confirm your email before signing in."
          : authError.message
      );
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
      setError(
        authError.message.toLowerCase().includes("provider")
          ? `${providerName} sign-in is configuring. Try Guest or Email in the meantime.`
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

  const loginAsFamilyDemo = () => {
    setCurrentUser({
      id: "user-demo",
      username: "karthik",
      displayName: "Karthik Reddy",
      email: "reddykarthik370@gmail.com",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400",
      bio: "Collecting family smiles & everyday magic 📸✨",
      defaultPrivacy: "FRIENDS",
      profileVisibility: "PUBLIC"
    });
    completeIntro();
    router.replace("/(tabs)/home");
  };

  return (
    <PaperBackground>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Header Card */}
          <View style={styles.brandBadgeRow}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoBadgeText}>F</Text>
            </View>
            <View style={styles.vintageStamp}>
              <Text style={styles.vintageStampText}>FRAMES • 2026</Text>
            </View>
          </View>

          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to your family scrapbook & memory vault.</Text>

          {/* Error Banner */}
          {error ? (
            <View style={styles.errorBox}>
              <AppIcon name="close" color="#A83232" size={16} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Form Fields */}
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  placeholder="e.g. karthik@frames.app"
                  placeholderTextColor="#9C8875"
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>PASSWORD</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  placeholder="Enter your password"
                  placeholderTextColor="#9C8875"
                  style={[styles.input, { flex: 1 }]}
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
              label={loading ? "Signing In..." : "Sign In to Memories"}
              onPress={() => { void login(); }}
            />

            {/* Quick Demo Access */}
            <View style={styles.demoBox}>
              <View style={styles.demoHeader}>
                <Text style={styles.demoTitle}>Instant Family Demo Mode</Text>
                <Text style={styles.demoSubtitle}>Try all features immediately without entering a password</Text>
              </View>
              <FrameButton
                icon="spark"
                label="✨ Explore as Family Demo"
                variant="secondary"
                onPress={loginAsFamilyDemo}
              />
            </View>

            {/* OAuth Buttons */}
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
              <Text style={styles.footerPrompt}>New to Frames?</Text>
              <Link href="/register" asChild>
                <Pressable>
                  <Text style={styles.footerLink}>Create Free Account ›</Text>
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
    fontSize: 32,
    fontWeight: "900",
    color: palette.ink,
    letterSpacing: -0.5
  },
  subtitle: {
    fontSize: 14,
    color: palette.mutedBrown,
    fontWeight: "600",
    marginTop: 4,
    marginBottom: 20
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
    marginBottom: 16
  },
  errorText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#9C2626",
    flex: 1
  },
  form: {
    gap: 14
  },
  inputContainer: {
    gap: 6
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
    paddingHorizontal: 14
  },
  input: {
    height: 52,
    fontSize: 14,
    color: palette.ink,
    width: "100%"
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
  demoBox: {
    backgroundColor: "#FFF9EA",
    borderWidth: 1.5,
    borderColor: "#E5D2A5",
    borderRadius: 12,
    padding: 14,
    gap: 10,
    marginTop: 4
  },
  demoHeader: {
    gap: 2
  },
  demoTitle: {
    fontSize: 13,
    fontWeight: "900",
    color: "#6B4907"
  },
  demoSubtitle: {
    fontSize: 11,
    color: "#8B6F38",
    fontWeight: "600"
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
