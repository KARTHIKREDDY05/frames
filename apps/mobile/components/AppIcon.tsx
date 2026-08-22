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
  | "close"
  | "comment"
  | "delete"
  | "flash"
  | "frames-logo"
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
  | "share"
  | "shopping-bag"
  | "sign-out"
  | "spark"
  | "switch"
  | "user-plus";

export function AppIcon({ color = palette.ink, name, size = 20 }: { color?: string; name: AppIconName; size?: number }) {
  return (
    <View style={[styles.icon, { height: size, width: size }]}>
      {renderGlyph(name, color, size)}
    </View>
  );
}

function renderGlyph(name: AppIconName, color: string, size: number) {
  const stroke = Math.max(1.8, Math.round(size * 0.1));

  switch (name) {
    case "frames-logo":
      return (
        <View style={{ width: "100%", height: "100%", backgroundColor: palette.acidYellow, borderWidth: 1.5, borderColor: color, borderRadius: 6, alignItems: "center", justifyContent: "center", position: "relative" }}>
          <View style={{ width: "65%", height: "50%", borderWidth: 1.5, borderColor: color, borderRadius: 3, backgroundColor: palette.whitePaper }} />
        </View>
      );

    case "home":
      // Clean House Roof & Body (No square outer frame!)
      return (
        <View style={{ width: "100%", height: "100%", alignItems: "center", justifyContent: "center" }}>
          <View style={{ width: 0, height: 0, borderLeftWidth: size * 0.42, borderRightWidth: size * 0.42, borderBottomWidth: size * 0.35, borderLeftColor: "transparent", borderRightColor: "transparent", borderBottomColor: color }} />
          <View style={{ width: "70%", height: "45%", backgroundColor: color, borderBottomLeftRadius: 2, borderBottomRightRadius: 2, marginTop: -1, alignItems: "center", justifyContent: "flex-end" }}>
            <View style={{ width: "35%", height: "55%", backgroundColor: palette.whitePaper, borderTopLeftRadius: 3, borderTopRightRadius: 3 }} />
          </View>
        </View>
      );

    case "camera":
      // Sleek 35mm Viewfinder Camera (Rounded body, circle lens!)
      return (
        <View style={{ width: "100%", height: "100%", alignItems: "center", justifyContent: "center" }}>
          <View style={{ width: "35%", height: "16%", backgroundColor: color, borderTopLeftRadius: 3, borderTopRightRadius: 3, marginBottom: -1 }} />
          <View style={{ width: "95%", height: "68%", backgroundColor: color, borderRadius: 6, alignItems: "center", justifyContent: "center", padding: 2 }}>
            <View style={{ width: "50%", height: "70%", borderRadius: 999, backgroundColor: palette.whitePaper, borderWidth: stroke, borderColor: palette.acidYellow, alignItems: "center", justifyContent: "center" }}>
              <View style={{ width: "40%", height: "40%", borderRadius: 999, backgroundColor: color }} />
            </View>
          </View>
        </View>
      );

    case "search":
      // Round Magnifying Glass Lens
      return (
        <View style={{ width: "100%", height: "100%", position: "relative" }}>
          <View style={{ width: "70%", height: "70%", borderRadius: 999, borderWidth: stroke * 1.2, borderColor: color, position: "absolute", top: 0, left: 0 }} />
          <View style={{ width: stroke * 1.4, height: "45%", backgroundColor: color, borderRadius: stroke, position: "absolute", bottom: "4%", right: "14%", transform: [{ rotate: "-45deg" }] }} />
        </View>
      );

    case "comment":
      // Smooth Chat Bubble with tail
      return (
        <View style={{ width: "100%", height: "100%", position: "relative", alignItems: "center", justifyContent: "center" }}>
          <View style={{ width: "95%", height: "75%", backgroundColor: color, borderRadius: 10, justifyContent: "center", alignItems: "center" }}>
            <View style={{ flexDirection: "row", gap: 3 }}>
              <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: palette.whitePaper }} />
              <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: palette.whitePaper }} />
              <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: palette.whitePaper }} />
            </View>
          </View>
          <View style={{ width: 0, height: 0, borderLeftWidth: 6, borderRightWidth: 2, borderTopWidth: 6, borderLeftColor: "transparent", borderRightColor: "transparent", borderTopColor: color, position: "absolute", bottom: 0, left: "20%" }} />
        </View>
      );

    case "profile":
      // Round User Portrait Avatar
      return (
        <View style={{ width: "100%", height: "100%", alignItems: "center", justifyContent: "center" }}>
          <View style={{ width: "42%", height: "42%", borderRadius: 999, backgroundColor: color, marginBottom: 2 }} />
          <View style={{ width: "85%", height: "38%", borderTopLeftRadius: 10, borderTopRightRadius: 10, backgroundColor: color }} />
        </View>
      );

    case "public":
      // Globe Lines Circle
      return (
        <View style={{ width: "100%", height: "100%", borderRadius: 999, borderWidth: stroke, borderColor: color, alignItems: "center", justifyContent: "center" }}>
          <View style={{ width: "100%", height: stroke, backgroundColor: color, position: "absolute" }} />
          <View style={{ width: "50%", height: "100%", borderRadius: 999, borderWidth: stroke, borderColor: color, position: "absolute" }} />
        </View>
      );

    case "archive":
    case "memory":
      // Round Memory Book Folder
      return (
        <View style={{ width: "100%", height: "100%", justifyContent: "center", alignItems: "center" }}>
          <View style={{ width: "90%", height: "75%", backgroundColor: color, borderRadius: 4, padding: 3, justifyContent: "space-between" }}>
            <View style={{ width: "60%", height: 2, backgroundColor: palette.whitePaper, borderRadius: 1 }} />
            <View style={{ width: "80%", height: 2, backgroundColor: palette.acidYellow, borderRadius: 1 }} />
            <View style={{ width: "40%", height: 2, backgroundColor: palette.whitePaper, borderRadius: 1 }} />
          </View>
        </View>
      );

    case "heart":
      return (
        <View style={{ width: "100%", height: "100%", alignItems: "center", justifyContent: "center" }}>
          <Text style={{ fontSize: size * 0.85, lineHeight: size * 0.9 }}>❤️</Text>
        </View>
      );

    case "bell":
      return (
        <View style={{ width: "100%", height: "100%", alignItems: "center", justifyContent: "center" }}>
          <View style={{ width: "70%", height: "60%", borderTopLeftRadius: 10, borderTopRightRadius: 10, backgroundColor: color }} />
          <View style={{ width: "90%", height: stroke * 1.5, backgroundColor: color, borderRadius: stroke }} />
          <View style={{ width: "30%", height: stroke * 2, backgroundColor: color, borderBottomLeftRadius: 4, borderBottomRightRadius: 4 }} />
        </View>
      );

    case "settings":
      return (
        <View style={{ width: "100%", height: "100%", alignItems: "center", justifyContent: "center" }}>
          <View style={{ width: "75%", height: "75%", borderRadius: 999, borderWidth: stroke * 1.5, borderColor: color, alignItems: "center", justifyContent: "center" }}>
            <View style={{ width: "30%", height: "30%", borderRadius: 999, backgroundColor: color }} />
          </View>
        </View>
      );

    case "flash":
      return (
        <View style={{ width: "100%", height: "100%", alignItems: "center", justifyContent: "center" }}>
          <Text style={{ fontSize: size * 0.75, color }}>⚡</Text>
        </View>
      );

    case "switch":
      return (
        <View style={{ width: "100%", height: "100%", alignItems: "center", justifyContent: "center" }}>
          <Text style={{ fontSize: size * 0.75, color }}>🔄</Text>
        </View>
      );

    case "gallery":
      return (
        <View style={{ width: "100%", height: "100%", alignItems: "center", justifyContent: "center" }}>
          <Text style={{ fontSize: size * 0.75, color }}>🖼️</Text>
        </View>
      );

    case "arrow-left":
      return (
        <View style={{ width: "100%", height: "100%", alignItems: "center", justifyContent: "center" }}>
          <View style={{ width: "75%", height: stroke * 1.2, backgroundColor: color, borderRadius: stroke }} />
          <View style={{ width: "40%", height: stroke * 1.2, backgroundColor: color, position: "absolute", left: "12%", top: "25%", transform: [{ rotate: "-45deg" }] }} />
          <View style={{ width: "40%", height: stroke * 1.2, backgroundColor: color, position: "absolute", left: "12%", bottom: "25%", transform: [{ rotate: "45deg" }] }} />
        </View>
      );

    case "check":
      return (
        <View style={{ width: "100%", height: "100%", alignItems: "center", justifyContent: "center" }}>
          <View style={{ width: "35%", height: stroke * 1.2, backgroundColor: color, position: "absolute", left: "15%", bottom: "35%", transform: [{ rotate: "45deg" }] }} />
          <View style={{ width: "65%", height: stroke * 1.2, backgroundColor: color, position: "absolute", right: "10%", top: "38%", transform: [{ rotate: "-48deg" }] }} />
        </View>
      );

    case "close":
      return (
        <View style={{ width: "100%", height: "100%", alignItems: "center", justifyContent: "center" }}>
          <View style={{ width: "75%", height: stroke, backgroundColor: color, position: "absolute", transform: [{ rotate: "45deg" }] }} />
          <View style={{ width: "75%", height: stroke, backgroundColor: color, position: "absolute", transform: [{ rotate: "-45deg" }] }} />
        </View>
      );

    case "share":
      return (
        <View style={{ width: "100%", height: "100%", alignItems: "center", justifyContent: "center" }}>
          <Text style={{ fontSize: size * 0.75, color }}>↗️</Text>
        </View>
      );

    case "shopping-bag":
      return (
        <View style={{ width: "100%", height: "100%", alignItems: "center", justifyContent: "center" }}>
          <Text style={{ fontSize: size * 0.75, color }}>🛍️</Text>
        </View>
      );

    default:
      return <View style={{ width: "60%", height: "60%", backgroundColor: color, borderRadius: 999 }} />;
  }
}

const styles = StyleSheet.create({
  icon: { alignItems: "center", justifyContent: "center", position: "relative" }
});
