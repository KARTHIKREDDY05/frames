import { Link } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { palette } from "@frames/ui";
import { FrameButton } from "../components/FrameButton";
import { PaperBackground } from "../components/PaperBackground";

const slides = [
  ["Share today.", "Keep forever."],
  ["Every day", "becomes a memory card."],
  ["Every month", "becomes a collage."],
  ["Every year", "becomes your story."]
];

export default function Onboarding() {
  return (
    <PaperBackground>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <View style={[styles.photo, styles.one]} />
          <View style={[styles.photo, styles.two]} />
          <Text style={styles.kicker}>01 - CAPTURE</Text>
          <Text style={styles.title}>Frames</Text>
          <Text style={styles.copy}>Your life, framed - automatically.</Text>
          <View style={styles.actions}>
            <Link href="/register" asChild><FrameButton label="Create Account" /></Link>
            <Link href="/login" asChild><FrameButton label="Sign In" variant="secondary" /></Link>
            <Link href="/(tabs)/home" asChild><FrameButton label="Open Demo" variant="secondary" /></Link>
          </View>
        </View>
        <View style={styles.deck}>
          {slides.map((item, index) => (
            <View key={item[0]} style={styles.card}>
              <Text style={styles.cardStep}>0{index + 2}</Text>
              <Text style={styles.cardTitle}>{item[0]}</Text>
              <Text style={styles.cardCopy}>{item[1]}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </PaperBackground>
  );
}

const styles = StyleSheet.create({
  content: { padding: 32, paddingTop: 74, paddingBottom: 48 },
  hero: { minHeight: 560, justifyContent: "center" },
  kicker: { color: palette.mutedBrown, fontWeight: "800", letterSpacing: 0, marginBottom: 12 },
  title: { color: palette.ink, fontSize: 42, fontWeight: "900" },
  copy: { color: palette.mutedBrown, fontSize: 20, lineHeight: 28, marginTop: 10 },
  actions: { gap: 12, marginTop: 36 },
  photo: { position: "absolute", width: 150, height: 190, backgroundColor: palette.whitePaper, borderWidth: 1, borderColor: "#E4D9CA" },
  one: { top: 96, right: 44, transform: [{ rotate: "8deg" }] },
  two: { top: 154, left: -8, backgroundColor: palette.softPeach, transform: [{ rotate: "-7deg" }] },
  deck: { gap: 12 },
  card: { backgroundColor: palette.whitePaper, borderWidth: 1, borderColor: "#E4D9CA", borderRadius: 8, padding: 16 },
  cardStep: { color: palette.mutedBrown, fontWeight: "900", marginBottom: 8 },
  cardTitle: { color: palette.ink, fontSize: 24, fontWeight: "900" },
  cardCopy: { color: palette.mutedBrown, fontSize: 16, marginTop: 4 }
});
