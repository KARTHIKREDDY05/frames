import { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { palette } from "@frames/ui";
import { AppIcon } from "./AppIcon";

export interface TourSpotlightStep {
  id: string;
  targetName: string;
  title: string;
  description: string;
  badge: string;
  pointerPosition: "top" | "bottom";
  targetStyle: { top?: number | string; bottom?: number | string; left?: number | string; right?: number | string };
}

const tourSteps: TourSpotlightStep[] = [
  {
    id: "step-feed",
    targetName: "Scrapbook Feed",
    title: "Double-Tap to Heart Like ❤️",
    description: "Double-tap any Polaroid photo in your feed to trigger a floating heart pop reaction! Tap options gear on your Frame to Pin or change privacy.",
    badge: "1 / 4 • INTERACTIVE FEED",
    pointerPosition: "top",
    targetStyle: { top: "42%", left: "50%" }
  },
  {
    id: "step-camera",
    targetName: "Center Camera Button",
    title: "35mm Camera Studio 📸",
    badge: "2 / 4 • CAMERA & CROPPER",
    description: "Tap the center Camera tab to open the 35mm Viewfinder with Rule-of-Thirds Grid, Self-Timer (3s/5s), and Aspect Ratio Cropper (1:1, 4:5, 9:16).",
    pointerPosition: "bottom",
    targetStyle: { bottom: 32, left: "50%" }
  },
  {
    id: "step-chats",
    targetName: "Direct Messages",
    title: "Encrypted Direct Messages 💬",
    badge: "3 / 4 • ENCRYPTED CHATS",
    description: "Connect 1-on-1 with accepted friends. Features read receipts (✓✓), online badges, and direct frame forwarding.",
    pointerPosition: "bottom",
    targetStyle: { bottom: 32, left: "70%" }
  },
  {
    id: "step-archive",
    targetName: "Memory Book",
    title: "Automated Lifetime Memory Book 📅",
    badge: "4 / 4 • LIFETIME MEMORY BOOK",
    description: "Expired 24h frames automatically collate into your monthly Memory Book timeline so your daily memories are saved forever.",
    pointerPosition: "top",
    targetStyle: { top: 110, right: 30 }
  }
];

export function VisualInteractiveTourOverlay({
  visible,
  onClose
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const step = tourSteps[currentStepIndex]!;
  const isLast = currentStepIndex === tourSteps.length - 1;

  const nextStep = () => {
    if (isLast) {
      setCurrentIndex(0);
      onClose();
    } else {
      setCurrentStepIndex((idx) => idx + 1);
    }
  };

  const setCurrentIndex = (val: number) => {
    setCurrentStepIndex(val);
  };

  const prevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((idx) => idx - 1);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        {/* Dimmed Background */}
        <Pressable style={styles.dimBackground} onPress={nextStep} />

        {/* Dynamic Target Pulse Ring */}
        <View style={[styles.targetPulseContainer, step.targetStyle as any]}>
          <View style={styles.pulseRing} />
          <View style={styles.pulseCenter}>
            <AppIcon name="spark" color={palette.ink} size={18} />
          </View>
        </View>

        {/* Floating Tooltip Card */}
        <View style={[styles.tooltipCard, step.pointerPosition === "bottom" ? styles.positionBottom : styles.positionTop]}>
          <View style={styles.tooltipHeader}>
            <View style={styles.badgePill}>
              <Text style={styles.badgeText}>{step.badge}</Text>
            </View>
            <Pressable style={styles.skipBtn} onPress={onClose}>
              <Text style={styles.skipBtnText}>Skip Tour ✕</Text>
            </Pressable>
          </View>

          <Text style={styles.tooltipTitle}>{step.title}</Text>
          <Text style={styles.tooltipDesc}>{step.description}</Text>

          {/* Navigation Controls */}
          <View style={styles.controlsRow}>
            {currentStepIndex > 0 ? (
              <Pressable style={styles.backBtn} onPress={prevStep}>
                <Text style={styles.backBtnText}>‹ Back</Text>
              </Pressable>
            ) : null}

            <Pressable style={styles.nextBtn} onPress={nextStep}>
              <Text style={styles.nextBtnText}>{isLast ? "Finish Tour ✓" : "Next Target ➔"}</Text>
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
    position: "relative"
  },
  dimBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(17, 17, 17, 0.65)"
  },
  targetPulseContainer: {
    position: "absolute",
    transform: [{ translateX: -30 }, { translateY: -30 }],
    width: 60,
    height: 60,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10
  },
  pulseRing: {
    position: "absolute",
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2.5,
    borderColor: palette.acidYellow,
    backgroundColor: "rgba(246, 214, 92, 0.35)"
  },
  pulseCenter: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: palette.acidYellow,
    borderWidth: 2,
    borderColor: palette.ink,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: palette.ink,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.9,
    shadowRadius: 0
  },
  tooltipCard: {
    position: "absolute",
    left: 20,
    right: 20,
    backgroundColor: palette.paperCream,
    borderWidth: 2,
    borderColor: palette.ink,
    borderRadius: 12,
    padding: 16,
    gap: 10,
    shadowColor: palette.ink,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.9,
    shadowRadius: 0,
    zIndex: 20
  },
  positionTop: {
    top: 100
  },
  positionBottom: {
    bottom: 95
  },
  tooltipHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  badgePill: {
    backgroundColor: palette.acidYellow,
    borderWidth: 1.5,
    borderColor: palette.ink,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "900",
    color: palette.ink,
    letterSpacing: 0.5
  },
  skipBtn: {
    paddingHorizontal: 6,
    paddingVertical: 3
  },
  skipBtnText: {
    fontSize: 11,
    fontWeight: "800",
    color: palette.mutedBrown
  },
  tooltipTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: palette.ink,
    letterSpacing: -0.3
  },
  tooltipDesc: {
    fontSize: 12,
    fontWeight: "700",
    color: palette.ink,
    lineHeight: 18
  },
  controlsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4
  },
  backBtn: {
    backgroundColor: palette.whitePaper,
    borderWidth: 1.5,
    borderColor: palette.ink,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: "center"
  },
  backBtnText: {
    fontSize: 12,
    fontWeight: "900",
    color: palette.ink
  },
  nextBtn: {
    flex: 1,
    backgroundColor: palette.acidYellow,
    borderWidth: 1.5,
    borderColor: palette.ink,
    borderRadius: 6,
    paddingVertical: 8,
    alignItems: "center",
    shadowColor: palette.ink,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.85,
    shadowRadius: 0
  },
  nextBtnText: {
    fontSize: 12,
    fontWeight: "900",
    color: palette.ink
  }
});
