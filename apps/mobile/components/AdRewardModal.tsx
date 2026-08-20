import { useEffect, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { palette } from "@frames/ui";
import { AppIcon } from "./AppIcon";

export function AdRewardModal({
  visible,
  rewardTitle = "Pro 35mm Filter",
  onClose,
  onRewardEarned
}: {
  visible: boolean;
  rewardTitle?: string;
  onClose: () => void;
  onRewardEarned: () => void;
}) {
  const [secondsLeft, setSecondsLeft] = useState(5);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (!visible) {
      setSecondsLeft(5);
      setCompleted(false);
      return;
    }

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setCompleted(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [visible]);

  const handleClaim = () => {
    onRewardEarned();
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.badgeRow}>
            <View style={styles.adBadge}>
              <Text style={styles.adBadgeText}>REWARDED VIDEO AD</Text>
            </View>
            <Text style={styles.timerText}>{completed ? "Ad Finished ✓" : `Ad Playing... ${secondsLeft}s`}</Text>
          </View>

          <View style={styles.adBox}>
            <AppIcon name="spark" color={palette.acidYellow} size={42} />
            <Text style={styles.adContentTitle}>Frames Sponsor Showcase</Text>
            <Text style={styles.adContentSub}>Google AdMob Rewarded Video Unit. Watch 5 seconds to unlock your free reward!</Text>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${((5 - secondsLeft) / 5) * 100}%` }]} />
            </View>
          </View>

          {completed ? (
            <Pressable style={styles.claimBtn} onPress={handleClaim}>
              <Text style={styles.claimBtnText}>Claim Reward: {rewardTitle} 🎉</Text>
            </Pressable>
          ) : (
            <View style={styles.disabledBtn}>
              <Text style={styles.disabledBtnText}>Watching Video Ad ({secondsLeft}s)...</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(17, 17, 17, 0.82)",
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
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  adBadge: {
    backgroundColor: palette.acidYellow,
    borderWidth: 1.5,
    borderColor: palette.ink,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4
  },
  adBadgeText: {
    fontSize: 10,
    fontWeight: "900",
    color: palette.ink,
    letterSpacing: 0.5
  },
  timerText: {
    fontSize: 12,
    fontWeight: "800",
    color: palette.mutedBrown
  },
  adBox: {
    backgroundColor: palette.ink,
    borderRadius: 10,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 10
  },
  adContentTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: palette.whitePaper,
    textAlign: "center"
  },
  adContentSub: {
    fontSize: 12,
    fontWeight: "700",
    color: palette.sunshine,
    textAlign: "center",
    lineHeight: 18
  },
  progressBarBg: {
    width: "100%",
    height: 8,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 4,
    marginTop: 8,
    overflow: "hidden"
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: palette.acidYellow
  },
  claimBtn: {
    backgroundColor: palette.acidYellow,
    borderWidth: 2,
    borderColor: palette.ink,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    shadowColor: palette.ink,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.9,
    shadowRadius: 0
  },
  claimBtnText: {
    fontSize: 14,
    fontWeight: "900",
    color: palette.ink
  },
  disabledBtn: {
    backgroundColor: palette.whitePaper,
    borderWidth: 1.5,
    borderColor: palette.mutedBrown,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center"
  },
  disabledBtnText: {
    fontSize: 13,
    fontWeight: "800",
    color: palette.mutedBrown
  }
});
