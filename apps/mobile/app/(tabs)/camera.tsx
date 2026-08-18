import { router, useFocusEffect } from "expo-router";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { useCallback, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { PhotoFilter } from "@frames/types";
import { palette } from "@frames/ui";
import { AppIcon } from "../../components/AppIcon";
import { photoFilterOptions } from "../../components/PolaroidFrame";
import { useAppStore } from "../../store/appStore";

export default function CameraScreen() {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<"front" | "back">("back");
  const [flash, setFlash] = useState<"off" | "on">("off");
  const [selectedLens, setSelectedLens] = useState<PhotoFilter>("ORIGINAL");
  const [cameraMessage, setCameraMessage] = useState("");
  const [locationStatus, setLocationStatus] = useState("Location not checked");
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const setPendingMediaUrl = useAppStore((state) => state.setPendingMediaUrl);
  const setPendingCaptureMeta = useAppStore((state) => state.setPendingCaptureMeta);

  useFocusEffect(
    useCallback(() => {
      setCameraActive(true);
      setCameraMessage("");
      return () => {
        setCameraActive(false);
        setIsCameraReady(false);
        setIsCapturing(false);
        setFlash("off");
      };
    }, [])
  );

  const openEditor = async (uri: string) => {
    const location = await getCaptureLocation();
    setPendingMediaUrl(uri);
    setPendingCaptureMeta({
      filterPreset: selectedLens,
      locationName: location.locationName,
      latitude: location.latitude,
      longitude: location.longitude
    });
    router.push("/editor");
  };

  const getCaptureLocation = async () => {
    try {
      const permissionResult = await Location.requestForegroundPermissionsAsync();
      if (!permissionResult.granted) {
        setLocationStatus("Location off");
        return { locationName: null, latitude: null, longitude: null };
      }
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;
      let locationName = `${latitude.toFixed(3)}, ${longitude.toFixed(3)}`;
      try {
        const places = await Location.reverseGeocodeAsync({ latitude, longitude });
        const place = places[0];
        if (place) locationName = [place.city, place.region, place.country].filter(Boolean).join(", ") || locationName;
      } catch {
        // Coordinates are still useful even when reverse geocoding is unavailable.
      }
      setLocationStatus(`Location on - ${locationName}`);
      return { locationName, latitude, longitude };
    } catch {
      setLocationStatus("Location unavailable");
      return { locationName: null, latitude: null, longitude: null };
    }
  };

  const captureWithDeviceCamera = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      setCameraMessage("Camera permission is needed to take a Frame.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9
    });
    if (!result.canceled && result.assets[0]?.uri) await openEditor(result.assets[0].uri);
  };

  const takePhoto = async () => {
    if (isCapturing || !cameraActive) return;
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        await captureWithDeviceCamera();
        return;
      }
    }
    setIsCapturing(true);
    try {
      const photo = isCameraReady ? await cameraRef.current?.takePictureAsync({ quality: 0.85 }) : null;
      if (photo?.uri) {
        await openEditor(photo.uri);
        return;
      }
      await captureWithDeviceCamera();
    } catch {
      setCameraMessage("Live preview capture failed. Opening your device camera instead.");
      await captureWithDeviceCamera();
    } finally {
      setIsCapturing(false);
    }
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      setCameraMessage("Gallery permission is needed to choose a photo.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      quality: 0.9,
      allowsEditing: true
    });
    if (!result.canceled && result.assets[0]?.uri) await openEditor(result.assets[0].uri);
  };

  const toggleFlash = () => {
    if (facing === "front") {
      setFlash("off");
      setCameraMessage("Flash is available only on supported back cameras.");
      return;
    }
    setCameraMessage("");
    setFlash((value) => (value === "on" ? "off" : "on"));
  };

  const switchCamera = () => {
    setFlash("off");
    setCameraMessage("");
    setIsCameraReady(false);
    setFacing((value) => (value === "back" ? "front" : "back"));
  };

  const renderOverlay = (showShutter = true) => (
    <>
      <View style={styles.topBar}>
        <Pressable style={[styles.topIcon, flash === "on" && styles.topIconActive]} onPress={toggleFlash}>
          <AppIcon name="flash" color={palette.whitePaper} size={18} />
        </Pressable>
        <Text style={styles.title}>Frames</Text>
        <Pressable style={styles.topIcon} onPress={switchCamera}>
          <AppIcon name="switch" color={palette.whitePaper} size={18} />
        </Pressable>
      </View>
      {cameraMessage ? <Text style={styles.cameraMessage}>{cameraMessage}</Text> : null}
      <View pointerEvents="none" style={styles.guideWrap}>
        <LensOverlay lens={selectedLens} />
        <View style={styles.guideFrame}>
          <View style={styles.cornerTopLeft} />
          <View style={styles.cornerTopRight} />
          <View style={styles.cornerBottomLeft} />
          <View style={styles.cornerBottomRight} />
        </View>
      </View>
      <View style={styles.bottomBar}>
        <View style={styles.modeStrip}>
          <Text style={styles.modeMuted}>Live</Text>
          <Text style={styles.modeActive}>Photo</Text>
          <Text style={styles.modeMuted}>Upload</Text>
        </View>
        <View style={styles.lensStrip}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.lensContent}>
            {photoFilterOptions.map((lens) => (
              <Pressable key={lens.value} style={styles.lensButton} onPress={() => setSelectedLens(lens.value)}>
                <View style={[styles.lensPreview, selectedLens === lens.value && styles.lensActive, { backgroundColor: lens.tint === "transparent" ? "#FDFBF6" : lens.tint }]} />
                <Text style={[styles.lensText, selectedLens === lens.value && styles.lensTextActive]}>{lens.label}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
        <View style={styles.controlRow}>
        <Pressable style={styles.sideAction} onPress={pickImage}>
          <AppIcon name="gallery" size={22} />
          <Text style={styles.sideActionText}>Gallery</Text>
        </Pressable>
        <Pressable style={[styles.shutter, isCapturing && styles.shutterBusy]} disabled={isCapturing} onPress={showShutter ? takePhoto : () => { void takePhoto(); }}>
          <View style={styles.shutterInner} />
        </Pressable>
        <Pressable style={styles.sideAction} onPress={switchCamera}>
          <AppIcon name="switch" size={22} />
          <Text style={styles.sideActionText}>Flip</Text>
        </Pressable>
        </View>
        <Text style={styles.locationText}>{locationStatus}</Text>
      </View>
    </>
  );

  const preview = permission?.granted && cameraActive ? (
    <CameraView
      key={`${facing}-${flash}-${cameraActive ? "focused" : "blurred"}`}
      ref={cameraRef}
      style={styles.preview}
      facing={facing}
      flash={flash}
      enableTorch={facing === "back" && flash === "on"}
      onCameraReady={() => {
        setIsCameraReady(true);
        setCameraMessage("");
      }}
      onMountError={(event) => {
        setIsCameraReady(false);
        setCameraMessage(event.message || "Camera could not start on this device/browser. Tap the shutter to open your device camera.");
      }}
    >
      {renderOverlay()}
    </CameraView>
  ) : permission?.granted ? (
    <View style={styles.pausedPreview}>
      <View style={styles.permissionCard}>
        <View style={styles.permissionIcon}><AppIcon name="camera" color={palette.ink} size={34} /></View>
        <Text style={styles.permissionTitle}>Camera paused</Text>
        <Text style={styles.permissionCopy}>Open the Camera tab to start the live preview.</Text>
      </View>
    </View>
  ) : (
    <View style={styles.permissionPreview}>
      <View style={styles.permissionCard}>
        <View style={styles.permissionIcon}><AppIcon name="camera" color={palette.ink} size={34} /></View>
        <Text style={styles.permissionTitle}>Camera access</Text>
        <Text style={styles.permissionCopy}>Allow camera access to capture a real Frame, or choose from your gallery.</Text>
        <FrameCameraButton label="Allow Camera" onPress={() => { void takePhoto(); }} />
        <FrameCameraButton label="Open Device Camera" onPress={() => { void captureWithDeviceCamera(); }} variant="light" />
        <FrameCameraButton label="Open Gallery" onPress={() => { void pickImage(); }} variant="light" />
      </View>
    </View>
  );

  return <View style={styles.container}><View style={styles.stage}>{preview}</View></View>;
}

function LensOverlay({ lens }: { lens: PhotoFilter }) {
  const option = photoFilterOptions.find((item) => item.value === lens);
  if (!option || lens === "ORIGINAL") return null;
  return (
    <>
      <View style={[styles.lensWash, { backgroundColor: option.tint, opacity: option.opacity + 0.08 }]} />
      {lens === "NOIR" || lens === "DRAMA" ? <View style={styles.vignette} /> : null}
      {lens === "PUNCH" || lens === "CHROME" ? <View style={styles.contrastFrame} /> : null}
      {lens === "FADE" || lens === "SOFT" ? <View style={styles.softSheet} /> : null}
      {lens === "GRAIN" ? <View style={styles.cameraGrain}>{Array.from({ length: 9 }).map((_, index) => <View key={index} style={[styles.cameraGrainLine, { top: `${index * 11}%` }]} />)}</View> : null}
      {lens === "SUNSET" ? <View style={styles.sunsetBottom} /> : null}
    </>
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
  container: { flex: 1, backgroundColor: "#0F0D0D", alignItems: "center", justifyContent: "center" },
  stage: { flex: 1, width: "100%", maxWidth: 560, backgroundColor: "#0F0D0D", overflow: "hidden" },
  preview: { flex: 1 },
  pausedPreview: { flex: 1, backgroundColor: "#0F0D0D", alignItems: "center", justifyContent: "center", padding: 22 },
  permissionPreview: { flex: 1, backgroundColor: palette.ink, alignItems: "center", justifyContent: "center", padding: 22 },
  topBar: { position: "absolute", left: 0, right: 0, top: 0, zIndex: 30, paddingTop: 42, paddingHorizontal: 18, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { color: palette.whitePaper, fontSize: 17, fontWeight: "900", textShadowColor: "rgba(0,0,0,.4)", textShadowRadius: 8 },
  topIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: "rgba(0,0,0,.34)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,.14)" },
  topIconActive: { backgroundColor: "rgba(246,214,92,.42)", borderColor: "rgba(246,214,92,.85)" },
  cameraMessage: { position: "absolute", top: 94, left: 18, right: 18, zIndex: 28, padding: 10, borderRadius: 18, backgroundColor: "rgba(0,0,0,.44)", color: palette.whitePaper, fontWeight: "800", lineHeight: 18, textAlign: "center", overflow: "hidden" },
  guideWrap: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center", paddingHorizontal: 34, paddingTop: 80, paddingBottom: 176, position: "relative" },
  lensWash: { ...StyleSheet.absoluteFillObject },
  vignette: { ...StyleSheet.absoluteFillObject, borderWidth: 42, borderColor: "rgba(0,0,0,.26)" },
  contrastFrame: { ...StyleSheet.absoluteFillObject, borderWidth: 10, borderColor: "rgba(255,255,255,.06)" },
  softSheet: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(255,250,244,.12)" },
  cameraGrain: { ...StyleSheet.absoluteFillObject },
  cameraGrainLine: { position: "absolute", left: 0, right: 0, height: 1, backgroundColor: "rgba(255,255,255,.08)" },
  sunsetBottom: { position: "absolute", left: 0, right: 0, bottom: 0, height: "34%", backgroundColor: "rgba(255,94,43,.16)" },
  guideFrame: { width: "100%", maxWidth: 420, aspectRatio: 0.72, borderRadius: 28, borderWidth: 1, borderColor: "rgba(255,255,255,.42)", position: "relative" },
  cornerTopLeft: { position: "absolute", left: -1, top: -1, width: 26, height: 26, borderTopWidth: 3, borderLeftWidth: 3, borderColor: "rgba(255,255,255,.74)", borderTopLeftRadius: 22 },
  cornerTopRight: { position: "absolute", right: -1, top: -1, width: 26, height: 26, borderTopWidth: 3, borderRightWidth: 3, borderColor: "rgba(255,255,255,.74)", borderTopRightRadius: 22 },
  cornerBottomLeft: { position: "absolute", left: -1, bottom: -1, width: 26, height: 26, borderBottomWidth: 3, borderLeftWidth: 3, borderColor: "rgba(255,255,255,.74)", borderBottomLeftRadius: 22 },
  cornerBottomRight: { position: "absolute", right: -1, bottom: -1, width: 26, height: 26, borderBottomWidth: 3, borderRightWidth: 3, borderColor: "rgba(255,255,255,.74)", borderBottomRightRadius: 22 },
  bottomBar: { position: "absolute", left: 0, right: 0, bottom: 0, zIndex: 32, paddingBottom: 22, paddingTop: 14, backgroundColor: "rgba(0,0,0,.34)" },
  modeStrip: { flexDirection: "row", justifyContent: "center", gap: 22, marginBottom: 8 },
  modeActive: { color: palette.sunshine, fontWeight: "900", fontSize: 13 },
  modeMuted: { color: "rgba(255,255,255,.68)", fontWeight: "800", fontSize: 13 },
  lensStrip: { height: 58, marginBottom: 8 },
  lensContent: { gap: 12, paddingHorizontal: 22, alignItems: "center" },
  lensButton: { width: 48, alignItems: "center", gap: 4 },
  lensPreview: { width: 34, height: 34, borderRadius: 17, borderWidth: 2, borderColor: "rgba(255,255,255,.78)", shadowColor: "#000", shadowOpacity: 0.35, shadowRadius: 7, shadowOffset: { width: 0, height: 3 } },
  lensActive: { width: 43, height: 43, borderRadius: 22, borderWidth: 3, borderColor: palette.sunshine },
  lensText: { color: "rgba(255,255,255,.82)", fontSize: 8, fontWeight: "900", textAlign: "center" },
  lensTextActive: { color: palette.whitePaper },
  controlRow: { paddingHorizontal: 26, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  shutter: { width: 70, height: 70, borderRadius: 35, backgroundColor: "rgba(255,255,255,.96)", alignItems: "center", justifyContent: "center", borderWidth: 5, borderColor: palette.softPeach },
  shutterInner: { width: 50, height: 50, borderRadius: 25, backgroundColor: palette.whitePaper, borderWidth: 1, borderColor: "rgba(52,43,42,.12)" },
  shutterBusy: { opacity: 0.64 },
  sideAction: { width: 62, height: 58, borderRadius: 18, backgroundColor: "rgba(255,253,248,.92)", alignItems: "center", justifyContent: "center", gap: 2 },
  sideActionText: { color: palette.ink, fontSize: 10, fontWeight: "900" },
  locationText: { marginHorizontal: 24, marginTop: 8, color: "rgba(255,255,255,.62)", fontSize: 10, fontWeight: "800", textAlign: "center" },
  permissionCard: { width: "100%", backgroundColor: "rgba(255,253,248,.96)", borderRadius: 18, padding: 18, gap: 12, borderWidth: 1, borderColor: "#E4D9CA" },
  permissionIcon: { width: 74, height: 74, borderRadius: 37, backgroundColor: palette.sunshine, alignItems: "center", justifyContent: "center", alignSelf: "center", marginBottom: 4 },
  permissionTitle: { color: palette.ink, fontSize: 24, fontWeight: "900" },
  permissionCopy: { color: palette.mutedBrown, fontSize: 15, lineHeight: 22 },
  permissionButton: { minHeight: 48, borderRadius: 24, backgroundColor: palette.ink, alignItems: "center", justifyContent: "center" },
  permissionButtonLight: { backgroundColor: palette.whitePaper, borderWidth: 1, borderColor: "#E4D9CA" },
  permissionButtonText: { color: palette.whitePaper, fontWeight: "900" },
  permissionButtonTextLight: { color: palette.ink }
});
