import { router, useFocusEffect } from "expo-router";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { useCallback, useRef, useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
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
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [cameraActive, setCameraActive] = useState(true);
  const [activeMode, setActiveMode] = useState<"live" | "photo" | "upload">("photo");
  const [gridOn, setGridOn] = useState(false);
  const [timerSec, setTimerSec] = useState<0 | 3 | 5>(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const setPendingMediaUrl = useAppStore((state) => state.setPendingMediaUrl);
  const setPendingCaptureMeta = useAppStore((state) => state.setPendingCaptureMeta);

  useFocusEffect(
    useCallback(() => {
      setCameraActive(true);
      setCameraMessage("");
      return () => {
        setIsCapturing(false);
        setFlash("off");
      };
    }, [])
  );

  const getFastLocation = async () => {
    try {
      const permissionResult = await Location.getForegroundPermissionsAsync();
      if (!permissionResult.granted) return { locationName: null, latitude: null, longitude: null };
      const lastKnown = await Location.getLastKnownPositionAsync();
      if (lastKnown) {
        const { latitude, longitude } = lastKnown.coords;
        return { locationName: `${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°`, latitude, longitude };
      }
    } catch {
      // Ignored for speed
    }
    return { locationName: null, latitude: null, longitude: null };
  };

  const openEditor = (uri: string) => {
    setPendingMediaUrl(uri);
    setPendingCaptureMeta({
      filterPreset: selectedLens,
      locationName: null,
      latitude: null,
      longitude: null
    });
    router.push("/editor");

    // Asynchronously resolve coordinates without blocking the UI
    void (async () => {
      try {
        const location = await getFastLocation();
        if (location.latitude) {
          setPendingCaptureMeta({
            filterPreset: selectedLens,
            locationName: location.locationName,
            latitude: location.latitude,
            longitude: location.longitude
          });
        }
      } catch {
        // Handled silently
      }
    })();
  };

  const captureWithDeviceCamera = async () => {
    if (Platform.OS === "web") {
      try {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 5],
          quality: 0.9
        });
        if (!result.canceled && result.assets[0]?.uri) openEditor(result.assets[0].uri);
      } catch {
        // Handled
      }
      return;
    }
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
    if (!result.canceled && result.assets[0]?.uri) openEditor(result.assets[0].uri);
  };

  const executeSnap = async () => {
    setIsCapturing(true);
    try {
      if (cameraRef.current && isCameraReady) {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.88,
          skipProcessing: true
        });
        if (photo?.uri) {
          openEditor(photo.uri);
          return;
        }
      }
      await captureWithDeviceCamera();
    } catch {
      await captureWithDeviceCamera();
    } finally {
      setIsCapturing(false);
    }
  };

  const takePhoto = async () => {
    if (isCapturing || !cameraActive) return;
    setActiveMode("photo");
    if (Platform.OS === "web") {
      await captureWithDeviceCamera();
      return;
    }
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        await captureWithDeviceCamera();
        return;
      }
    }
    if (timerSec > 0) {
      setCountdown(timerSec);
      let count = timerSec;
      const interval = setInterval(() => {
        count -= 1;
        if (count <= 0) {
          clearInterval(interval);
          setCountdown(null);
          void executeSnap();
        } else {
          setCountdown(count);
        }
      }, 1000);
      return;
    }
    await executeSnap();
  };

  const cycleTimer = () => {
    setTimerSec((prev) => (prev === 0 ? 3 : prev === 3 ? 5 : 0));
  };

  const toggleGrid = () => {
    setGridOn((prev) => !prev);
  };

  const pickImage = async () => {
    setActiveMode("upload");
    try {
      if (Platform.OS !== "web") {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permissionResult.granted) {
          setCameraMessage("Gallery permission is needed to choose a photo.");
          return;
        }
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.9,
        allowsEditing: true,
        aspect: [4, 5]
      });
      if (!result.canceled && result.assets[0]?.uri) openEditor(result.assets[0].uri);
    } catch {
      // Handled
    }
  };

  const toggleFlash = () => {
    if (facing === "front") {
      setFlash("off");
      setCameraMessage("Flash is available on the back camera.");
      return;
    }
    setCameraMessage("");
    setFlash((value) => (value === "on" ? "off" : "on"));
  };

  const switchCamera = () => {
    setFlash("off");
    setCameraMessage("");
    setFacing((value) => (value === "back" ? "front" : "back"));
  };

  const renderOverlay = () => (
    <>
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <Pressable style={[styles.topIcon, flash === "on" && styles.topIconActive]} onPress={toggleFlash}>
            <AppIcon name="flash" color={palette.whitePaper} size={16} />
          </Pressable>
          <Pressable style={[styles.topIcon, timerSec > 0 && styles.topIconActive]} onPress={cycleTimer}>
            <Text style={styles.timerIconText}>{timerSec === 0 ? "⏱" : `${timerSec}s`}</Text>
          </Pressable>
          <Pressable style={[styles.topIcon, gridOn && styles.topIconActive]} onPress={toggleGrid}>
            <Text style={styles.gridIconText}>#</Text>
          </Pressable>
        </View>

        <View style={styles.titleWrap}>
          <Text style={styles.title}>Frames</Text>
          <Text style={styles.subtitle}>Lens • {photoFilterOptions.find((o) => o.value === selectedLens)?.label ?? "Natural"}</Text>
        </View>

        <Pressable style={styles.topIcon} onPress={switchCamera}>
          <AppIcon name="switch" color={palette.whitePaper} size={16} />
        </Pressable>
      </View>

      {cameraMessage ? <Text style={styles.cameraMessage}>{cameraMessage}</Text> : null}

      {/* Countdown Display */}
      {countdown !== null ? (
        <View style={styles.countdownOverlay}>
          <View style={styles.countdownCircle}>
            <Text style={styles.countdownNumber}>{countdown}</Text>
          </View>
        </View>
      ) : null}

      <View pointerEvents="none" style={styles.guideWrap}>
        <LensOverlay lens={selectedLens} />
        <View style={styles.guideFrame}>
          {gridOn ? (
            <View style={styles.ruleOfThirds}>
              <View style={styles.gridLineH1} />
              <View style={styles.gridLineH2} />
              <View style={styles.gridLineV1} />
              <View style={styles.gridLineV2} />
            </View>
          ) : null}
          <View style={styles.cornerTopLeft} />
          <View style={styles.cornerTopRight} />
          <View style={styles.cornerBottomLeft} />
          <View style={styles.cornerBottomRight} />
          <View style={styles.viewfinderBadge}>
            <Text style={styles.viewfinderBadgeText}>FRAMES 35MM</Text>
          </View>
        </View>
      </View>

      <View style={styles.bottomBar}>
        <View style={styles.modeStrip}>
          <Pressable onPress={() => setActiveMode("photo")}>
            <Text style={[styles.modeText, activeMode === "photo" && styles.modeActive]}>Photo</Text>
          </Pressable>
          <Pressable onPress={() => { void pickImage(); }}>
            <Text style={[styles.modeText, activeMode === "upload" && styles.modeActive]}>Upload</Text>
          </Pressable>
        </View>

        <View style={styles.lensStrip}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.lensContent}>
            {photoFilterOptions.map((lens) => {
              const isActive = selectedLens === lens.value;
              return (
                <Pressable key={lens.value} style={styles.lensButton} onPress={() => setSelectedLens(lens.value)}>
                  <View style={[styles.lensPreview, isActive && styles.lensActive, { backgroundColor: lens.tint === "transparent" ? "#FDFBF6" : lens.tint }]}>
                    {isActive ? <View style={styles.lensActiveDot} /> : null}
                  </View>
                  <Text numberOfLines={1} style={[styles.lensText, isActive && styles.lensTextActive]}>{lens.label}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.controlRow}>
          <Pressable style={styles.sideAction} onPress={() => { void pickImage(); }}>
            <AppIcon name="gallery" color={palette.ink} size={22} />
            <Text style={styles.sideActionText}>Gallery</Text>
          </Pressable>

          <Pressable style={[styles.shutter, isCapturing && styles.shutterBusy]} disabled={isCapturing} onPress={() => { void takePhoto(); }}>
            <View style={styles.shutterInner} />
          </Pressable>

          <Pressable style={styles.sideAction} onPress={switchCamera}>
            <AppIcon name="switch" color={palette.ink} size={22} />
            <Text style={styles.sideActionText}>Flip</Text>
          </Pressable>
        </View>
      </View>
    </>
  );

  const preview = permission?.granted && cameraActive ? (
    <CameraView
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
        setCameraMessage(event.message || "Camera ready. Tap shutter to capture.");
      }}
    >
      {renderOverlay()}
    </CameraView>
  ) : permission?.granted ? (
    <View style={styles.pausedPreview}>
      <View style={styles.permissionCard}>
        <View style={styles.permissionIcon}><AppIcon name="camera" color={palette.ink} size={34} /></View>
        <Text style={styles.permissionTitle}>Camera paused</Text>
        <Text style={styles.permissionCopy}>Open the Camera tab to resume your live viewfinder.</Text>
      </View>
    </View>
  ) : (
    <View style={styles.permissionPreview}>
      <View style={styles.permissionCard}>
        <View style={styles.permissionIcon}><AppIcon name="camera" color={palette.ink} size={34} /></View>
        <Text style={styles.permissionTitle}>Camera Access</Text>
        <Text style={styles.permissionCopy}>Allow camera permissions to take real scrapbook moments with lenses, or pick photos from your gallery.</Text>
        <FrameCameraButton label="Allow Camera Access" onPress={() => { void takePhoto(); }} />
        <FrameCameraButton label="Open Device Camera" onPress={() => { void captureWithDeviceCamera(); }} variant="light" />
        <FrameCameraButton label="Choose From Gallery" onPress={() => { void pickImage(); }} variant="light" />
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
      {lens === "GRAIN" ? (
        <View style={styles.cameraGrain}>
          {Array.from({ length: 9 }).map((_, index) => (
            <View key={index} style={[styles.cameraGrainLine, { top: `${index * 11}%` }]} />
          ))}
        </View>
      ) : null}
      {lens === "SUNSET" || lens === "GOLD" ? <View style={styles.sunsetBottom} /> : null}
      {lens === "DREAMY" || lens === "BLUSH" ? <View style={styles.dreamyGlow} /> : null}
      {lens === "TEAL" ? <View style={styles.tealNeonBorder} /> : null}
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
  topBar: { position: "absolute", left: 0, right: 0, top: 0, zIndex: 30, paddingTop: 46, paddingHorizontal: 18, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  topBarLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  titleWrap: { alignItems: "center" },
  title: { color: palette.whitePaper, fontSize: 18, fontWeight: "900", letterSpacing: 1 },
  subtitle: { color: palette.sunshine, fontSize: 11, fontWeight: "800", marginTop: 2 },
  topIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(0,0,0,.45)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,.2)" },
  topIconActive: { backgroundColor: "rgba(246,214,92,.42)", borderColor: "rgba(246,214,92,.85)" },
  timerIconText: { color: palette.whitePaper, fontSize: 11, fontWeight: "900" },
  gridIconText: { color: palette.whitePaper, fontSize: 16, fontWeight: "900" },
  countdownOverlay: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center", zIndex: 40 },
  countdownCircle: { width: 90, height: 90, borderRadius: 45, backgroundColor: "rgba(0,0,0,0.75)", borderWidth: 3, borderColor: palette.acidYellow, alignItems: "center", justifyContent: "center" },
  countdownNumber: { color: palette.whitePaper, fontSize: 44, fontWeight: "900" },
  ruleOfThirds: { ...StyleSheet.absoluteFillObject, opacity: 0.35 },
  gridLineH1: { position: "absolute", top: "33.33%", left: 0, right: 0, height: 1, backgroundColor: "#FFFFFF" },
  gridLineH2: { position: "absolute", top: "66.66%", left: 0, right: 0, height: 1, backgroundColor: "#FFFFFF" },
  gridLineV1: { position: "absolute", left: "33.33%", top: 0, bottom: 0, width: 1, backgroundColor: "#FFFFFF" },
  gridLineV2: { position: "absolute", left: "66.66%", top: 0, bottom: 0, width: 1, backgroundColor: "#FFFFFF" },
  cameraMessage: { position: "absolute", top: 102, left: 18, right: 18, zIndex: 28, padding: 10, borderRadius: 18, backgroundColor: "rgba(0,0,0,.55)", color: palette.whitePaper, fontWeight: "800", fontSize: 12, textAlign: "center" },
  guideWrap: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center", paddingHorizontal: 28, paddingTop: 90, paddingBottom: 170 },
  lensWash: { ...StyleSheet.absoluteFillObject },
  vignette: { ...StyleSheet.absoluteFillObject, borderWidth: 48, borderColor: "rgba(0,0,0,.35)" },
  contrastFrame: { ...StyleSheet.absoluteFillObject, borderWidth: 12, borderColor: "rgba(255,255,255,.08)" },
  softSheet: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(255,250,244,.15)" },
  cameraGrain: { ...StyleSheet.absoluteFillObject },
  cameraGrainLine: { position: "absolute", left: 0, right: 0, height: 1, backgroundColor: "rgba(255,255,255,.08)" },
  sunsetBottom: { position: "absolute", left: 0, right: 0, bottom: 0, height: "35%", backgroundColor: "rgba(255,94,43,.18)" },
  dreamyGlow: { position: "absolute", top: 0, left: 0, right: 0, height: "40%", backgroundColor: "rgba(255,182,193,.15)" },
  tealNeonBorder: { ...StyleSheet.absoluteFillObject, borderWidth: 2, borderColor: "rgba(0,240,255,.25)" },
  guideFrame: { width: "100%", maxWidth: 390, aspectRatio: 0.75, borderRadius: 28, borderWidth: 1, borderColor: "rgba(255,255,255,.35)", position: "relative" },
  cornerTopLeft: { position: "absolute", left: -1, top: -1, width: 28, height: 28, borderTopWidth: 3, borderLeftWidth: 3, borderColor: palette.sunshine, borderTopLeftRadius: 22 },
  cornerTopRight: { position: "absolute", right: -1, top: -1, width: 28, height: 28, borderTopWidth: 3, borderRightWidth: 3, borderColor: palette.sunshine, borderTopRightRadius: 22 },
  cornerBottomLeft: { position: "absolute", left: -1, bottom: -1, width: 28, height: 28, borderBottomWidth: 3, borderLeftWidth: 3, borderColor: palette.sunshine, borderBottomLeftRadius: 22 },
  cornerBottomRight: { position: "absolute", right: -1, bottom: -1, width: 28, height: 28, borderBottomWidth: 3, borderRightWidth: 3, borderColor: palette.sunshine, borderBottomRightRadius: 22 },
  viewfinderBadge: { position: "absolute", bottom: 12, alignSelf: "center", backgroundColor: "rgba(0,0,0,.5)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  viewfinderBadgeText: { color: "rgba(255,255,255,.8)", fontSize: 9, fontWeight: "900", letterSpacing: 1.5 },
  bottomBar: { position: "absolute", left: 0, right: 0, bottom: 0, zIndex: 32, paddingBottom: 26, paddingTop: 14, backgroundColor: "rgba(0,0,0,.42)" },
  modeStrip: { flexDirection: "row", justifyContent: "center", gap: 28, marginBottom: 10 },
  modeText: { color: "rgba(255,255,255,.65)", fontWeight: "800", fontSize: 13 },
  modeActive: { color: palette.sunshine, fontWeight: "900" },
  lensStrip: { height: 64, marginBottom: 10 },
  lensContent: { gap: 14, paddingHorizontal: 22, alignItems: "center" },
  lensButton: { width: 52, alignItems: "center", gap: 4 },
  lensPreview: { width: 38, height: 38, borderRadius: 19, borderWidth: 2, borderColor: "rgba(255,255,255,.8)", alignItems: "center", justifyContent: "center" },
  lensActive: { width: 44, height: 44, borderRadius: 22, borderWidth: 3, borderColor: palette.sunshine },
  lensActiveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: palette.sunshine },
  lensText: { color: "rgba(255,255,255,.78)", fontSize: 9, fontWeight: "800", textAlign: "center" },
  lensTextActive: { color: palette.whitePaper, fontWeight: "900" },
  controlRow: { paddingHorizontal: 28, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  shutter: { width: 72, height: 72, borderRadius: 36, backgroundColor: "rgba(255,255,255,.98)", alignItems: "center", justifyContent: "center", borderWidth: 5, borderColor: palette.softPeach },
  shutterInner: { width: 52, height: 52, borderRadius: 26, backgroundColor: palette.whitePaper, borderWidth: 2, borderColor: "rgba(52,43,42,.12)" },
  shutterBusy: { opacity: 0.6 },
  sideAction: { width: 64, height: 60, borderRadius: 20, backgroundColor: "rgba(255,253,248,.95)", alignItems: "center", justifyContent: "center", gap: 3 },
  sideActionText: { color: palette.ink, fontSize: 10, fontWeight: "900" },
  permissionCard: { width: "100%", backgroundColor: "rgba(255,253,248,.98)", borderRadius: 22, padding: 22, gap: 14, borderWidth: 1, borderColor: "#E4D9CA" },
  permissionIcon: { width: 76, height: 76, borderRadius: 38, backgroundColor: palette.sunshine, alignItems: "center", justifyContent: "center", alignSelf: "center", marginBottom: 6 },
  permissionTitle: { color: palette.ink, fontSize: 24, fontWeight: "900", textAlign: "center" },
  permissionCopy: { color: palette.mutedBrown, fontSize: 15, lineHeight: 22, textAlign: "center" },
  permissionButton: { minHeight: 48, borderRadius: 24, backgroundColor: palette.ink, alignItems: "center", justifyContent: "center" },
  permissionButtonLight: { backgroundColor: palette.whitePaper, borderWidth: 1, borderColor: "#E4D9CA" },
  permissionButtonText: { color: palette.whitePaper, fontWeight: "900" },
  permissionButtonTextLight: { color: palette.ink }
});
