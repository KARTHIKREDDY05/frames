import React, { useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { Link, router } from "expo-router";
import { palette } from "@frames/ui";
import { AppIcon } from "./AppIcon";
import { FrameButton } from "./FrameButton";
import { VoiceMemoryPlayer } from "./VoiceMemoryPlayer";
import { useAppStore, type FridgeMagnetItem } from "../store/appStore";

const MAGNET_ICONS: Record<FridgeMagnetItem["magnetType"], string> = {
  cherry: "🍒",
  lemon: "🍋",
  star: "⭐",
  flower: "🌸",
  heart: "❤️",
  clover: "🍀",
  polaroid_clip: "📎"
};

export function FridgeDoorView({ onOpenOrderModal }: { onOpenOrderModal?: () => void }) {
  const fridgeItems = useAppStore((state) => state.fridgeItems);
  const pinToFridge = useAppStore((state) => state.pinToFridge);
  const unpinFromFridge = useAppStore((state) => state.unpinFromFridge);
  const posts = useAppStore((state) => state.posts);
  const voiceMemories = useAppStore((state) => state.voiceMemories);

  const [selectedItem, setSelectedItem] = useState<FridgeMagnetItem | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string>(posts[0]?.id ?? "");
  const [customCaption, setCustomCaption] = useState("");
  const [selectedMagnet, setSelectedMagnet] = useState<FridgeMagnetItem["magnetType"]>("cherry");
  const [stickyNotes, setStickyNotes] = useState([
    { id: "note-1", text: "Mom's birthday in 3 days! 🎂 Order cake!", color: "#FFF9A6", rotate: -2 },
    { id: "note-2", text: "Baby laughed at the bubbles today 🫧❤️", color: "#FFD1DC", rotate: 3 }
  ]);
  const [newStickyText, setNewStickyText] = useState("");

  const handlePin = () => {
    const post = posts.find((p) => p.id === selectedPostId);
    if (!post) return;
    pinToFridge({
      postId: post.id,
      mediaUrl: post.mediaUrl,
      caption: customCaption.trim() || post.caption || "A happy moment on the fridge",
      magnetType: selectedMagnet,
      rotation: Math.floor(Math.random() * 8) - 4
    });
    setShowAddModal(false);
    setCustomCaption("");
  };

  const handleAddSticky = () => {
    if (!newStickyText.trim()) return;
    setStickyNotes((prev) => [
      ...prev,
      {
        id: `note-${Date.now()}`,
        text: newStickyText.trim(),
        color: ["#FFF9A6", "#FFD1DC", "#D4F1F4", "#E3D7FF"][Math.floor(Math.random() * 4)]!,
        rotate: Math.floor(Math.random() * 6) - 3
      }
    ]);
    setNewStickyText("");
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Fridge Enamel Surface Header */}
      <View style={styles.fridgeDoorHeader}>
        <View style={styles.handleBar} />
        <View style={styles.headerInfo}>
          <View style={styles.fridgeBadge}>
            <Text style={styles.fridgeBadgeText}>🧲 FAMILY FRIDGE DOOR</Text>
          </View>
          <Text style={styles.fridgeTitle}>Kitchen Memories</Text>
          <Text style={styles.fridgeSubtitle}>
            Pinned with love • Tap any Polaroid to inspect or print real magnets
          </Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable style={styles.addPinBtn} onPress={() => setShowAddModal(true)}>
            <AppIcon name="spark" color={palette.ink} size={14} />
            <Text style={styles.addPinBtnText}>+ Pin Snap</Text>
          </Pressable>
        </View>
      </View>

      {/* Interactive Fridge Canvas Grid */}
      <View style={styles.fridgeCanvas}>
        {/* Sticky Notes Row */}
        <View style={styles.stickyRow}>
          {stickyNotes.map((note) => (
            <View
              key={note.id}
              style={[
                styles.stickyNote,
                { backgroundColor: note.color, transform: [{ rotate: `${note.rotate}deg` }] }
              ]}
            >
              <View style={styles.stickyPushpin}>
                <Text style={{ fontSize: 12 }}>📍</Text>
              </View>
              <Text style={styles.stickyText}>{note.text}</Text>
            </View>
          ))}
        </View>

        {/* Polaroid Fridge Items */}
        <View style={styles.polaroidsGrid}>
          {fridgeItems.map((item) => {
            const hasVoice = voiceMemories.some((v) => v.postId === item.postId);
            return (
              <Pressable
                key={item.id}
                style={[
                  styles.fridgePolaroid,
                  { transform: [{ rotate: `${item.rotation}deg` }] }
                ]}
                onPress={() => setSelectedItem(item)}
              >
                {/* 3D Cute Magnet at top center */}
                <View style={styles.magnetHead}>
                  <Text style={styles.magnetEmoji}>{MAGNET_ICONS[item.magnetType]}</Text>
                </View>

                {/* Photo */}
                <Image source={{ uri: item.mediaUrl }} style={styles.polaroidImage} />

                {/* Caption & Voice Indicator */}
                <View style={styles.polaroidBottom}>
                  <Text numberOfLines={2} style={styles.polaroidCaption}>
                    {item.caption || "Today's frame"}
                  </Text>
                  {hasVoice ? (
                    <View style={styles.voicePill}>
                      <Text style={styles.voicePillText}>🎙️ Voice</Text>
                    </View>
                  ) : null}
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* Quick Add Sticky Note Input */}
        <View style={styles.stickyAddBox}>
          <TextInput
            placeholder="Write a quick sticky note for the fridge..."
            placeholderTextColor="#8C7A68"
            style={styles.stickyInput}
            value={newStickyText}
            onChangeText={setNewStickyText}
            onSubmitEditing={handleAddSticky}
          />
          <Pressable style={styles.stickyAddBtn} onPress={handleAddSticky}>
            <Text style={styles.stickyAddBtnText}>Stick 📍</Text>
          </Pressable>
        </View>

        {/* Order Magnet CTA Banner */}
        <View style={styles.orderMagnetBanner}>
          <View style={styles.orderBannerLeft}>
            <Text style={styles.orderBannerTitle}>Turn these into real fridge magnets! 🎁</Text>
            <Text style={styles.orderBannerSub}>High-gloss 3x3 magnetic polaroid prints delivered to your doorstep.</Text>
          </View>
          <Pressable
            style={styles.orderBannerBtn}
            onPress={() => {
              if (onOpenOrderModal) {
                onOpenOrderModal();
              } else {
                router.push("/orders");
              }
            }}
          >
            <Text style={styles.orderBannerBtnText}>Order Pack</Text>
          </Pressable>
        </View>
      </View>

      {/* Selected Polaroid Inspection Modal */}
      {selectedItem ? (
        <Modal visible transparent animationType="slide" onRequestClose={() => setSelectedItem(null)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalMagnetHead}>
                <Text style={{ fontSize: 24 }}>{MAGNET_ICONS[selectedItem.magnetType]}</Text>
              </View>

              <Image source={{ uri: selectedItem.mediaUrl }} style={styles.modalImage} />

              <Text style={styles.modalCaption}>{selectedItem.caption}</Text>

              {/* Check if there's voice memory */}
              {voiceMemories
                .filter((v) => v.postId === selectedItem.postId)
                .map((vm) => (
                  <VoiceMemoryPlayer key={vm.id} memory={vm} />
                ))}

              <View style={styles.modalActions}>
                <Pressable
                  style={styles.modalOrderBtn}
                  onPress={() => {
                    setSelectedItem(null);
                    if (onOpenOrderModal) onOpenOrderModal();
                    else router.push("/orders");
                  }}
                >
                  <AppIcon name="shopping-bag" color={palette.ink} size={16} />
                  <Text style={styles.modalOrderBtnText}>Order Magnet (₹399)</Text>
                </Pressable>

                <Pressable
                  style={styles.modalUnpinBtn}
                  onPress={() => {
                    unpinFromFridge(selectedItem.id);
                    setSelectedItem(null);
                  }}
                >
                  <Text style={styles.modalUnpinText}>Unpin from Fridge</Text>
                </Pressable>

                <Pressable style={styles.modalCloseBtn} onPress={() => setSelectedItem(null)}>
                  <Text style={styles.modalCloseText}>Close</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      ) : null}

      {/* Pin to Fridge Selection Modal */}
      {showAddModal ? (
        <Modal visible transparent animationType="fade" onRequestClose={() => setShowAddModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Pin a Memory to Fridge</Text>
              <Text style={styles.modalSubtitle}>Pick a snap and choose your favorite magnet</Text>

              {/* Magnet Selector */}
              <View style={styles.magnetSelectorRow}>
                {(["cherry", "lemon", "star", "flower", "heart", "clover"] as const).map((m) => (
                  <Pressable
                    key={m}
                    style={[styles.magnetOption, selectedMagnet === m && styles.magnetOptionActive]}
                    onPress={() => setSelectedMagnet(m)}
                  >
                    <Text style={{ fontSize: 20 }}>{MAGNET_ICONS[m]}</Text>
                  </Pressable>
                ))}
              </View>

              {/* Post selector */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.postPickerRow}>
                {posts.map((p) => (
                  <Pressable
                    key={p.id}
                    style={[styles.postPickerItem, selectedPostId === p.id && styles.postPickerItemActive]}
                    onPress={() => setSelectedPostId(p.id)}
                  >
                    <Image source={{ uri: p.mediaUrl }} style={styles.postPickerThumb} />
                  </Pressable>
                ))}
              </ScrollView>

              <TextInput
                placeholder="Custom fridge caption (optional)..."
                placeholderTextColor="#A09280"
                style={styles.captionInput}
                value={customCaption}
                onChangeText={setCustomCaption}
              />

              <View style={{ gap: 10, marginTop: 12 }}>
                <FrameButton icon="check" label="Stick on Fridge 🧲" onPress={handlePin} />
                <FrameButton icon="close" label="Cancel" variant="secondary" onPress={() => setShowAddModal(false)} />
              </View>
            </View>
          </View>
        </Modal>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 40
  },
  fridgeDoorHeader: {
    backgroundColor: "#E8EEF1",
    borderBottomWidth: 3,
    borderColor: "#C5D3D9",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  handleBar: {
    width: 6,
    height: 48,
    borderRadius: 3,
    backgroundColor: "#A2B3BB",
    marginRight: 12
  },
  headerInfo: {
    flex: 1
  },
  fridgeBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#C9E4E8",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#90C4CC",
    marginBottom: 4
  },
  fridgeBadgeText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#2C6B74",
    letterSpacing: 0.5
  },
  fridgeTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#1F2E35"
  },
  fridgeSubtitle: {
    fontSize: 11,
    color: "#5B737E",
    fontWeight: "600"
  },
  headerActions: {
    marginLeft: 8
  },
  addPinBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: palette.acidYellow,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: palette.ink
  },
  addPinBtnText: {
    fontSize: 12,
    fontWeight: "900",
    color: palette.ink
  },
  fridgeCanvas: {
    backgroundColor: "#F0F4F6",
    padding: 16,
    minHeight: 500
  },
  stickyRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 20
  },
  stickyNote: {
    width: "47%",
    minHeight: 80,
    padding: 12,
    borderRadius: 4,
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 3,
    position: "relative"
  },
  stickyPushpin: {
    position: "absolute",
    top: -8,
    left: "45%"
  },
  stickyText: {
    fontSize: 12,
    fontFamily: Platform.OS === "ios" ? "Snell Roundhand" : "monospace",
    color: "#423223",
    lineHeight: 16,
    fontWeight: "700"
  },
  polaroidsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 16,
    marginBottom: 24
  },
  fridgePolaroid: {
    width: "47%",
    backgroundColor: "#FFFFFF",
    padding: 10,
    paddingBottom: 14,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E2D9CB",
    shadowColor: "#000",
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 3,
    elevation: 5,
    alignItems: "center",
    position: "relative"
  },
  magnetHead: {
    position: "absolute",
    top: -12,
    zIndex: 10,
    backgroundColor: "#FFFFFF",
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 4
  },
  magnetEmoji: {
    fontSize: 16
  },
  polaroidImage: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 4,
    backgroundColor: "#EEE"
  },
  polaroidBottom: {
    width: "100%",
    marginTop: 8
  },
  polaroidCaption: {
    fontSize: 11,
    fontWeight: "700",
    color: palette.ink,
    textAlign: "center"
  },
  voicePill: {
    alignSelf: "center",
    backgroundColor: "#FFECC8",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 4
  },
  voicePillText: {
    fontSize: 9,
    fontWeight: "900",
    color: "#8B5704"
  },
  stickyAddBox: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: "#FFFFFF",
    padding: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#C5D3D9",
    marginBottom: 20
  },
  stickyInput: {
    flex: 1,
    fontSize: 13,
    color: palette.ink,
    paddingHorizontal: 8
  },
  stickyAddBtn: {
    backgroundColor: "#FFF9A6",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D9CF5A",
    alignItems: "center",
    justifyContent: "center"
  },
  stickyAddBtnText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#5B5203"
  },
  orderMagnetBanner: {
    backgroundColor: "#FFF8E7",
    borderWidth: 2,
    borderColor: palette.ink,
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: palette.ink,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.9,
    shadowRadius: 0,
    elevation: 4
  },
  orderBannerLeft: {
    flex: 1,
    marginRight: 12
  },
  orderBannerTitle: {
    fontSize: 13,
    fontWeight: "900",
    color: palette.ink,
    marginBottom: 2
  },
  orderBannerSub: {
    fontSize: 11,
    color: palette.mutedBrown,
    fontWeight: "600"
  },
  orderBannerBtn: {
    backgroundColor: "#E05A47",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: palette.ink
  },
  orderBannerBtnText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#FFFFFF"
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "center",
    padding: 24
  },
  modalCard: {
    backgroundColor: palette.paperCream,
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: palette.ink,
    shadowColor: palette.ink,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.9,
    shadowRadius: 0,
    elevation: 8,
    position: "relative"
  },
  modalMagnetHead: {
    position: "absolute",
    top: -16,
    alignSelf: "center",
    backgroundColor: "#FFF",
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: palette.ink
  },
  modalImage: {
    width: "100%",
    height: 240,
    borderRadius: 8,
    marginTop: 10,
    marginBottom: 12
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: palette.ink,
    textAlign: "center"
  },
  modalSubtitle: {
    fontSize: 12,
    color: palette.mutedBrown,
    textAlign: "center",
    marginBottom: 14
  },
  modalCaption: {
    fontSize: 15,
    fontWeight: "800",
    color: palette.ink,
    textAlign: "center",
    marginBottom: 14
  },
  magnetSelectorRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    marginBottom: 14
  },
  magnetOption: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#DDD",
    alignItems: "center",
    justifyContent: "center"
  },
  magnetOptionActive: {
    borderColor: palette.ink,
    borderWidth: 2,
    backgroundColor: palette.acidYellow
  },
  postPickerRow: {
    flexDirection: "row",
    marginBottom: 12
  },
  postPickerItem: {
    marginRight: 8,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "transparent",
    overflow: "hidden"
  },
  postPickerItemActive: {
    borderColor: "#E05A47"
  },
  postPickerThumb: {
    width: 60,
    height: 60
  },
  captionInput: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#DCD0BD",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: palette.ink
  },
  modalActions: {
    gap: 8,
    marginTop: 8
  },
  modalOrderBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: palette.acidYellow,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: palette.ink
  },
  modalOrderBtnText: {
    fontSize: 13,
    fontWeight: "900",
    color: palette.ink
  },
  modalUnpinBtn: {
    paddingVertical: 8,
    alignItems: "center"
  },
  modalUnpinText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#A83232"
  },
  modalCloseBtn: {
    paddingVertical: 6,
    alignItems: "center"
  },
  modalCloseText: {
    fontSize: 12,
    fontWeight: "700",
    color: palette.mutedBrown
  }
});
