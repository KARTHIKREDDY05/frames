import { StyleSheet, Text, View } from "react-native";
import { palette } from "@frames/ui";

export function WashiTape({
  label,
  color = "lavender",
  tilt = "-2deg",
  position = "top"
}: {
  label?: string;
  color?: "lavender" | "yellow" | "peach" | "sunshine";
  tilt?: string;
  position?: "top" | "top-left" | "top-right" | "bottom";
}) {
  const bg =
    color === "yellow"
      ? palette.acidYellow
      : color === "lavender"
      ? palette.softLavender
      : color === "peach"
      ? palette.softPeach
      : palette.sunshine;

  const posStyle =
    position === "top-left"
      ? styles.topLeft
      : position === "top-right"
      ? styles.topRight
      : position === "bottom"
      ? styles.bottom
      : styles.top;

  return (
    <View style={[styles.tape, posStyle, { backgroundColor: bg, transform: [{ rotate: tilt }] }]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  tape: {
    position: "absolute",
    height: 22,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "rgba(26,24,23,0.3)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
    shadowColor: "#000",
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2
  },
  top: { top: -11, alignSelf: "center", minWidth: 84 },
  topLeft: { top: -10, left: 16, minWidth: 70 },
  topRight: { top: -10, right: 16, minWidth: 70 },
  bottom: { bottom: -10, alignSelf: "center", minWidth: 84 },
  label: {
    fontSize: 10,
    fontWeight: "900",
    color: palette.ink,
    letterSpacing: 0.8,
    textTransform: "uppercase"
  }
});
