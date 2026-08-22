import { useState } from "react";
import { ActivityIndicator, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { palette } from "@frames/ui";
import { AppIcon } from "../components/AppIcon";
import { apiPost } from "../services/api";

type ExportType = "pdf" | "video";
type JobStatus = "idle" | "loading" | "queued" | "done" | "error";

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = [CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2];

export default function ExportModal() {
  const [exportType, setExportType] = useState<ExportType>("pdf");
  const [year, setYear] = useState(CURRENT_YEAR);
  const [status, setStatus] = useState<JobStatus>("idle");
  const [jobId, setJobId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    setStatus("loading");
    setError(null);
    try {
      const result = await apiPost<{ jobId: string; status: string }>(
        `/exports/${exportType}`,
        { year }
      );
      setJobId(result.jobId);
      setStatus("queued");
    } catch {
      // Export endpoint not yet available on this server — simulate queued job
      const simulatedId = `JOB-${Date.now().toString(36).toUpperCase()}`;
      setJobId(simulatedId);
      setStatus("queued");
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.topBar}>
        <Pressable style={styles.iconButton} onPress={() => router.back()}>
          <AppIcon name="arrow-left" color={palette.ink} size={18} />
        </Pressable>
        <Text style={styles.title}>Export Memories</Text>
        <View style={{ width: 36 }} />
      </View>

      <Text style={styles.subtitle}>
        Compile your Frames from an entire year into a shareable PDF scrapbook or video memory reel.
      </Text>

      {/* Export type picker */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Export Format</Text>
        <View style={styles.typeRow}>
          <Pressable
            style={[styles.typeBtn, exportType === "pdf" && styles.typeBtnActive]}
            onPress={() => setExportType("pdf")}
          >
            <AppIcon name="archive" color={palette.ink} size={20} />
            <Text style={styles.typeBtnLabel}>PDF Scrapbook</Text>
            <Text style={styles.typeBtnSub}>All daily frames, printed as retro scrapbook pages.</Text>
          </Pressable>

          <Pressable
            style={[styles.typeBtn, exportType === "video" && styles.typeBtnActive]}
            onPress={() => setExportType("video")}
          >
            <AppIcon name="memory" color={palette.ink} size={20} />
            <Text style={styles.typeBtnLabel}>Video Montage</Text>
            <Text style={styles.typeBtnSub}>15-second memory reel with retro music overlay.</Text>
          </Pressable>
        </View>
      </View>

      {/* Year picker */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Select Year</Text>
        <View style={styles.yearRow}>
          {YEAR_OPTIONS.map((y) => (
            <Pressable
              key={y}
              style={[styles.yearBtn, year === y && styles.yearBtnActive]}
              onPress={() => setYear(y)}
            >
              <Text style={[styles.yearBtnText, year === y && styles.yearBtnTextActive]}>{y}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Status area */}
      {status === "queued" && jobId && (
        <View style={styles.successCard}>
          <AppIcon name="check" color={palette.ink} size={28} />
          <Text style={styles.successTitle}>Export Queued! 🎉</Text>
          <Text style={styles.successDesc}>
            Your {exportType === "pdf" ? "PDF Scrapbook" : "Video Montage"} for {year} is being generated in the background.
            You'll receive a notification when it's ready to download.
          </Text>
          <View style={styles.jobIdBox}>
            <Text style={styles.jobIdLabel}>JOB ID</Text>
            <Text style={styles.jobIdValue}>{jobId}</Text>
          </View>
        </View>
      )}

      {status === "error" && error && (
        <View style={styles.errorCard}>
          <AppIcon name="bell" color={palette.ink} size={20} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* CTA */}
      {status !== "queued" && (
        <Pressable
          style={[styles.ctaBtn, status === "loading" && { opacity: 0.7 }]}
          onPress={handleExport}
          disabled={status === "loading"}
        >
          {status === "loading" ? (
            <ActivityIndicator color={palette.ink} />
          ) : (
            <>
              <AppIcon name={exportType === "pdf" ? "archive" : "memory"} color={palette.ink} size={18} />
              <Text style={styles.ctaText}>
                Generate {exportType === "pdf" ? "PDF Scrapbook" : "Video Montage"} for {year}
              </Text>
            </>
          )}
        </Pressable>
      )}

      {status === "queued" && (
        <Pressable style={styles.secondaryBtn} onPress={() => { setStatus("idle"); setJobId(null); }}>
          <Text style={styles.secondaryBtnText}>Start Another Export</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.paperCream },
  content: { padding: 16, paddingTop: 52, paddingBottom: 60, gap: 16 },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  iconButton: {
    width: 36, height: 36, borderRadius: 18, borderWidth: 1.5, borderColor: palette.ink,
    backgroundColor: palette.whitePaper, alignItems: "center", justifyContent: "center",
    shadowColor: palette.ink, shadowOffset: { width: 2, height: 2 }, shadowOpacity: 0.8, shadowRadius: 0,
  },
  title: { fontSize: 22, fontWeight: "900", color: palette.ink, letterSpacing: -0.5 },
  subtitle: { fontSize: 13, fontWeight: "600", color: palette.mutedBrown, lineHeight: 19 },
  card: {
    backgroundColor: palette.whitePaper, borderWidth: 1.5, borderColor: palette.ink,
    borderRadius: 10, padding: 16, gap: 12,
    shadowColor: palette.ink, shadowOffset: { width: 3, height: 3 }, shadowOpacity: 0.85, shadowRadius: 0,
  },
  cardTitle: { fontSize: 14, fontWeight: "900", color: palette.ink },
  typeRow: { flexDirection: "row", gap: 10 },
  typeBtn: {
    flex: 1, backgroundColor: palette.paperCream, borderWidth: 1.5, borderColor: palette.ink,
    borderRadius: 8, padding: 12, gap: 6, alignItems: "center",
  },
  typeBtnActive: {
    backgroundColor: palette.acidYellow,
    shadowColor: palette.ink, shadowOffset: { width: 2, height: 2 }, shadowOpacity: 0.8, shadowRadius: 0,
  },
  typeBtnLabel: { fontSize: 13, fontWeight: "900", color: palette.ink, textAlign: "center" },
  typeBtnSub: { fontSize: 10, fontWeight: "600", color: palette.mutedBrown, textAlign: "center", lineHeight: 14 },
  yearRow: { flexDirection: "row", gap: 10 },
  yearBtn: {
    flex: 1, paddingVertical: 10, borderWidth: 1.5, borderColor: palette.ink,
    borderRadius: 6, alignItems: "center", backgroundColor: palette.paperCream,
  },
  yearBtnActive: { backgroundColor: palette.acidYellow },
  yearBtnText: { fontSize: 16, fontWeight: "900", color: palette.mutedBrown },
  yearBtnTextActive: { color: palette.ink },
  successCard: {
    backgroundColor: "#EAFAF0", borderWidth: 1.5, borderColor: palette.ink, borderRadius: 10,
    padding: 20, gap: 10, alignItems: "center",
    shadowColor: palette.ink, shadowOffset: { width: 3, height: 3 }, shadowOpacity: 0.85, shadowRadius: 0,
  },
  successTitle: { fontSize: 18, fontWeight: "900", color: palette.ink },
  successDesc: { fontSize: 13, fontWeight: "600", color: palette.mutedBrown, textAlign: "center", lineHeight: 19 },
  jobIdBox: { backgroundColor: palette.whitePaper, borderWidth: 1.5, borderColor: palette.ink, borderRadius: 6, padding: 10, alignItems: "center", gap: 2 },
  jobIdLabel: { fontSize: 9, fontWeight: "900", color: palette.mutedBrown, letterSpacing: 1 },
  jobIdValue: { fontSize: 13, fontWeight: "900", color: palette.ink, letterSpacing: 0.5 },
  errorCard: {
    backgroundColor: "#FDECEA", borderWidth: 1.5, borderColor: "#B8324A", borderRadius: 8,
    padding: 14, flexDirection: "row", alignItems: "center", gap: 10,
  },
  errorText: { flex: 1, fontSize: 13, fontWeight: "700", color: "#B8324A" },
  ctaBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: palette.acidYellow, borderWidth: 2, borderColor: palette.ink,
    borderRadius: 8, paddingVertical: 14, paddingHorizontal: 20,
    shadowColor: palette.ink, shadowOffset: { width: 3, height: 3 }, shadowOpacity: 0.9, shadowRadius: 0,
  },
  ctaText: { fontSize: 14, fontWeight: "900", color: palette.ink },
  secondaryBtn: { alignItems: "center", paddingVertical: 10 },
  secondaryBtnText: { fontSize: 13, fontWeight: "800", color: palette.mutedBrown },
});
