import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { palette } from "@frames/ui";
import type { Privacy } from "@frames/types";

export function PrivacySelector({ value, onChange }: { value?: Privacy; onChange?: (privacy: Privacy) => void }) {
  const [localPrivacy, setLocalPrivacy] = useState<Privacy>("FRIENDS");
  const privacy = value ?? localPrivacy;
  const update = (next: Privacy) => {
    setLocalPrivacy(next);
    onChange?.(next);
  };
  return (
    <View style={styles.row}>
      {(["FRIENDS", "PUBLIC"] as Privacy[]).map((item) => (
        <Pressable key={item} onPress={() => update(item)} style={[styles.option, privacy === item && styles.active]}>
          <Text style={[styles.label, privacy === item && styles.activeLabel]}>{item === "FRIENDS" ? "Friends" : "Public"}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", padding: 4, backgroundColor: palette.whitePaper, borderRadius: 8, borderWidth: 1, borderColor: "#E4D9CA" },
  option: { flex: 1, minHeight: 44, alignItems: "center", justifyContent: "center", borderRadius: 6 },
  active: { backgroundColor: palette.ink },
  label: { color: palette.ink, fontWeight: "900" },
  activeLabel: { color: palette.whitePaper }
});
