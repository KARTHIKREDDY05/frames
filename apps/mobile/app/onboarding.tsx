import { useRef, useState } from "react";
import { Animated, Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { palette } from "@frames/ui";
import { AppIcon } from "../components/AppIcon";
import { useAppStore } from "../store/appStore";

const SLIDES = [
  {
    id: "capture",
    kicker: "01 — CAPTURE",
    title: "Your day,\none moment at a time.",
    body: "Snap spontaneous Polaroid-style photos throughout your day. Each Frame auto-expires in 24 hours — every capture is fresh, present, and real.",
    icon: "camera" as const,
    accent: palette.acidYellow,
    bullets: ["24h ephemeral captures", "Polaroid & filmstrip styles", "Friends-only or Public"],
  },
  {
    id: "archive",
    kicker: "02 — REMEMBER",
    title: "Auto Scrapbook\nArchive.",
    body: "When your Frames expire, we automatically compile them into a beautiful retro scrapbook card — saved in your Memory Archive forever.",
    icon: "archive" as const,
    accent: palette.softLavender,
    bullets: ["Auto Daily Frame generation", "Monthly & Yearly collages", "Shareable memory links"],
  },
  {
    id: "print",
    kicker: "03 — PRINT",
    title: "Physical Polaroid\nPrints for ₹199.",
    body: "Turn any daily archive into a real print pack. 300gsm high-gloss Polaroids in a vintage kraft envelope — delivered to your door in 3–5 days.",
    icon: "spark" as const,
    accent: palette.softPeach,
    bullets: ["₹199 for up to 5 prints", "Free shipping across India", "Delivered in 3–5 days"],
  },
];

export default function OnboardingScreen() {
  const completeIntro = useAppStore((state) => state.completeIntro);
  const [current, setCurrent] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const slide = SLIDES[current]!;

  const animateAndGo = (next: number) => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
    ]).start();
    setCurrent(next);
  };

  const goNext = () => {
    if (current < SLIDES.length - 1) {
      animateAndGo(current + 1);
    } else {
      completeIntro();
      router.replace("/login");
    }
  };

  const skip = () => {
    completeIntro();
    router.replace("/login");
  };

  return (
    <SafeAreaView style={styles.root}>
      {/* Top row */}
      <View style={styles.topRow}>
        <View style={styles.logoTag}>
          <Text style={styles.logoTagText}>FRAMES ™</Text>
        </View>
        <Pressable style={styles.skipBtn} onPress={skip}>
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      </View>

      {/* Progress pill bar */}
      <View style={styles.pillBar}>
        {SLIDES.map((s, idx) => (
          <Pressable
            key={s.id}
            onPress={() => animateAndGo(idx)}
            style={[styles.pill, idx === current && styles.pillActive]}
          />
        ))}
      </View>

      {/* Main animated card */}
      <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
        {/* Accent circle */}
        <View style={[styles.iconCircle, { backgroundColor: slide.accent }]}>
          <AppIcon name={slide.icon} color={palette.ink} size={34} />
        </View>

        <Text style={styles.kicker}>{slide.kicker}</Text>
        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.body}>{slide.body}</Text>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Feature bullets */}
        <View style={styles.bullets}>
          {slide.bullets.map((item) => (
            <View key={item} style={styles.bullet}>
              <View style={[styles.bulletDot, { backgroundColor: slide.accent }]}>
                <AppIcon name="check" color={palette.ink} size={10} />
              </View>
              <Text style={styles.bulletText}>{item}</Text>
            </View>
          ))}
        </View>
      </Animated.View>

      {/* CTA area */}
      <View style={styles.ctaWrap}>
        <Pressable
          style={[styles.ctaBtn, { backgroundColor: slide.accent }]}
          onPress={goNext}
        >
          <Text style={styles.ctaText}>
            {current < SLIDES.length - 1 ? `Next  →` : `Get Started →`}
          </Text>
        </Pressable>

        {current === SLIDES.length - 1 ? (
          <Pressable
            style={styles.secondaryCta}
            onPress={() => { completeIntro(); router.replace("/register"); }}
          >
            <Text style={styles.secondaryCtaText}>New here? Create a free account</Text>
          </Pressable>
        ) : (
          <View style={styles.stepCounter}>
            <Text style={styles.stepCounterText}>{current + 1} of {SLIDES.length}</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.paperCream,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
    gap: 14,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 8,
  },
  logoTag: {
    backgroundColor: palette.ink,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  logoTagText: { fontSize: 10, fontWeight: "900", color: palette.whitePaper, letterSpacing: 1.5 },
  skipBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: palette.whitePaper,
    borderWidth: 1.5,
    borderColor: palette.ink,
    borderRadius: 4,
    shadowColor: palette.ink,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 0,
  },
  skipText: { fontSize: 11, fontWeight: "900", color: palette.mutedBrown },
  pillBar: { flexDirection: "row", gap: 6 },
  pill: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D4C9BC",
  },
  pillActive: { backgroundColor: palette.ink },
  card: {
    flex: 1,
    backgroundColor: palette.whitePaper,
    borderWidth: 2,
    borderColor: palette.ink,
    borderRadius: 14,
    padding: 24,
    gap: 10,
    shadowColor: palette.ink,
    shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 0.9,
    shadowRadius: 0,
    elevation: 6,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2,
    borderColor: palette.ink,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 4,
    shadowColor: palette.ink,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.85,
    shadowRadius: 0,
  },
  kicker: {
    fontSize: 9,
    fontWeight: "900",
    color: palette.mutedBrown,
    letterSpacing: 2,
    textAlign: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    color: palette.ink,
    letterSpacing: -0.6,
    lineHeight: 34,
    textAlign: "center",
  },
  body: {
    fontSize: 13,
    fontWeight: "600",
    color: palette.mutedBrown,
    lineHeight: 20,
    textAlign: "center",
  },
  divider: {
    height: 1.5,
    backgroundColor: "#EDE7DC",
    marginVertical: 2,
  },
  bullets: { gap: 10 },
  bullet: { flexDirection: "row", alignItems: "center", gap: 10 },
  bulletDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: palette.ink,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  bulletText: { fontSize: 13, fontWeight: "700", color: palette.ink, flex: 1 },
  ctaWrap: { gap: 8 },
  ctaBtn: {
    paddingVertical: 15,
    borderWidth: 2,
    borderColor: palette.ink,
    borderRadius: 10,
    alignItems: "center",
    shadowColor: palette.ink,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.9,
    shadowRadius: 0,
    elevation: 4,
  },
  ctaText: { fontSize: 16, fontWeight: "900", color: palette.ink },
  secondaryCta: {
    alignItems: "center",
    paddingVertical: 10,
    backgroundColor: palette.whitePaper,
    borderWidth: 1.5,
    borderColor: palette.ink,
    borderRadius: 8,
  },
  secondaryCtaText: { fontSize: 13, fontWeight: "800", color: palette.ink },
  stepCounter: { alignItems: "center", paddingVertical: 8 },
  stepCounterText: { fontSize: 11, fontWeight: "700", color: palette.mutedBrown },
});
