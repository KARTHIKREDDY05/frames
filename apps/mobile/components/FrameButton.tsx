import type { ComponentProps } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { Pressable, StyleSheet, Text } from "react-native";
import { palette } from "@frames/ui";

interface Props extends Omit<ComponentProps<typeof Pressable>, "style"> {
  label: string;
  variant?: "primary" | "secondary";
  style?: StyleProp<ViewStyle>;
}

export function FrameButton({ label, variant = "primary", style, ...props }: Props) {
  return (
    <Pressable {...props} style={[styles.button, variant === "secondary" && styles.secondary, style]}>
      <Text style={[styles.label, variant === "secondary" && styles.secondaryLabel]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { minHeight: 56, borderRadius: 28, backgroundColor: palette.ink, alignItems: "center", justifyContent: "center", paddingHorizontal: 22 },
  secondary: { backgroundColor: palette.whitePaper, borderWidth: 1, borderColor: "#E4D9CA" },
  label: { color: palette.whitePaper, fontWeight: "900", fontSize: 17 },
  secondaryLabel: { color: palette.ink }
});
