import React, { useState } from "react";
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { palette } from "@frames/ui";
import { AppIcon } from "./AppIcon";
import { FrameButton } from "./FrameButton";
import { VoiceMemoryPlayer } from "./VoiceMemoryPlayer";
import { useAppStore, type TimeCapsule } from "../store/appStore";

const SEAL_COLORS = {
  crimson: { bg: "#8B1E1E", border: "#5E1111", text: "Crimson Seal" },
  gold: { bg: "#C99700", border: "#8C6A00", text: "Gold Royal Seal" },
  sapphire: { bg: "#1B4D89", border: "#11325C", text: "Sapphire Seal" },
  emerald: { bg: "#1E7348", border: "#11472B", text: "Emerald Seal" }
};

export function TimeCapsuleModal({
  visible,
  onClose
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const timeCapsules = useAppStore((state) => state.timeCapsules);
  const createTimeCapsule = useAppStore((state) => state.createTimeCapsule);
  const unlockTimeCapsule = useAppStore((state) => state.unlockTimeCapsule);
  const posts = useAppStore((state) => state.posts);

  const [activeTab, setActiveTab] = useState<"vault" | "create">("vault");
  const [selectedCapsule, setSelectedCapsule] = useState<TimeCapsule | null>(null);

  // New capsule form state
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [selectedSeal, setSelectedSeal] = useState<TimeCapsule["sealColor"]>("crimson");
  const [selectedPostId, setSelectedPostId] = useState<string>(posts[0]?.id ?? "");
  const [unlockYears, setUnlockYears] = useState(1);

  const handleCreate = () => {
    if (!title.trim()) return;
    const post = posts.find((p) => p.id === selectedPostId);
    const unlockDate = new Date(Date.now() + unlockYears * 365 * 86400000).toISOString();

    createTimeCapsule({
      title: title.trim(),
      note: note.trim(),
      mediaUrl: post?.mediaUrl || "https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=600",
      sealColor: selectedSeal,
      unlockDate
    });

    setTitle("");
    setNote("");
    setActiveTab("vault");
  };

  const handleBreakSeal = (capsuleId: string) => {
    unlockTimeCapsule(capsuleId);
    if (selectedCapsule) {
      setSelectedCapsule({ ...selectedCapsule, isUnlocked: true });
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>⏳ SECRET TIME CAPSULE VAULT</Text>
              </View>
              <Text style={styles.title}>Letters to the Future</Text>
            </View>
            <Pressable style={styles.closeBtn} onPress={onClose}>
              <AppIcon name="close" color={palette.ink} size={18} />
            </Pressable>
          </View>

          {/* Sub Navigation */}
          <View style={styles.tabRow}>
            <Pressable
              style={[styles.tab, activeTab === "vault" && styles.tabActive]}
              onPress={() => setActiveTab("vault")}
            >
              <Text style={[styles.tabText, activeTab === "vault" && styles.tabTextActive]}>
                Sealed Vault ({timeCapsules.length})
              </Text>
            </Pressable>
            <Pressable
              style={[styles.tab, activeTab === "create" && styles.tabActive]}
              onPress={() => setActiveTab("create")}
            >
              <Text style={[styles.tabText, activeTab === "create" && styles.tabTextActive]}>
                + Seal New Capsule
              </Text>
            </Pressable>
          </View>

          {/* Vault List Tab */}
          {activeTab === "vault" ? (
            <ScrollView contentContainerStyle={styles.scrollContent}>
              {timeCapsules.map((capsule) => {
                const unlockTs = new Date(capsule.unlockDate).getTime();
                const isReady = Date.now() >= unlockTs;
                const daysRemaining = Math.max(0, Math.ceil((unlockTs - Date.now()) / 86400000));
                const sealMeta = SEAL_COLORS[capsule.sealColor] || SEAL_COLORS.crimson;

                return (
                  <Pressable
                    key={capsule.id}
                    style={styles.capsuleCard}
                    onPress={() => setSelectedCapsule(capsule)}
                  >
                    {/* Wax Seal Emblem */}
                    <View style={[styles.waxSeal, { backgroundColor: sealMeta.bg, borderColor: sealMeta.border }]}>
                      <Text style={styles.waxSealEmblem}>⌛</Text>
                    </View>

                    <View style={styles.capsuleCardInfo}>
                      <Text style={styles.capsuleTitle}>{capsule.title}</Text>
                      <Text style={styles.capsuleSub}>
                        {capsule.isUnlocked
                          ? "🔓 Unlocked & Opened"
                          : isReady
                          ? "✨ Ready to break the wax seal!"
                          : `Locked for next ${daysRemaining} days`}
                      </Text>
                      <Text style={styles.capsuleDate}>
                        Unlock Date: {new Date(capsule.unlockDate).toLocaleDateString()}
                      </Text>
                    </View>

                    <View style={styles.cardArrow}>
                      <AppIcon name="spark" color={palette.ink} size={16} />
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          ) : (
            /* Create New Capsule Form */
            <ScrollView contentContainerStyle={styles.createScrollContent}>
              <Text style={styles.inputLabel}>Capsule Title</Text>
              <TextInput
                placeholder="e.g., For Baby's 18th Birthday, Next Mother's Day..."
                placeholderTextColor="#998675"
                style={styles.input}
                value={title}
                onChangeText={setTitle}
              />

              <Text style={styles.inputLabel}>Secret Message / Love Letter</Text>
              <TextInput
                placeholder="Write what you want them to remember about right now..."
                placeholderTextColor="#998675"
                style={[styles.input, styles.textArea]}
                multiline
                numberOfLines={4}
                value={note}
                onChangeText={setNote}
              />

              <Text style={styles.inputLabel}>Lock Duration</Text>
              <View style={styles.yearsRow}>
                {[1, 3, 5, 10, 18].map((y) => (
                  <Pressable
                    key={y}
                    style={[styles.yearChip, unlockYears === y && styles.yearChipActive]}
                    onPress={() => setUnlockYears(y)}
                  >
                    <Text style={[styles.yearChipText, unlockYears === y && styles.yearChipTextActive]}>
                      {y} {y === 1 ? "Year" : "Years"}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.inputLabel}>Choose Wax Seal Color</Text>
              <View style={styles.sealPickerRow}>
                {(["crimson", "gold", "sapphire", "emerald"] as const).map((col) => (
                  <Pressable
                    key={col}
                    style={[
                      styles.sealOption,
                      { backgroundColor: SEAL_COLORS[col].bg },
                      selectedSeal === col && styles.sealOptionActive
                    ]}
                    onPress={() => setSelectedSeal(col)}
                  >
                    <Text style={{ color: "#FFF", fontSize: 18 }}>⚜️</Text>
                  </Pressable>
                ))}
              </View>

              <View style={{ marginTop: 20 }}>
                <FrameButton icon="check" label="Seal Memory with Wax ⌛" onPress={handleCreate} />
              </View>
            </ScrollView>
          )}

          {/* Capsule Detail / Break Seal Modal */}
          {selectedCapsule ? (
            <Modal visible transparent animationType="fade" onRequestClose={() => setSelectedCapsule(null)}>
              <View style={styles.inspectOverlay}>
                <View style={styles.inspectCard}>
                  <View
                    style={[
                      styles.waxSealLarge,
                      {
                        backgroundColor: SEAL_COLORS[selectedCapsule.sealColor]?.bg ?? "#8B1E1E",
                        borderColor: SEAL_COLORS[selectedCapsule.sealColor]?.border ?? "#5E1111"
                      }
                    ]}
                  >
                    <Text style={{ fontSize: 32 }}>{selectedCapsule.isUnlocked ? "🔓" : "⌛"}</Text>
                  </View>

                  <Text style={styles.inspectTitle}>{selectedCapsule.title}</Text>

                  {selectedCapsule.isUnlocked ? (
                    <View style={styles.unlockedContent}>
                      <Image source={{ uri: selectedCapsule.mediaUrl }} style={styles.inspectImage} />
                      <Text style={styles.inspectLetterHeading}>The Secret Letter:</Text>
                      <Text style={styles.inspectNote}>"{selectedCapsule.note}"</Text>
                    </View>
                  ) : (
                    <View style={styles.lockedNoticeBox}>
                      <Text style={styles.lockedNoticeTitle}>Wax Seal Is Intact</Text>
                      <Text style={styles.lockedNoticeSub}>
                        This memory is protected and cannot be viewed until{" "}
                        {new Date(selectedCapsule.unlockDate).toLocaleDateString()}.
                      </Text>

                      <Pressable
                        style={styles.breakSealEarlyBtn}
                        onPress={() => handleBreakSeal(selectedCapsule.id)}
                      >
                        <Text style={styles.breakSealEarlyText}>Break Wax Seal Early 💥</Text>
                      </Pressable>
                    </View>
                  )}

                  <Pressable style={styles.inspectCloseBtn} onPress={() => setSelectedCapsule(null)}>
                    <Text style={styles.inspectCloseText}>Close Vault</Text>
                  </Pressable>
                </View>
              </View>
            </Modal>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end"
  },
  container: {
    height: "85%",
    backgroundColor: palette.paperCream,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 2,
    borderColor: palette.ink,
    overflow: "hidden"
  },
  header: {
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottomWidth: 1.5,
    borderColor: "#E5D7C3"
  },
  headerLeft: {
    flex: 1
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: "#FFE5D9",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E07A5F",
    marginBottom: 4
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#9C3D24",
    letterSpacing: 0.5
  },
  title: {
    fontSize: 22,
    fontWeight: "900",
    color: palette.ink
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: palette.whitePaper,
    borderWidth: 1,
    borderColor: palette.ink,
    alignItems: "center",
    justifyContent: "center"
  },
  tabRow: {
    flexDirection: "row",
    backgroundColor: "#EAE0D2",
    padding: 6,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 10
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 8
  },
  tabActive: {
    backgroundColor: palette.whitePaper,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  tabText: {
    fontSize: 12,
    fontWeight: "700",
    color: palette.mutedBrown
  },
  tabTextActive: {
    fontWeight: "900",
    color: palette.ink
  },
  scrollContent: {
    padding: 16,
    gap: 12
  },
  capsuleCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: palette.whitePaper,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E2D3B8",
    shadowColor: palette.ink,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 0,
    elevation: 3,
    gap: 14
  },
  waxSeal: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 4
  },
  waxSealEmblem: {
    fontSize: 18
  },
  capsuleCardInfo: {
    flex: 1
  },
  capsuleTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: palette.ink,
    marginBottom: 2
  },
  capsuleSub: {
    fontSize: 12,
    fontWeight: "700",
    color: "#B45309"
  },
  capsuleDate: {
    fontSize: 10,
    color: palette.mutedBrown,
    marginTop: 2
  },
  cardArrow: {
    padding: 4
  },
  createScrollContent: {
    padding: 20
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "900",
    color: palette.ink,
    marginBottom: 6,
    marginTop: 12
  },
  input: {
    backgroundColor: "#FFF",
    borderWidth: 1.5,
    borderColor: "#DCD0BD",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: palette.ink
  },
  textArea: {
    height: 90,
    textAlignVertical: "top"
  },
  yearsRow: {
    flexDirection: "row",
    gap: 8
  },
  yearChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#EAE0D2",
    alignItems: "center"
  },
  yearChipActive: {
    backgroundColor: palette.acidYellow,
    borderWidth: 1.5,
    borderColor: palette.ink
  },
  yearChipText: {
    fontSize: 11,
    fontWeight: "700",
    color: palette.mutedBrown
  },
  yearChipTextActive: {
    fontWeight: "900",
    color: palette.ink
  },
  sealPickerRow: {
    flexDirection: "row",
    gap: 12
  },
  sealOption: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "transparent"
  },
  sealOptionActive: {
    borderColor: palette.ink,
    transform: [{ scale: 1.1 }]
  },
  inspectOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    padding: 20
  },
  inspectCard: {
    backgroundColor: palette.paperCream,
    borderRadius: 18,
    padding: 20,
    borderWidth: 2,
    borderColor: palette.ink,
    alignItems: "center"
  },
  waxSealLarge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12
  },
  inspectTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: palette.ink,
    textAlign: "center",
    marginBottom: 14
  },
  unlockedContent: {
    width: "100%",
    alignItems: "center"
  },
  inspectImage: {
    width: "100%",
    height: 200,
    borderRadius: 10,
    marginBottom: 12
  },
  inspectLetterHeading: {
    fontSize: 12,
    fontWeight: "900",
    color: palette.mutedBrown,
    alignSelf: "flex-start",
    marginBottom: 4
  },
  inspectNote: {
    fontSize: 14,
    fontStyle: "italic",
    color: palette.ink,
    lineHeight: 20,
    textAlign: "center",
    marginBottom: 16
  },
  lockedNoticeBox: {
    backgroundColor: "#FBECE6",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EAB6A3",
    alignItems: "center",
    marginBottom: 16,
    width: "100%"
  },
  lockedNoticeTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#9C3D24",
    marginBottom: 4
  },
  lockedNoticeSub: {
    fontSize: 12,
    color: "#7D3D2A",
    textAlign: "center",
    lineHeight: 16,
    marginBottom: 14
  },
  breakSealEarlyBtn: {
    backgroundColor: "#E05A47",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8
  },
  breakSealEarlyText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#FFF"
  },
  inspectCloseBtn: {
    paddingVertical: 8
  },
  inspectCloseText: {
    fontSize: 13,
    fontWeight: "800",
    color: palette.mutedBrown
  }
});
