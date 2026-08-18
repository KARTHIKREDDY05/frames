import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Share, StyleSheet, Text, View } from "react-native";
import { palette } from "@frames/ui";
import { FrameButton } from "../components/FrameButton";
import { useAppStore } from "../store/appStore";

export default function ShareLinkModal() {
  const params = useLocalSearchParams<{ resourceType?: "profile" | "post" | "daily_frame"; resourceId?: string }>();
  const createShareLink = useAppStore((state) => state.createShareLink);
  const links = useAppStore((state) => state.shareLinks);
  const [latest, setLatest] = useState<string | null>(null);
  const resourceType = params.resourceType ?? "profile";
  const resourceId = params.resourceId ?? "me";
  const makeLink = async (access: "PUBLIC" | "FRIENDS") => {
    const link = createShareLink({ resourceType, resourceId, access });
    setLatest(link.url);
    await Share.share({ message: link.url, url: link.url, title: "Frames" });
  };
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Share Link</Text>
      <Text style={styles.copy}>{latest ?? "No link created yet."}</Text>
      <FrameButton icon="send" label="Create Public Link" onPress={() => { void makeLink("PUBLIC"); }} />
      <FrameButton icon="user-plus" label="Friends Only" variant="secondary" onPress={() => { void makeLink("FRIENDS"); }} />
      <Text style={styles.section}>Recent Links</Text>
      {links.slice(0, 4).map((link) => <Text key={link.id} style={styles.link}>{link.access}: {link.url}</Text>)}
    </View>
  );
}

const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: palette.paperCream, padding: 22, paddingTop: 58, gap: 14 }, title: { fontSize: 32, fontWeight: "900", color: palette.ink }, copy: { backgroundColor: palette.whitePaper, borderRadius: 8, padding: 16, color: palette.ink }, section: { color: palette.ink, fontSize: 18, fontWeight: "900", marginTop: 8 }, link: { color: palette.mutedBrown, backgroundColor: palette.whitePaper, padding: 12, borderRadius: 8 } });
