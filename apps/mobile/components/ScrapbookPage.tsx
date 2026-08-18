import { Image, StyleSheet, Text, View } from "react-native";
import type { DailyFrameDto } from "@frames/types";
import { palette } from "@frames/ui";
import { PolaroidFrame } from "./PolaroidFrame";

const tapeColors = [palette.sunshine, palette.softPeach, palette.powderBlue, palette.sage];

export function ScrapbookPage({ frame }: { frame: DailyFrameDto }) {
  const posts = frame.posts;
  const cover = frame.coverMediaUrl ?? posts[0]?.mediaUrl;
  const date = new Date(`${frame.date}T00:00:00`);
  const day = date.toLocaleDateString("en-US", { weekday: "long" });
  const shortDate = date.toLocaleDateString("en-US", { month: "short", day: "numeric" }).toUpperCase();
  const extraCount = Math.max(0, posts.length - 4);
  const keptCount = posts.filter((post) => post.profileFeatured).length;

  return (
    <View style={styles.page}>
      <View style={styles.binder}>
        {Array.from({ length: 7 }).map((_, index) => <View key={index} style={styles.binderHole} />)}
      </View>
      <View style={styles.header}>
        <View style={styles.titleBlock}>
          <Text style={styles.kicker}>DAILY SCRAPBOOK</Text>
          <Text style={styles.title}>{shortDate}</Text>
          <Text style={styles.subtitle}>{day} - {posts.length} Frame{posts.length === 1 ? "" : "s"}</Text>
        </View>
        {cover ? (
          <View style={styles.coverWrap}>
            <Image source={{ uri: cover }} style={styles.cover} />
            <Text style={styles.coverLabel}>cover</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.noteCard}>
        <Text style={styles.noteTitle}>{frame.title}</Text>
        <Text style={styles.noteCopy}>{frame.subtitle}</Text>
      </View>

      <View style={styles.moodRow}>
        <Text style={styles.moodChip}>Captured {posts.length}</Text>
        <Text style={styles.moodChip}>Sorted {shortDate}</Text>
        <Text style={styles.moodChip}>Kept {keptCount}</Text>
      </View>

      <View style={styles.layout}>
        {posts.slice(0, 4).map((post, index) => (
          <View key={post.id} style={[styles.photoSlot, slotStyleByIndex[index] ?? styles.slotDefault]}>
            <View style={[styles.tape, { backgroundColor: tapeColors[index % tapeColors.length] }]} />
            <PolaroidFrame imageUrl={post.mediaUrl} caption={post.caption ?? post.locationName ?? "Untitled Frame"} frameStyle={post.frameStyle} filterPreset={post.filterPreset} />
            <Text style={styles.captureStamp}>{formatCaptureStamp(post.createdAt, post.locationName)}</Text>
          </View>
        ))}
        {posts.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No Frames on this page.</Text>
            <Text style={styles.emptyCopy}>Capture a moment and this page starts filling itself.</Text>
          </View>
        ) : null}
      </View>

      {posts.length > 1 ? (
        <View style={styles.thumbStrip}>
          {posts.slice(0, 8).map((post) => <Image key={post.id} source={{ uri: post.mediaUrl }} style={styles.thumb} />)}
          {extraCount > 0 ? <View style={styles.moreThumb}><Text style={styles.moreText}>+{extraCount}</Text></View> : null}
        </View>
      ) : null}

      <View style={styles.footer}>
        <Text style={styles.footerStamp}>FRAMES / {frame.date}</Text>
        <Text style={styles.footerCopy}>Your life, framed automatically.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { minHeight: 760, backgroundColor: palette.whitePaper, borderRadius: 8, borderWidth: 1, borderColor: "#E4D9CA", padding: 18, paddingLeft: 30, overflow: "hidden", position: "relative", gap: 14 },
  binder: { position: "absolute", left: 8, top: 26, bottom: 26, width: 10, justifyContent: "space-between", alignItems: "center" },
  binderHole: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#D6C8B8" },
  header: { flexDirection: "row", gap: 14, alignItems: "center", justifyContent: "space-between" },
  titleBlock: { flex: 1 },
  kicker: { color: palette.mutedBrown, fontSize: 11, fontWeight: "900" },
  title: { color: palette.ink, fontSize: 34, fontWeight: "900" },
  subtitle: { color: palette.mutedBrown, fontWeight: "800", marginTop: 2 },
  coverWrap: { width: 96, height: 96, borderRadius: 8, padding: 6, backgroundColor: palette.paperCream, borderWidth: 1, borderColor: "#E4D9CA", transform: [{ rotate: "3deg" }] },
  cover: { flex: 1, borderRadius: 5, backgroundColor: palette.softPeach },
  coverLabel: { position: "absolute", bottom: -8, alignSelf: "center", color: palette.ink, backgroundColor: palette.sunshine, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8, overflow: "hidden", fontSize: 10, fontWeight: "900" },
  noteCard: { backgroundColor: "#FFF8EC", borderRadius: 8, borderWidth: 1, borderColor: "#E4D9CA", padding: 12, borderStyle: "dashed" },
  noteTitle: { color: palette.ink, fontSize: 18, fontWeight: "900" },
  noteCopy: { color: palette.mutedBrown, lineHeight: 21, marginTop: 3 },
  moodRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  moodChip: { color: palette.ink, backgroundColor: palette.paperCream, borderWidth: 1, borderColor: "#E4D9CA", borderRadius: 14, paddingHorizontal: 10, paddingVertical: 5, overflow: "hidden", fontSize: 11, fontWeight: "900" },
  layout: { gap: 6, minHeight: 420 },
  photoSlot: { position: "relative", shadowColor: palette.ink, shadowOpacity: 0.14, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
  captureStamp: { alignSelf: "flex-start", marginTop: 6, marginLeft: 10, color: palette.mutedBrown, backgroundColor: "rgba(255,253,248,.86)", borderRadius: 12, overflow: "hidden", paddingHorizontal: 9, paddingVertical: 4, fontSize: 10, fontWeight: "900" },
  slotDefault: { width: "68%" },
  slotOne: { width: "72%", alignSelf: "flex-start", transform: [{ rotate: "-3deg" }] },
  slotTwo: { width: "66%", alignSelf: "flex-end", marginTop: -26, transform: [{ rotate: "4deg" }] },
  slotThree: { width: "58%", alignSelf: "flex-start", marginTop: 4, transform: [{ rotate: "2deg" }] },
  slotFour: { width: "64%", alignSelf: "flex-end", marginTop: -18, transform: [{ rotate: "-2deg" }] },
  tape: { position: "absolute", top: -8, left: "37%", width: 74, height: 18, borderRadius: 3, opacity: 0.88, zIndex: 5, transform: [{ rotate: "-2deg" }] },
  empty: { backgroundColor: palette.paperCream, borderRadius: 8, borderWidth: 1, borderColor: "#E4D9CA", padding: 18, gap: 6 },
  emptyTitle: { color: palette.ink, fontSize: 22, fontWeight: "900" },
  emptyCopy: { color: palette.mutedBrown, lineHeight: 22 },
  thumbStrip: { minHeight: 62, borderRadius: 8, backgroundColor: palette.paperCream, borderWidth: 1, borderColor: "#E4D9CA", padding: 8, flexDirection: "row", gap: 7, alignItems: "center" },
  thumb: { width: 44, height: 44, borderRadius: 6, backgroundColor: palette.softPeach },
  moreThumb: { width: 44, height: 44, borderRadius: 6, backgroundColor: palette.ink, alignItems: "center", justifyContent: "center" },
  moreText: { color: palette.whitePaper, fontWeight: "900" },
  footer: { borderTopWidth: 1, borderTopColor: "#E4D9CA", paddingTop: 12, flexDirection: "row", justifyContent: "space-between", gap: 10 },
  footerStamp: { color: palette.ink, fontSize: 11, fontWeight: "900" },
  footerCopy: { color: palette.mutedBrown, fontSize: 11, fontWeight: "800" }
});

const slotStyleByIndex = [styles.slotOne, styles.slotTwo, styles.slotThree, styles.slotFour];

function formatCaptureStamp(createdAt: string, locationName?: string | null) {
  const date = new Date(createdAt);
  const time = Number.isNaN(date.getTime()) ? "Captured" : date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  return locationName ? `${time} - ${locationName}` : time;
}
