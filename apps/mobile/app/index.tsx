import { Link, Redirect, router } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { palette } from "@frames/ui";
import { AppIcon, type AppIconName } from "../components/AppIcon";
import { FrameButton } from "../components/FrameButton";
import { PaperBackground } from "../components/PaperBackground";
import { ensureUserProfile, signInWithOAuthProvider, supabase } from "../services/supabase";
import { useAppStore } from "../store/appStore";

const steps: Array<{ icon: AppIconName; title: string; copy: string }> = [
  { icon: "camera", title: "Capture today", copy: "Post a photo or choose one from your gallery. Set it public or friends-only." },
  { icon: "user-plus", title: "Find your people", copy: "Search by username, open profiles, and send follow requests before sharing private Frames." },
  { icon: "memory", title: "Keep the good parts", copy: "Archive your daily Frames into simple monthly and yearly memory views." }
];
const typeLines = ["Snap it.", "Frame it.", "Share it with the right people.", "Keep the good parts."];

export default function Index() {
  const [activeStep, setActiveStep] = useState(0);
  const [typedText, setTypedText] = useState("");
  const [lineIndex, setLineIndex] = useState(0);
  const hasSeenIntro = useAppStore((state) => state.hasSeenIntro);
  const currentUser = useAppStore((state) => state.currentUser);
  const setCurrentUser = useAppStore((state) => state.setCurrentUser);
  const completeIntro = useAppStore((state) => state.completeIntro);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    const fullLine = typeLines[lineIndex]!;
    if (typedText.length < fullLine.length) {
      const id = setTimeout(() => setTypedText(fullLine.slice(0, typedText.length + 1)), 48);
      return () => clearTimeout(id);
    }
    const id = setTimeout(() => {
      setTypedText("");
      setLineIndex((index) => (index + 1) % typeLines.length);
    }, 1200);
    return () => clearTimeout(id);
  }, [lineIndex, typedText]);

  if (hasSeenIntro || currentUser) return <Redirect href="/(tabs)/home" />;

  return (
    <PaperBackground>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <View style={styles.brandRow}>
            <View style={styles.logo}><Text style={styles.logoText}>F</Text></View>
            <View>
              <Text style={styles.kicker}>FRAMES</Text>
              <Text style={styles.brandCopy}>Your life, framed automatically.</Text>
            </View>
          </View>
          <View style={styles.previewStack}>
            <View style={[styles.photo, styles.photoBack]} />
            <View style={[styles.photo, styles.photoFront]}>
              <View style={styles.photoInner}>
                <Text style={styles.photoIcon}>o</Text>
              </View>
              <Text style={styles.photoCaption}>today, saved</Text>
            </View>
          </View>
          <Text style={styles.title}>A scrapbook that starts with one snap.</Text>
          <View style={styles.typewriter}>
            <Text style={styles.typewriterText}>{typedText}<Text style={styles.cursor}>|</Text></Text>
          </View>
          <Text style={styles.copy}>Frames lets you capture daily moments, find friends, choose what stays private, and turn posts into memories without the noise.</Text>
        </View>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>How it works</Text>
          <Text style={styles.sectionCopy}>Tap through the quick intro once. After you create or enter an account, it stays out of your way.</Text>
        </View>
        <View style={styles.slide}>
          <View style={styles.slideIcon}><AppIcon name={steps[activeStep]!.icon} size={30} color={palette.ink} /></View>
          <Text style={styles.stepNumber}>0{activeStep + 1} / 03</Text>
          <Text style={styles.stepTitle}>{steps[activeStep]!.title}</Text>
          <Text style={styles.stepCopy}>{steps[activeStep]!.copy}</Text>
          <View style={styles.dots}>
            {steps.map((step, index) => (
              <Pressable key={step.title} accessibilityRole="button" style={[styles.dot, activeStep === index && styles.dotActive]} onPress={() => setActiveStep(index)} />
            ))}
          </View>
          <View style={styles.slideActions}>
            <Pressable style={[styles.navButton, activeStep === 0 && styles.navButtonMuted]} onPress={() => setActiveStep((step) => Math.max(0, step - 1))} disabled={activeStep === 0}>
              <Text style={styles.navButtonText}>Back</Text>
            </Pressable>
            <Pressable style={styles.navButton} onPress={() => activeStep === steps.length - 1 ? undefined : setActiveStep((step) => Math.min(steps.length - 1, step + 1))} disabled={activeStep === steps.length - 1}>
              <Text style={styles.navButtonText}>{activeStep === steps.length - 1 ? "Ready" : "Next"}</Text>
            </Pressable>
          </View>
          {activeStep === steps.length - 1 ? (
            <View style={styles.accountChoice}>
              {authError ? <Text style={styles.error}>{authError}</Text> : null}
              <FrameButton
                icon="google"
                label="Continue with Google"
                variant="secondary"
                onPress={async () => {
                  setAuthError("");
                  const { error } = await signInWithOAuthProvider("google");
                  if (error) {
                    setAuthError(error.message.includes("provider")
                      ? "Google OAuth needs to be enabled in your Supabase Auth Providers."
                      : error.message);
                    return;
                  }
                  const { data: sessionData } = await supabase.auth.getSession();
                  if (sessionData?.session?.user) {
                    const { profile } = await ensureUserProfile(sessionData.session.user);
                    if (profile) setCurrentUser(profile);
                    completeIntro();
                    router.replace("/(tabs)/home");
                  }
                }}
              />
              <Link href="/register" asChild><FrameButton icon="user-plus" label="Create Account" onPress={completeIntro} /></Link>
              <Pressable style={styles.loginLink} onPress={() => { completeIntro(); router.replace("/login"); }}>
                <Text style={styles.loginQuestion}>Already a user?</Text>
                <Text style={styles.loginText}>Log in</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </PaperBackground>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, padding: 24, paddingTop: 58, paddingBottom: 42, gap: 18 },
  hero: { gap: 18 },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  logo: { width: 48, height: 48, borderRadius: 8, backgroundColor: palette.ink, alignItems: "center", justifyContent: "center" },
  logoText: { color: palette.whitePaper, fontSize: 24, fontWeight: "900" },
  kicker: { color: palette.ink, fontWeight: "900", fontSize: 18, letterSpacing: 0 },
  brandCopy: { color: palette.mutedBrown, fontWeight: "700", marginTop: 2 },
  previewStack: { height: 228, justifyContent: "center", alignItems: "center", marginTop: 8 },
  photo: { position: "absolute", width: 172, height: 206, borderRadius: 8, borderWidth: 1, borderColor: "#E4D9CA", backgroundColor: palette.whitePaper },
  photoBack: { transform: [{ rotate: "-7deg" }], backgroundColor: palette.softPeach, left: 42, top: 18 },
  photoFront: { transform: [{ rotate: "5deg" }], padding: 12, right: 42, top: 4 },
  photoInner: { flex: 1, borderRadius: 6, backgroundColor: palette.powderBlue, alignItems: "center", justifyContent: "center" },
  photoIcon: { color: palette.ink, fontSize: 40, fontWeight: "900" },
  photoCaption: { color: palette.mutedBrown, fontWeight: "900", marginTop: 10, textAlign: "center" },
  title: { color: palette.ink, fontSize: 38, fontWeight: "900", lineHeight: 43 },
  typewriter: { minHeight: 42, borderLeftWidth: 4, borderLeftColor: palette.softPeach, justifyContent: "center", paddingLeft: 12, backgroundColor: "#FCFAF6" },
  typewriterText: { color: palette.ink, fontSize: 22, fontWeight: "900" },
  cursor: { color: palette.mutedBrown },
  copy: { color: palette.mutedBrown, fontSize: 17, lineHeight: 25 },
  sectionHeader: { marginTop: 10, gap: 4 },
  sectionTitle: { color: palette.ink, fontSize: 24, fontWeight: "900" },
  sectionCopy: { color: palette.mutedBrown, lineHeight: 22 },
  slide: { backgroundColor: palette.whitePaper, borderRadius: 8, borderWidth: 1, borderColor: "#E4D9CA", padding: 18, gap: 10 },
  slideIcon: { width: 58, height: 58, borderRadius: 8, backgroundColor: palette.sunshine, alignItems: "center", justifyContent: "center" },
  stepNumber: { color: palette.mutedBrown, fontSize: 12, fontWeight: "900" },
  stepTitle: { color: palette.ink, fontSize: 24, fontWeight: "900" },
  stepCopy: { color: palette.mutedBrown, lineHeight: 21 },
  dots: { flexDirection: "row", gap: 8, marginTop: 4 },
  dot: { width: 28, height: 6, borderRadius: 3, backgroundColor: "#E4D9CA" },
  dotActive: { backgroundColor: palette.ink },
  slideActions: { flexDirection: "row", gap: 10, marginTop: 6 },
  navButton: { flex: 1, minHeight: 44, borderRadius: 22, backgroundColor: palette.ink, alignItems: "center", justifyContent: "center" },
  navButtonMuted: { opacity: 0.35 },
  navButtonText: { color: palette.whitePaper, fontWeight: "900" },
  accountChoice: { gap: 12, marginTop: 8 },
  error: { color: "#9B2C2C", fontWeight: "800", lineHeight: 20 },
  loginLink: { minHeight: 58, borderRadius: 29, borderWidth: 1, borderColor: "#E4D9CA", backgroundColor: "#FCFAF6", alignItems: "center", justifyContent: "center" },
  loginQuestion: { color: palette.mutedBrown, fontWeight: "800", fontSize: 12 },
  loginText: { color: palette.ink, fontWeight: "900", fontSize: 18 }
});
