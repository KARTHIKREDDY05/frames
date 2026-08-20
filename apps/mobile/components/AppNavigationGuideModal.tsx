import { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { palette } from "@frames/ui";
import { AppIcon, type AppIconName } from "./AppIcon";

interface GuideStep {
  title: string;
  subtitle: string;
  badge: string;
  icon: AppIconName;
  color: string;
  bullets: string[];
}

const steps: GuideStep[] = [
  {
    title: "Welcome to Frames",
    subtitle: "Your Life, Framed Automatically",
    badge: "SCRAPBOOK INTRO",
    icon: "frames-logo",
    color: palette.acidYellow,
    bullets: [
      "No algorithmic noise or endless doomscrolling.",
      "Capture 1 real memory every day in physical Polaroid style.",
      "Share with close friends or save into your private monthly scrapbook."
    ]
  },
  {
    title: "The Home Feed & Pinboard",
    subtitle: "Friends' Daily Moments",
    badge: "STEP 1 OF 4",
    icon: "home",
    color: palette.acidYellow,
    bullets: [
      "Polaroid Feed: Staggered pinboard layout with paper tape pins & stamped dates.",
      "Double-Tap to Heart: Double-tap any photo to leave a floating heart pop reaction.",
      "24h Memory Cycle: Posts stay active for 24h before moving to Archive."
    ]
  },
  {
    title: "Pro Camera Studio & Cropper",
    subtitle: "Analog 35mm Capture",
    badge: "STEP 2 OF 4",
    icon: "camera",
    color: palette.softLavender,
    bullets: [
      "35mm Viewfinder: Real-time analog lenses (Warm Film, Noir, Cyber Neon, Grain).",
      "Studio Controls: Rule-of-Thirds Grid Guide & Self-Timer Countdown (3s / 5s).",
      "Ratio Cropper: Instant 1:1 Square Polaroid, 4:5 Feed Portrait, 9:16 Story framing."
    ]
  },
  {
    title: "Encrypted Direct Chats",
    subtitle: "WhatsApp-Style Micro-Messaging",
    badge: "STEP 3 OF 4",
    icon: "comment",
    color: palette.softPeach,
    bullets: [
      "Direct Messages: Fast 1-on-1 chats anchored directly on your bottom tab bar.",
      "Read Receipts: Live status indicators (✓ Sent, ✓✓ Delivered, ✓✓ Seen).",
      "Frame Attachments: Forward and discuss individual Frames directly with friends."
    ]
  },
  {
    title: "Monthly Memory Archive",
    subtitle: "Automated Lifetime Scrapbook",
    badge: "STEP 4 OF 4",
    icon: "archive",
    color: palette.acidYellow,
    bullets: [
      "Zero Effort Scrapbooking: Expired daily Frames auto-collate into monthly memory albums.",
      "Profile Pinning: Choose to feature your favorite Frames permanently on your profile grid.",
      "Memory Timelines: Revisit months and years of your real daily life."
    ]
  }
];

export function AppNavigationGuideModal({
  visible,
  onClose
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentStep = steps[currentIndex]!;

  const isLast = currentIndex === steps.length - 1;

  const handleNext = () => {
    if (isLast) {
      setCurrentIndex(0);
      onClose();
    } else {
      setCurrentIndex((index) => index + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((index) => index - 1);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header Badge */}
          <View style={styles.topBar}>
            <View style={[styles.badgePill, { backgroundColor: currentStep.color }]}>
              <Text style={styles.badgeText}>{currentStep.badge}</Text>
            </View>
            <Pressable style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
          </View>

          {/* Icon Header */}
          <View style={styles.iconHero}>
            <View style={[styles.iconWrap, { backgroundColor: currentStep.color }]}>
              <AppIcon name={currentStep.icon} color={palette.ink} size={36} />
            </View>
            <Text style={styles.title}>{currentStep.title}</Text>
            <Text style={styles.subtitle}>{currentStep.subtitle}</Text>
          </View>

          {/* Step Bullets */}
          <View style={styles.bulletList}>
            {currentStep.bullets.map((bullet, idx) => (
              <View key={idx} style={styles.bulletRow}>
                <View style={styles.bulletDot} />
                <Text style={styles.bulletText}>{bullet}</Text>
              </View>
            ))}
          </View>

          {/* Indicators */}
          <View style={styles.indicatorRow}>
            {steps.map((_, idx) => (
              <View
                key={idx}
                style={[
                  styles.dot,
                  idx === currentIndex && styles.activeDot,
                  idx === currentIndex && { backgroundColor: palette.ink }
                ]}
              />
            ))}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            {currentIndex > 0 ? (
              <Pressable style={styles.prevBtn} onPress={handlePrev}>
                <Text style={styles.prevBtnText}>Back</Text>
              </Pressable>
            ) : null}
            <Pressable style={[styles.nextBtn, { flex: 1 }]} onPress={handleNext}>
              <Text style={styles.nextBtnText}>{isLast ? "Got it! Start Framing" : "Next Step ➔"}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(17, 17, 17, 0.75)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20
  },
  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: palette.paperCream,
    borderWidth: 2,
    borderColor: palette.ink,
    borderRadius: 14,
    padding: 20,
    gap: 16,
    shadowColor: palette.ink,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.9,
    shadowRadius: 0
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  badgePill: {
    borderWidth: 1.5,
    borderColor: palette.ink,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "900",
    color: palette.ink,
    letterSpacing: 0.5
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: palette.ink,
    backgroundColor: palette.whitePaper,
    alignItems: "center",
    justifyContent: "center"
  },
  closeBtnText: {
    fontSize: 14,
    fontWeight: "900",
    color: palette.ink
  },
  iconHero: {
    alignItems: "center",
    gap: 6
  },
  iconWrap: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2,
    borderColor: palette.ink,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
    shadowColor: palette.ink,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.85,
    shadowRadius: 0
  },
  title: {
    fontSize: 22,
    fontWeight: "900",
    color: palette.ink,
    textAlign: "center",
    letterSpacing: -0.5
  },
  subtitle: {
    fontSize: 12,
    fontWeight: "800",
    color: palette.mutedBrown,
    textAlign: "center"
  },
  bulletList: {
    gap: 10,
    backgroundColor: palette.whitePaper,
    borderWidth: 1.5,
    borderColor: palette.ink,
    borderRadius: 8,
    padding: 14
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10
  },
  bulletDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: palette.acidYellow,
    borderWidth: 1,
    borderColor: palette.ink,
    marginTop: 5
  },
  bulletText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "700",
    color: palette.ink,
    lineHeight: 18
  },
  indicatorRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#D0C4B4",
    borderWidth: 1,
    borderColor: palette.ink
  },
  activeDot: {
    width: 24
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4
  },
  prevBtn: {
    backgroundColor: palette.whitePaper,
    borderWidth: 1.5,
    borderColor: palette.ink,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center"
  },
  prevBtnText: {
    fontSize: 13,
    fontWeight: "900",
    color: palette.ink
  },
  nextBtn: {
    backgroundColor: palette.acidYellow,
    borderWidth: 1.5,
    borderColor: palette.ink,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: palette.ink,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.85,
    shadowRadius: 0
  },
  nextBtnText: {
    fontSize: 13,
    fontWeight: "900",
    color: palette.ink
  }
});
