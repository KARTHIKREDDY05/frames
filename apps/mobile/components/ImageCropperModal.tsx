import { useState } from "react";
import { Image, Modal, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { palette } from "@frames/ui";
import { AppIcon } from "./AppIcon";

export type CropRatio = "1:1" | "4:5" | "9:16" | "original";
export type CropShape = "rect" | "circle";

interface ImageCropperModalProps {
  visible: boolean;
  imageUri: string | null;
  shape?: CropShape;
  initialRatio?: CropRatio;
  title?: string;
  onCancel: () => void;
  onConfirm: (croppedUri: string, meta: { ratio: CropRatio; zoom: number; rotation: number }) => void;
}

export function ImageCropperModal({
  visible,
  imageUri,
  shape = "rect",
  initialRatio = "1:1",
  title = "Crop & Frame Photo",
  onCancel,
  onConfirm
}: ImageCropperModalProps) {
  const [ratio, setRatio] = useState<CropRatio>(initialRatio);
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);

  if (!visible || !imageUri) return null;

  const rotate90 = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const adjustZoom = (delta: number) => {
    setZoom((prev) => Math.max(1, Math.min(3, +(prev + delta).toFixed(1))));
  };

  const handleApply = () => {
    // In React Native / Web, we pass the imageUri along with the crop / transform metadata
    onConfirm(imageUri, { ratio, zoom, rotation });
  };

  const getAspectRatioNumber = () => {
    switch (ratio) {
      case "1:1":
        return 1;
      case "4:5":
        return 4 / 5;
      case "9:16":
        return 9 / 16;
      default:
        return 1;
    }
  };

  const isCircle = shape === "circle";

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Pressable style={styles.headerBtn} onPress={onCancel}>
              <Text style={styles.headerBtnText}>Cancel</Text>
            </Pressable>
            <Text style={styles.headerTitle}>{title}</Text>
            <Pressable style={[styles.headerBtn, styles.headerDoneBtn]} onPress={handleApply}>
              <Text style={styles.headerDoneText}>Apply</Text>
            </Pressable>
          </View>

          {/* Viewport Canvas */}
          <View style={styles.canvasContainer}>
            <View
              style={[
                styles.cropFrame,
                {
                  aspectRatio: getAspectRatioNumber(),
                  borderRadius: isCircle ? 180 : 8
                }
              ]}
            >
              <Image
                source={{ uri: imageUri }}
                style={[
                  styles.image,
                  {
                    transform: [{ scale: zoom }, { rotate: `${rotation}deg` }]
                  }
                ]}
                resizeMode="cover"
              />

              {/* Grid overlay for rule of thirds */}
              <View style={styles.gridOverlay}>
                <View style={styles.gridRow}>
                  <View style={styles.gridCell} />
                  <View style={styles.gridCell} />
                  <View style={styles.gridCell} />
                </View>
                <View style={styles.gridRow}>
                  <View style={styles.gridCell} />
                  <View style={styles.gridCell} />
                  <View style={styles.gridCell} />
                </View>
                <View style={styles.gridRow}>
                  <View style={styles.gridCell} />
                  <View style={styles.gridCell} />
                  <View style={styles.gridCell} />
                </View>
              </View>

              {/* Mask Border */}
              <View style={[styles.maskBorder, isCircle && styles.maskBorderCircle]} pointerEvents="none" />
            </View>
          </View>

          {/* Ratio Selector Toolbar */}
          <View style={styles.toolbar}>
            <Text style={styles.sectionLabel}>ASPECT RATIO</Text>
            <View style={styles.ratioRow}>
              {(["1:1", "4:5", "9:16", "original"] as CropRatio[]).map((r) => (
                <Pressable
                  key={r}
                  style={[styles.ratioChip, ratio === r && styles.ratioChipActive]}
                  onPress={() => setRatio(r)}
                >
                  <Text style={[styles.ratioChipText, ratio === r && styles.ratioChipTextActive]}>
                    {r === "1:1" ? "1:1 Square" : r === "4:5" ? "4:5 Portrait" : r === "9:16" ? "9:16 Story" : "Original"}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Zoom & Rotation Controls */}
            <View style={styles.controlsRow}>
              <View style={styles.zoomControls}>
                <Text style={styles.controlLabel}>ZOOM ({zoom}x)</Text>
                <View style={styles.zoomButtons}>
                  <Pressable style={styles.zoomBtn} onPress={() => adjustZoom(-0.2)}>
                    <Text style={styles.zoomBtnText}>−</Text>
                  </Pressable>
                  <Pressable style={styles.zoomBtn} onPress={() => setZoom(1)}>
                    <Text style={styles.zoomBtnTextSmall}>1x</Text>
                  </Pressable>
                  <Pressable style={styles.zoomBtn} onPress={() => adjustZoom(0.2)}>
                    <Text style={styles.zoomBtnText}>+</Text>
                  </Pressable>
                </View>
              </View>

              <Pressable style={styles.rotateBtn} onPress={rotate90}>
                <AppIcon name="spark" color={palette.ink} size={16} />
                <Text style={styles.rotateText}>Rotate 90°</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(17, 17, 17, 0.85)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16
  },
  container: {
    width: "100%",
    maxWidth: 440,
    backgroundColor: palette.paperCream,
    borderWidth: 2,
    borderColor: palette.ink,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: palette.ink,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.95,
    shadowRadius: 0
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: palette.whitePaper,
    borderBottomWidth: 2,
    borderBottomColor: palette.ink
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: palette.ink,
    letterSpacing: -0.2
  },
  headerBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8
  },
  headerBtnText: {
    fontSize: 13,
    fontWeight: "800",
    color: palette.mutedBrown
  },
  headerDoneBtn: {
    backgroundColor: palette.acidYellow,
    borderWidth: 1.5,
    borderColor: palette.ink,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 5
  },
  headerDoneText: {
    fontSize: 12,
    fontWeight: "900",
    color: palette.ink
  },
  canvasContainer: {
    height: 300,
    backgroundColor: "#1A1817",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden"
  },
  cropFrame: {
    width: 240,
    maxHeight: 280,
    overflow: "hidden",
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000"
  },
  image: {
    width: "100%",
    height: "100%"
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.25
  },
  gridRow: {
    flex: 1,
    flexDirection: "row"
  },
  gridCell: {
    flex: 1,
    borderWidth: 0.5,
    borderColor: "#FFFFFF"
  },
  maskBorder: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 2,
    borderColor: palette.acidYellow
  },
  maskBorderCircle: {
    borderRadius: 180
  },
  toolbar: {
    padding: 16,
    gap: 12,
    backgroundColor: palette.whitePaper,
    borderTopWidth: 2,
    borderTopColor: palette.ink
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: "900",
    color: palette.mutedBrown,
    letterSpacing: 0.8
  },
  ratioRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6
  },
  ratioChip: {
    flex: 1,
    minWidth: 70,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: palette.ink,
    backgroundColor: palette.paperCream
  },
  ratioChipActive: {
    backgroundColor: palette.acidYellow,
    borderColor: palette.ink
  },
  ratioChipText: {
    fontSize: 10,
    fontWeight: "900",
    color: palette.mutedBrown
  },
  ratioChipTextActive: {
    color: palette.ink
  },
  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4
  },
  zoomControls: {
    gap: 4
  },
  controlLabel: {
    fontSize: 9,
    fontWeight: "900",
    color: palette.mutedBrown,
    letterSpacing: 0.5
  },
  zoomButtons: {
    flexDirection: "row",
    gap: 4
  },
  zoomBtn: {
    width: 32,
    height: 32,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: palette.ink,
    backgroundColor: palette.paperCream,
    alignItems: "center",
    justifyContent: "center"
  },
  zoomBtnText: {
    fontSize: 16,
    fontWeight: "900",
    color: palette.ink
  },
  zoomBtnTextSmall: {
    fontSize: 10,
    fontWeight: "900",
    color: palette.ink
  },
  rotateBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: palette.ink,
    backgroundColor: palette.softLavender
  },
  rotateText: {
    fontSize: 11,
    fontWeight: "900",
    color: palette.ink
  }
});
