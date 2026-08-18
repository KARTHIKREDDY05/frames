import { StyleSheet, Text, View } from "react-native";
import { palette } from "@frames/ui";

export type AppIconName =
  | "archive"
  | "arrow-left"
  | "arrow-right"
  | "bell"
  | "camera"
  | "check"
  | "clock"
  | "comment"
  | "delete"
  | "flash"
  | "gallery"
  | "github"
  | "google"
  | "heart"
  | "home"
  | "lock"
  | "memory"
  | "profile"
  | "public"
  | "search"
  | "send"
  | "settings"
  | "sign-out"
  | "spark"
  | "switch"
  | "user-plus";

export function AppIcon({ color = palette.ink, name, size = 20 }: { color?: string; name: AppIconName; size?: number }) {
  const stroke = Math.max(2, Math.round(size * 0.11));
  return (
    <View style={[styles.icon, { height: size, width: size }]}>
      {renderGlyph(name, color, stroke, size)}
    </View>
  );
}

function renderGlyph(name: AppIconName, color: string, stroke: number, size: number) {
  const line = { backgroundColor: color, borderRadius: stroke };
  const outline = { borderColor: color, borderWidth: stroke };
  const half = Math.round(size / 2);

  switch (name) {
    case "camera":
      return (
        <>
          <View style={[styles.cameraTop, line, { height: stroke * 2, left: size * 0.28, top: size * 0.17, width: size * 0.28 }]} />
          <View style={[styles.cameraBody, outline, { borderRadius: size * 0.16 }]} />
          <View style={[styles.cameraLens, outline, { borderRadius: size * 0.5 }]} />
        </>
      );
    case "search":
      return (
        <>
          <View style={[styles.searchLens, outline]} />
          <View style={[styles.searchHandle, line, { height: stroke, width: size * 0.32 }]} />
        </>
      );
    case "archive":
      return (
        <>
          <View style={[styles.archiveLid, line, { height: stroke, top: size * 0.22 }]} />
          <View style={[styles.archiveBox, outline, { borderRadius: size * 0.1 }]} />
          <View style={[styles.archiveSlot, line, { height: stroke, width: size * 0.28 }]} />
        </>
      );
    case "memory":
      return (
        <>
          <View style={[styles.bookLeft, outline]} />
          <View style={[styles.bookRight, outline]} />
          <View style={[styles.bookFold, line, { width: stroke }]} />
        </>
      );
    case "profile":
      return (
        <>
          <View style={[styles.profileHead, outline, { borderRadius: size }]} />
          <View style={[styles.profileBody, outline, { borderTopLeftRadius: size, borderTopRightRadius: size }]} />
        </>
      );
    case "home":
      return (
        <>
          <View style={[styles.homeRoof, { borderColor: color, borderLeftWidth: stroke, borderTopWidth: stroke }]} />
          <View style={[styles.homeBase, outline, { borderRadius: size * 0.06 }]} />
        </>
      );
    case "flash":
      return (
        <>
          <View style={[styles.flashTop, line, { height: size * 0.5, width: stroke * 3 }]} />
          <View style={[styles.flashBottom, line, { height: size * 0.5, width: stroke * 3 }]} />
        </>
      );
    case "gallery":
      return (
        <>
          <View style={[styles.galleryBack, outline]} />
          <View style={[styles.galleryFront, outline]} />
          <View style={[styles.gallerySun, { backgroundColor: color, borderRadius: size }]} />
        </>
      );
    case "switch":
      return (
        <>
          <View style={[styles.switchArcTop, { borderColor: color, borderTopWidth: stroke, borderRightWidth: stroke }]} />
          <View style={[styles.switchArcBottom, { borderColor: color, borderBottomWidth: stroke, borderLeftWidth: stroke }]} />
        </>
      );
    case "bell":
      return (
        <>
          <View style={[styles.bellBody, outline, { borderTopLeftRadius: size, borderTopRightRadius: size }]} />
          <View style={[styles.bellBase, line, { height: stroke }]} />
          <View style={[styles.bellDot, { backgroundColor: color, borderRadius: size }]} />
        </>
      );
    case "heart":
      return <View style={[styles.heart, { borderBottomColor: color, borderLeftColor: color, borderRightColor: color, borderTopColor: color, borderWidth: stroke }]} />;
    case "comment":
      return (
        <>
          <View style={[styles.commentBubble, outline, { borderRadius: size * 0.18 }]} />
          <View style={[styles.commentTail, { borderBottomColor: color, borderBottomWidth: stroke, borderLeftColor: "transparent", borderLeftWidth: stroke * 2 }]} />
        </>
      );
    case "send":
      return (
        <>
          <View style={[styles.sendBody, { borderColor: color, borderRightWidth: stroke, borderTopWidth: stroke }]} />
          <View style={[styles.sendLine, line, { height: stroke }]} />
        </>
      );
    case "delete":
      return (
        <>
          <View style={[styles.trashLid, line, { height: stroke }]} />
          <View style={[styles.trashCan, outline, { borderRadius: size * 0.06 }]} />
          <View style={[styles.trashLine, line, { height: size * 0.34, width: stroke }]} />
        </>
      );
    case "check":
      return <View style={[styles.check, { borderBottomColor: color, borderBottomWidth: stroke, borderRightColor: color, borderRightWidth: stroke }]} />;
    case "lock":
      return (
        <>
          <View style={[styles.lockShackle, outline, { borderTopLeftRadius: size, borderTopRightRadius: size }]} />
          <View style={[styles.lockBody, outline, { borderRadius: size * 0.1 }]} />
        </>
      );
    case "public":
      return (
        <>
          <View style={[styles.globe, outline, { borderRadius: size }]} />
          <View style={[styles.globeLine, line, { height: stroke }]} />
          <View style={[styles.globeMeridian, line, { width: stroke }]} />
        </>
      );
    case "settings":
      return (
        <>
          <View style={[styles.gearOuter, outline, { borderRadius: size }]} />
          <View style={[styles.gearInner, { backgroundColor: color, borderRadius: size }]} />
        </>
      );
    case "sign-out":
      return (
        <>
          <View style={[styles.logoutDoor, outline]} />
          <View style={[styles.logoutArrow, line, { height: stroke }]} />
          <View style={[styles.logoutHead, { borderColor: color, borderRightWidth: stroke, borderTopWidth: stroke }]} />
        </>
      );
    case "user-plus":
      return (
        <>
          <View style={[styles.profileHead, outline, { borderRadius: size }]} />
          <View style={[styles.profileBody, outline, { borderTopLeftRadius: size, borderTopRightRadius: size, width: size * 0.46 }]} />
          <View style={[styles.plusH, line, { height: stroke, width: size * 0.28 }]} />
          <View style={[styles.plusV, line, { height: size * 0.28, width: stroke }]} />
        </>
      );
    case "arrow-left":
    case "arrow-right":
      return (
        <>
          <View style={[styles.arrowLine, line, { height: stroke, width: size * 0.62 }]} />
          <View style={[name === "arrow-left" ? styles.arrowHeadLeft : styles.arrowHeadRight, { borderColor: color, borderLeftWidth: stroke, borderTopWidth: stroke }]} />
        </>
      );
    case "clock":
      return (
        <>
          <View style={[styles.clock, outline, { borderRadius: size }]} />
          <View style={[styles.clockHand, line, { height: size * 0.25, width: stroke }]} />
          <View style={[styles.clockMinute, line, { height: stroke, width: size * 0.22 }]} />
        </>
      );
    case "spark":
      return (
        <>
          <View style={[styles.sparkV, line, { height: size * 0.75, left: half - stroke / 2, width: stroke }]} />
          <View style={[styles.sparkH, line, { height: stroke, top: half - stroke / 2, width: size * 0.75 }]} />
        </>
      );
    case "google":
      return <Text style={[styles.letter, { color, fontSize: size * 0.78 }]}>G</Text>;
    case "github":
      return <Text style={[styles.letter, { color, fontSize: size * 0.56 }]}>GH</Text>;
    default:
      return <View style={[styles.dot, { backgroundColor: color, borderRadius: size }]} />;
  }
}

const styles = StyleSheet.create({
  icon: { alignItems: "center", justifyContent: "center", position: "relative" },
  archiveBox: { bottom: "18%", height: "48%", left: "14%", position: "absolute", width: "72%" },
  archiveLid: { left: "10%", position: "absolute", width: "80%" },
  archiveSlot: { left: "36%", position: "absolute", top: "48%" },
  arrowHeadLeft: { height: "34%", left: "17%", position: "absolute", transform: [{ rotate: "-45deg" }], width: "34%" },
  arrowHeadRight: { height: "34%", position: "absolute", right: "17%", transform: [{ rotate: "135deg" }], width: "34%" },
  arrowLine: { position: "absolute" },
  bellBase: { bottom: "24%", left: "26%", position: "absolute", width: "48%" },
  bellBody: { height: "58%", left: "22%", position: "absolute", top: "15%", width: "56%" },
  bellDot: { bottom: "12%", height: "12%", position: "absolute", width: "12%" },
  bookFold: { height: "62%", position: "absolute", top: "18%" },
  bookLeft: { borderBottomLeftRadius: 3, borderTopLeftRadius: 3, height: "62%", left: "12%", position: "absolute", width: "38%" },
  bookRight: { borderBottomRightRadius: 3, borderTopRightRadius: 3, height: "62%", position: "absolute", right: "12%", width: "38%" },
  cameraBody: { bottom: "18%", height: "58%", left: "12%", position: "absolute", width: "76%" },
  cameraLens: { height: "30%", left: "35%", position: "absolute", top: "43%", width: "30%" },
  cameraTop: { position: "absolute" },
  check: { height: "58%", transform: [{ rotate: "45deg" }], width: "28%" },
  clock: { height: "78%", position: "absolute", width: "78%" },
  clockHand: { left: "48%", position: "absolute", top: "27%" },
  clockMinute: { left: "48%", position: "absolute", top: "50%" },
  commentBubble: { height: "58%", left: "12%", position: "absolute", top: "16%", width: "76%" },
  commentTail: { bottom: "14%", height: 0, left: "30%", position: "absolute", width: 0 },
  dot: { height: "56%", width: "56%" },
  flashBottom: { bottom: "14%", position: "absolute", right: "34%", transform: [{ rotate: "28deg" }] },
  flashTop: { left: "34%", position: "absolute", top: "12%", transform: [{ rotate: "28deg" }] },
  galleryBack: { height: "56%", left: "20%", position: "absolute", top: "13%", width: "58%" },
  galleryFront: { height: "56%", left: "10%", position: "absolute", top: "30%", width: "58%" },
  gallerySun: { height: "13%", left: "45%", position: "absolute", top: "39%", width: "13%" },
  gearInner: { height: "22%", width: "22%" },
  gearOuter: { height: "72%", position: "absolute", width: "72%" },
  globe: { height: "78%", position: "absolute", width: "78%" },
  globeLine: { position: "absolute", width: "72%" },
  globeMeridian: { height: "72%", position: "absolute" },
  heart: { height: "58%", transform: [{ rotate: "45deg" }], width: "58%" },
  homeBase: { bottom: "16%", height: "42%", left: "20%", position: "absolute", width: "60%" },
  homeRoof: { height: "48%", position: "absolute", top: "13%", transform: [{ rotate: "45deg" }], width: "48%" },
  letter: { fontWeight: "900", lineHeight: undefined },
  lockBody: { bottom: "14%", height: "48%", left: "18%", position: "absolute", width: "64%" },
  lockShackle: { borderBottomWidth: 0, height: "42%", left: "28%", position: "absolute", top: "9%", width: "44%" },
  logoutArrow: { position: "absolute", right: "12%", width: "48%" },
  logoutDoor: { borderRightWidth: 0, height: "66%", left: "12%", position: "absolute", width: "45%" },
  logoutHead: { height: "26%", position: "absolute", right: "12%", transform: [{ rotate: "45deg" }], width: "26%" },
  plusH: { position: "absolute", right: "5%", top: "45%" },
  plusV: { position: "absolute", right: "17%", top: "32%" },
  profileBody: { borderBottomWidth: 0, bottom: "12%", height: "34%", left: "20%", position: "absolute", width: "60%" },
  profileHead: { height: "34%", position: "absolute", top: "13%", width: "34%" },
  searchHandle: { bottom: "20%", position: "absolute", right: "13%", transform: [{ rotate: "45deg" }] },
  searchLens: { height: "56%", left: "13%", position: "absolute", top: "12%", width: "56%", borderRadius: 999 },
  sendBody: { height: "62%", position: "absolute", transform: [{ rotate: "45deg" }], width: "62%" },
  sendLine: { position: "absolute", transform: [{ rotate: "-20deg" }], width: "52%" },
  sparkH: { left: "12.5%", position: "absolute" },
  sparkV: { position: "absolute", top: "12.5%" },
  switchArcBottom: { borderRadius: 999, bottom: "18%", height: "36%", left: "15%", position: "absolute", width: "58%" },
  switchArcTop: { borderRadius: 999, height: "36%", position: "absolute", right: "15%", top: "18%", width: "58%" },
  trashCan: { borderTopWidth: 0, bottom: "14%", height: "56%", position: "absolute", width: "54%" },
  trashLid: { position: "absolute", top: "17%", width: "64%" },
  trashLine: { position: "absolute" }
});
