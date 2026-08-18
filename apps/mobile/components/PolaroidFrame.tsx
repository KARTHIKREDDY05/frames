import { Image, StyleSheet, Text, View, type ImageStyle, type StyleProp, type ViewStyle } from "react-native";
import type { FrameStyle, PhotoFilter } from "@frames/types";
import { palette } from "@frames/ui";
import { WashiTape } from "./WashiTape";

const FILM_HOLES = Array.from({ length: 9 });
const CONTACT_CELLS = Array.from({ length: 6 });
const PERFS = Array.from({ length: 12 });

export const frameTemplateOptions: Array<{ label: string; value: FrameStyle; group: string }> = [
  { label: "Polaroid", value: "POLAROID", group: "Instant" },
  { label: "Classic", value: "INSTANT_CLASSIC", group: "Instant" },
  { label: "Filmstrip", value: "FILMSTRIP", group: "Analog" },
  { label: "Negative", value: "NEGATIVE_STRIP", group: "Analog" },
  { label: "Slide", value: "SLIDE_MOUNT", group: "Analog" },
  { label: "Contact", value: "CONTACT_SHEET", group: "Analog" },
  { label: "Torn", value: "TORN_PAPER", group: "Scrapbook" },
  { label: "Sticker", value: "STICKER", group: "Scrapbook" },
  { label: "Washi", value: "WASHI_COLLAGE", group: "Scrapbook" },
  { label: "Notebook", value: "NOTEBOOK", group: "Scrapbook" },
  { label: "Postcard", value: "POSTCARD", group: "Print" },
  { label: "Vintage", value: "VINTAGE", group: "Print" },
  { label: "Cinema", value: "CINEMA", group: "Editorial" },
  { label: "Magazine", value: "MAGAZINE", group: "Editorial" },
  { label: "Stamp", value: "STAMP", group: "Print" },
  { label: "Minimal", value: "MINIMAL", group: "Clean" }
];

export const photoFilterOptions: Array<{ label: string; value: PhotoFilter; tint: string; opacity: number }> = [
  { label: "Original", value: "ORIGINAL", tint: "transparent", opacity: 0 },
  { label: "Warm", value: "WARM", tint: "#E58D3D", opacity: 0.2 },
  { label: "Cool", value: "COOL", tint: "#4F9FD8", opacity: 0.2 },
  { label: "Mono", value: "MONO", tint: "#111111", opacity: 0.25 },
  { label: "Fade", value: "FADE", tint: "#FFF1D2", opacity: 0.32 },
  { label: "Punch", value: "PUNCH", tint: "#C8294C", opacity: 0.16 },
  { label: "Dream", value: "DREAMY", tint: "#B99BFF", opacity: 0.22 },
  { label: "Noir", value: "NOIR", tint: "#050505", opacity: 0.38 },
  { label: "Chrome", value: "CHROME", tint: "#62D0FF", opacity: 0.2 },
  { label: "Blush", value: "BLUSH", tint: "#FF7CA8", opacity: 0.2 },
  { label: "Teal", value: "TEAL", tint: "#00B8A9", opacity: 0.22 },
  { label: "Gold", value: "GOLD", tint: "#F3C14E", opacity: 0.2 },
  { label: "Drama", value: "DRAMA", tint: "#2A1632", opacity: 0.34 },
  { label: "Soft", value: "SOFT", tint: "#FFF8F0", opacity: 0.24 },
  { label: "Grain", value: "GRAIN", tint: "#6B625C", opacity: 0.16 },
  { label: "Sunset", value: "SUNSET", tint: "#FF6B3A", opacity: 0.24 }
];

export function PolaroidFrame({ imageUrl, caption, frameStyle = "POLAROID", filterPreset = "ORIGINAL" }: { imageUrl: string; caption?: string | null; frameStyle?: FrameStyle; filterPreset?: PhotoFilter }) {
  const showCaption = frameStyle !== "MINIMAL" && frameStyle !== "CINEMA";
  const isDark = frameStyle === "FILMSTRIP" || frameStyle === "NEGATIVE_STRIP" || frameStyle === "CINEMA";
  const needsTape = ["POLAROID", "TORN_PAPER", "WASHI_COLLAGE", "NOTEBOOK"].includes(frameStyle);
  const filter = photoFilterOptions.find((option) => option.value === filterPreset) ?? photoFilterOptions[0]!;

  return (
    <View style={[styles.card, cardStyleByFrame[frameStyle]]}>
      {needsTape ? <WashiTape /> : null}
      {frameStyle === "FILMSTRIP" || frameStyle === "NEGATIVE_STRIP" ? <FilmRail position="top" negative={frameStyle === "NEGATIVE_STRIP"} /> : null}
      {frameStyle === "CONTACT_SHEET" ? <ContactSheet /> : null}
      {frameStyle === "SLIDE_MOUNT" ? <Text style={styles.slideCode}>FRAMES 35MM / 01</Text> : null}
      {frameStyle === "POSTCARD" ? <Text style={styles.postmark}>AIR MAIL</Text> : null}
      {frameStyle === "MAGAZINE" ? <Text style={styles.magazineMast}>FRAMES</Text> : null}
      {frameStyle === "STAMP" ? <Perforation /> : null}
      {frameStyle === "NOTEBOOK" ? <NotebookLines /> : null}
      <View style={[styles.imageWrap, imageWrapStyleByFrame[frameStyle]]}>
        <Image source={{ uri: imageUrl }} style={[styles.image, photoStyleByFrame[frameStyle]]} />
        {filter.value !== "ORIGINAL" ? <View pointerEvents="none" style={[styles.filterWash, { backgroundColor: filter.tint, opacity: filter.opacity }]} /> : null}
        {filter.value === "MONO" || filter.value === "NOIR" ? <View pointerEvents="none" style={styles.monoWash} /> : null}
        {filter.value === "PUNCH" ? <View pointerEvents="none" style={styles.punchWash} /> : null}
        {filter.value === "CHROME" || filter.value === "TEAL" ? <View pointerEvents="none" style={styles.coolContrastWash} /> : null}
        {filter.value === "DRAMA" || filter.value === "NOIR" ? <View pointerEvents="none" style={styles.dramaWash} /> : null}
        {filter.value === "GRAIN" ? <GrainOverlay /> : null}
        {filter.value === "SUNSET" || filter.value === "BLUSH" ? <View pointerEvents="none" style={styles.warmEdgeWash} /> : null}
        {frameStyle === "VINTAGE" ? <View pointerEvents="none" style={styles.vintageWash} /> : null}
        {frameStyle === "NEGATIVE_STRIP" ? <View pointerEvents="none" style={styles.negativeWash} /> : null}
        {frameStyle === "CINEMA" ? <View pointerEvents="none" style={styles.cinemaBars}><View style={styles.cinemaBar} /><View style={styles.cinemaBar} /></View> : null}
        {frameStyle === "WASHI_COLLAGE" ? <WashiPieces /> : null}
      </View>
      {frameStyle === "FILMSTRIP" || frameStyle === "NEGATIVE_STRIP" ? <FilmRail position="bottom" negative={frameStyle === "NEGATIVE_STRIP"} /> : null}
      {frameStyle === "STICKER" ? <Text style={styles.stickerBadge}>FRAME</Text> : null}
      {frameStyle === "POSTCARD" ? <View style={styles.postcardLines}><View style={styles.postcardLine} /><View style={styles.postcardLine} /><View style={styles.postcardLine} /></View> : null}
      {showCaption ? <Text style={[styles.caption, isDark && styles.lightCaption, frameStyle === "VINTAGE" && styles.vintageCaption]}>{caption}</Text> : null}
    </View>
  );
}

function FilmRail({ position, negative }: { position: "top" | "bottom"; negative?: boolean }) {
  return <View style={[styles.filmRail, position === "top" ? styles.filmTop : styles.filmBottom]}>{FILM_HOLES.map((_, index) => <View key={index} style={[styles.filmHole, negative && styles.negativeHole]} />)}</View>;
}

function ContactSheet() {
  return <View pointerEvents="none" style={styles.contactGrid}>{CONTACT_CELLS.map((_, index) => <View key={index} style={styles.contactCell} />)}</View>;
}

function Perforation() {
  return <View pointerEvents="none" style={styles.perfRow}>{PERFS.map((_, index) => <View key={index} style={styles.perfDot} />)}</View>;
}

function NotebookLines() {
  return <View pointerEvents="none" style={styles.notebookLines}>{Array.from({ length: 8 }).map((_, index) => <View key={index} style={styles.notebookLine} />)}</View>;
}

function WashiPieces() {
  return (
    <>
      <View style={[styles.washiPiece, styles.washiOne]} />
      <View style={[styles.washiPiece, styles.washiTwo]} />
      <View style={[styles.washiPiece, styles.washiThree]} />
    </>
  );
}

function GrainOverlay() {
  return (
    <View pointerEvents="none" style={styles.grainOverlay}>
      {Array.from({ length: 10 }).map((_, index) => <View key={index} style={[styles.grainLine, { top: `${index * 10}%`, opacity: index % 2 ? 0.1 : 0.06 }]} />)}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: palette.whitePaper, padding: 14, paddingBottom: 46, borderRadius: 8, borderWidth: 1, borderColor: "#E4D9CA", width: "100%", maxWidth: 560, alignSelf: "center", overflow: "hidden", position: "relative" },
  POLAROID: { backgroundColor: palette.whitePaper, paddingBottom: 48 },
  INSTANT_CLASSIC: { backgroundColor: "#FAF5EA", borderColor: "#D4C3AE", padding: 18, paddingBottom: 54 },
  FILMSTRIP: { backgroundColor: "#181415", borderColor: "#181415", borderRadius: 4, padding: 12, paddingBottom: 16 },
  NEGATIVE_STRIP: { backgroundColor: "#0D0F13", borderColor: "#0D0F13", borderRadius: 4, padding: 12, paddingBottom: 16 },
  SLIDE_MOUNT: { backgroundColor: "#F7F0DC", borderColor: "#C9B88F", borderRadius: 4, padding: 24, paddingBottom: 44 },
  CONTACT_SHEET: { backgroundColor: "#211B1C", borderColor: "#211B1C", padding: 12, paddingBottom: 34 },
  TORN_PAPER: { backgroundColor: "#FFF8EC", borderColor: "#D8C8B3", borderStyle: "dashed", borderRadius: 2, padding: 16, paddingBottom: 42, transform: [{ rotate: "-1deg" }] },
  STICKER: { backgroundColor: "#FFFDF8", borderColor: "#342B2A", borderRadius: 22, padding: 10, paddingBottom: 34, shadowColor: palette.ink, shadowOpacity: 0.18, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  WASHI_COLLAGE: { backgroundColor: "#FFFDF8", borderColor: "#E0D3C1", padding: 16, paddingBottom: 44, transform: [{ rotate: "0.8deg" }] },
  NOTEBOOK: { backgroundColor: "#FFFDF8", borderColor: "#C8DCE8", padding: 18, paddingBottom: 44 },
  POSTCARD: { backgroundColor: "#FBF1DA", borderColor: "#C6A77D", padding: 16, paddingBottom: 48 },
  VINTAGE: { backgroundColor: "#F1DFC6", borderColor: "#B9966F", padding: 16, paddingBottom: 44 },
  CINEMA: { backgroundColor: "#111111", borderColor: "#111111", padding: 10, paddingBottom: 10, borderRadius: 3 },
  MAGAZINE: { backgroundColor: "#FFFFFF", borderColor: "#111111", padding: 8, paddingTop: 46, paddingBottom: 20 },
  STAMP: { backgroundColor: "#F8F0DA", borderColor: "#B99F73", borderStyle: "dashed", padding: 14, paddingBottom: 40 },
  MINIMAL: { backgroundColor: "transparent", borderColor: "transparent", padding: 0, paddingBottom: 0 },
  imageWrap: { position: "relative", overflow: "hidden", borderRadius: 6, backgroundColor: palette.softPeach },
  image: { width: "100%", aspectRatio: 1, maxHeight: 520, borderRadius: 6, backgroundColor: palette.softPeach },
  INSTANT_CLASSIC_IMAGE: { borderWidth: 8, borderColor: "#FFFFFF", borderRadius: 3 },
  FILMSTRIP_IMAGE: { borderRadius: 2 },
  NEGATIVE_STRIP_IMAGE: { borderRadius: 2 },
  SLIDE_MOUNT_IMAGE: { borderRadius: 2, borderWidth: 2, borderColor: "#2E292A" },
  TORN_PAPER_IMAGE: { borderRadius: 1, borderWidth: 1, borderColor: "#E7D8C4" },
  STICKER_IMAGE: { borderRadius: 18 },
  NOTEBOOK_IMAGE: { borderRadius: 4, marginLeft: 14 },
  CINEMA_IMAGE: { borderRadius: 2 },
  MAGAZINE_IMAGE: { borderRadius: 0 },
  STAMP_IMAGE: { borderRadius: 4, borderWidth: 5, borderColor: "#FFFDF8" },
  MINIMAL_IMAGE: { borderRadius: 8 },
  VINTAGE_PHOTO: { opacity: 0.86 },
  NEGATIVE_STRIP_PHOTO: { opacity: 0.78 },
  MINIMAL_PHOTO: { borderRadius: 8 },
  vintageWash: { ...StyleSheet.absoluteFillObject, backgroundColor: "#A66A2B", opacity: 0.16 },
  negativeWash: { ...StyleSheet.absoluteFillObject, backgroundColor: "#283D70", opacity: 0.26 },
  filterWash: { ...StyleSheet.absoluteFillObject },
  monoWash: { ...StyleSheet.absoluteFillObject, backgroundColor: "#FFFFFF", opacity: 0.08 },
  punchWash: { ...StyleSheet.absoluteFillObject, borderWidth: 12, borderColor: "rgba(255,255,255,.08)" },
  coolContrastWash: { ...StyleSheet.absoluteFillObject, borderWidth: 10, borderColor: "rgba(255,255,255,.1)" },
  dramaWash: { ...StyleSheet.absoluteFillObject, borderWidth: 18, borderColor: "rgba(0,0,0,.16)" },
  warmEdgeWash: { ...StyleSheet.absoluteFillObject, borderWidth: 14, borderColor: "rgba(255,229,190,.16)" },
  grainOverlay: { ...StyleSheet.absoluteFillObject },
  grainLine: { position: "absolute", left: 0, right: 0, height: 1, backgroundColor: "#FFFFFF" },
  caption: { color: palette.mutedBrown, marginTop: 12, fontSize: 15 },
  lightCaption: { color: palette.whitePaper, fontWeight: "800" },
  vintageCaption: { color: "#6D4D34", fontWeight: "800" },
  filmRail: { flexDirection: "row", justifyContent: "space-between" },
  filmTop: { marginBottom: 10 },
  filmBottom: { marginTop: 10 },
  filmHole: { width: 14, height: 8, borderRadius: 2, backgroundColor: palette.paperCream },
  negativeHole: { backgroundColor: "#445067" },
  stickerBadge: { position: "absolute", right: 16, bottom: 10, color: palette.ink, backgroundColor: palette.sunshine, borderRadius: 10, overflow: "hidden", paddingHorizontal: 9, paddingVertical: 3, fontSize: 11, fontWeight: "900" },
  slideCode: { color: "#8A744F", fontSize: 11, fontWeight: "900", marginBottom: 10 },
  contactGrid: { ...StyleSheet.absoluteFillObject, flexDirection: "row", flexWrap: "wrap", gap: 6, padding: 12, opacity: 0.16 },
  contactCell: { width: "31%", aspectRatio: 1, borderWidth: 1, borderColor: palette.whitePaper },
  postmark: { position: "absolute", right: 18, top: 14, color: "#9D5942", borderWidth: 1, borderColor: "#9D5942", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, fontSize: 10, fontWeight: "900", transform: [{ rotate: "8deg" }] },
  postcardLines: { position: "absolute", right: 16, bottom: 15, width: "34%", gap: 5 },
  postcardLine: { height: 1, backgroundColor: "#C6A77D" },
  notebookLines: { ...StyleSheet.absoluteFillObject, paddingTop: 18, gap: 24 },
  notebookLine: { height: 1, backgroundColor: "rgba(199,221,234,.7)" },
  magazineMast: { position: "absolute", top: 8, left: 10, color: "#111111", fontSize: 28, fontWeight: "900" },
  perfRow: { position: "absolute", top: 4, left: 8, right: 8, flexDirection: "row", justifyContent: "space-between" },
  perfDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: palette.paperCream, borderWidth: 1, borderColor: "#B99F73" },
  cinemaBars: { ...StyleSheet.absoluteFillObject, justifyContent: "space-between" },
  cinemaBar: { height: "13%", backgroundColor: "rgba(0,0,0,.72)" },
  washiPiece: { position: "absolute", height: 18, borderRadius: 3, opacity: 0.9 },
  washiOne: { top: 12, left: -10, width: 92, backgroundColor: palette.sunshine, transform: [{ rotate: "-12deg" }] },
  washiTwo: { right: -8, top: 18, width: 76, backgroundColor: palette.powderBlue, transform: [{ rotate: "14deg" }] },
  washiThree: { bottom: 10, left: "35%", width: 90, backgroundColor: palette.softPeach, transform: [{ rotate: "4deg" }] }
});

const cardStyleByFrame: Record<FrameStyle, StyleProp<ViewStyle>> = {
  POLAROID: styles.POLAROID,
  INSTANT_CLASSIC: styles.INSTANT_CLASSIC,
  FILMSTRIP: styles.FILMSTRIP,
  NEGATIVE_STRIP: styles.NEGATIVE_STRIP,
  SLIDE_MOUNT: styles.SLIDE_MOUNT,
  CONTACT_SHEET: styles.CONTACT_SHEET,
  TORN_PAPER: styles.TORN_PAPER,
  STICKER: styles.STICKER,
  WASHI_COLLAGE: styles.WASHI_COLLAGE,
  NOTEBOOK: styles.NOTEBOOK,
  POSTCARD: styles.POSTCARD,
  VINTAGE: styles.VINTAGE,
  CINEMA: styles.CINEMA,
  MAGAZINE: styles.MAGAZINE,
  STAMP: styles.STAMP,
  MINIMAL: styles.MINIMAL
};

const imageWrapStyleByFrame: Partial<Record<FrameStyle, StyleProp<ViewStyle>>> = {
  INSTANT_CLASSIC: styles.INSTANT_CLASSIC_IMAGE,
  FILMSTRIP: styles.FILMSTRIP_IMAGE,
  NEGATIVE_STRIP: styles.NEGATIVE_STRIP_IMAGE,
  SLIDE_MOUNT: styles.SLIDE_MOUNT_IMAGE,
  TORN_PAPER: styles.TORN_PAPER_IMAGE,
  STICKER: styles.STICKER_IMAGE,
  NOTEBOOK: styles.NOTEBOOK_IMAGE,
  CINEMA: styles.CINEMA_IMAGE,
  MAGAZINE: styles.MAGAZINE_IMAGE,
  STAMP: styles.STAMP_IMAGE,
  MINIMAL: styles.MINIMAL_IMAGE
};

const photoStyleByFrame: Partial<Record<FrameStyle, StyleProp<ImageStyle>>> = {
  VINTAGE: styles.VINTAGE_PHOTO,
  NEGATIVE_STRIP: styles.NEGATIVE_STRIP_PHOTO,
  MINIMAL: styles.MINIMAL_PHOTO
};
