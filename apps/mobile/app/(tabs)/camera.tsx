import { router } from "expo-router";
import Feather from "@expo/vector-icons/Feather";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { palette } from "@frames/ui";
import { useAppStore } from "../../store/appStore";

export default function CameraScreen() {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<"front" | "back">("back");
  const [flash, setFlash] = useState<"off" | "on">("off");
  const setPendingMediaUrl = useAppStore((state) => state.setPendingMediaUrl);

  const openEditor = (uri: string) => {
    setPendingMediaUrl(uri);
    router.push("/editor");
  };

  const takePhoto = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) return;
    }
    const photo = await cameraRef.current?.takePictureAsync({ quality: 0.85 });
    if (photo?.uri) openEditor(photo.uri);
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      quality: 0.9,
      allowsEditing: true
    });
    if (!result.canceled && result.assets[0]?.uri) openEditor(result.assets[0].uri);
  };

  const preview = permission?.granted ? (
    <CameraView ref={cameraRef} style={styles.preview} facing={facing} flash={flash}>
      {renderOverlay()}
    </CameraView>
  ) : (
    <View style={[styles.preview, styles.permissionPreview]}>
      <View style={styles.permissionCard}>
        <Text style={styles.permissionTitle}>Camera access</Text>
        <Text style={styles.permissionCopy}>Allow camera access to capture a real Frame, or choose from your gallery.</Text>
        <FrameCameraButton label="Allow Camera" onPress={() => { void requestPermission(); }} />
        <FrameCameraButton label="Open Gallery" onPress={pickImage} variant="light" />
      </View>
      {renderOverlay(false)}
    </View>
  );

  function renderOverlay(showShutter = true) {
    return (
      <>
        <View style={styles.topBar}>
          <Pressable style={styles.icon} onPress={() => setFlash((value) => (value === "on" ? "off" : "on"))}><Feather name="zap" color={palette.whitePaper} size={22} /></Pressable>
          <Text style={styles.title}>Capture</Text>
          <Pressable style={styles.icon} onPress={() => setFacing((value) => (value === "back" ? "front" : "back"))}><Feather name="repeat" color={palette.whitePaper} size={22} /></Pressable>
        </View>
        <View style={styles.bottomBar}>
          <Pressable style={styles.gallery} onPress={pickImage}><Feather name="image" color={palette.ink} size={22} /></Pressable>
          <Pressable style={styles.shutter} onPress={showShutter ? takePhoto : () => { void requestPermission(); }}><Feather name="camera" color={palette.ink} size={34} /></Pressable>
          <View style={styles.gallery} />
        </View>
      </>
    );
  }

  return (
    <View style={styles.container}>
      {preview}
    </View>
  );
}

function FrameCameraButton({ label, onPress, variant = "dark" }: { label: string; onPress: () => void; variant?: "dark" | "light" }) {
  return (
    <Pressable style={[styles.permissionButton, variant === "light" && styles.permissionButtonLight]} onPress={onPress}>
      <Text style={[styles.permissionButtonText, variant === "light" && styles.permissionButtonTextLight]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.ink },
  preview: { flex: 1, justifyContent: "space-between" },
  permissionPreview: { backgroundColor: palette.ink },
  topBar: { paddingTop: 58, paddingHorizontal: 22, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { color: palette.whitePaper, fontSize: 18, fontWeight: "900" },
  icon: { width: 46, height: 46, borderRadius: 23, backgroundColor: "rgba(52,43,42,.36)", alignItems: "center", justifyContent: "center" },
  bottomBar: { paddingBottom: 42, paddingHorizontal: 34, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  shutter: { width: 86, height: 86, borderRadius: 43, backgroundColor: palette.whitePaper, alignItems: "center", justifyContent: "center", borderWidth: 6, borderColor: palette.softPeach },
  gallery: { width: 52, height: 52, borderRadius: 8, backgroundColor: palette.whitePaper, alignItems: "center", justifyContent: "center" },
  permissionCard: { marginTop: 132, marginHorizontal: 22, padding: 18, backgroundColor: "rgba(255,253,248,.94)", borderRadius: 8, gap: 12 },
  permissionTitle: { color: palette.ink, fontSize: 24, fontWeight: "900" },
  permissionCopy: { color: palette.mutedBrown, fontSize: 15, lineHeight: 22 },
  permissionButton: { minHeight: 48, borderRadius: 24, backgroundColor: palette.ink, alignItems: "center", justifyContent: "center" },
  permissionButtonLight: { backgroundColor: palette.whitePaper, borderWidth: 1, borderColor: "#E4D9CA" },
  permissionButtonText: { color: palette.whitePaper, fontWeight: "900" },
  permissionButtonTextLight: { color: palette.ink }
});
