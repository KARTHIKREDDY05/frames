import React, { useEffect, useRef, useState } from "react";
import { Animated, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { palette } from "@frames/ui";
import { AppIcon } from "./AppIcon";
import type { VoiceMemory } from "../store/appStore";

interface VoiceMemoryPlayerProps {
  memory?: VoiceMemory;
  audioDurationSec?: number;
  speakerName?: string;
  onRecordNew?: () => void;
  compact?: boolean;
}

export function VoiceMemoryPlayer({
  memory,
  audioDurationSec = 12,
  speakerName = "Mom's Voice",
  onRecordNew,
  compact = false
}: VoiceMemoryPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const animValue = useRef(new Animated.Value(0)).current;

  const duration = memory?.durationSec || audioDurationSec;
  const speaker = memory?.speakerName || speakerName;
  const caption = memory?.caption || "A sweet voice memory to remember forever.";

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setPlaybackProgress((prev) => {
          if (prev >= 1) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 0.05;
        });
      }, (duration * 1000) / 20);
    } else {
      setPlaybackProgress(0);
    }
    return () => clearInterval(interval);
  }, [duration, isPlaying]);

  const togglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
      setPlaybackProgress(0);
    } else {
      setIsPlaying(true);
      Animated.sequence([
        Animated.timing(animValue, { toValue: 1, duration: 150, useNativeDriver: Platform.OS !== "web" }),
        Animated.timing(animValue, { toValue: 0, duration: 150, useNativeDriver: Platform.OS !== "web" })
      ]).start();
    }
  };

  const remainingSeconds = Math.max(0, Math.ceil(duration * (1 - playbackProgress)));

  if (compact) {
    return (
      <Pressable
        style={[styles.compactContainer, isPlaying && styles.compactContainerPlaying]}
        onPress={togglePlay}
      >
        <View style={styles.playIconCircle}>
          <AppIcon name={isPlaying ? "close" : "spark"} color={palette.ink} size={14} />
        </View>
        <View style={styles.compactTextCol}>
          <Text style={styles.compactSpeaker}>{speaker}</Text>
          <Text style={styles.compactDuration}>
            {isPlaying ? `Playing (${remainingSeconds}s)` : `Voice Note • ${duration}s`}
          </Text>
        </View>
        <View style={styles.miniWaveform}>
          {[40, 75, 55, 90, 60, 100, 70, 45, 80].map((h, i) => (
            <View
              key={i}
              style={[
                styles.miniWaveBar,
                { height: isPlaying ? Math.max(4, (h / 100) * 16 * ((i % 2 === 0 ? 1 : 0.6) + Math.random() * 0.4)) : (h / 100) * 14 },
                playbackProgress > i / 9 && styles.waveBarActive
              ]}
            />
          ))}
        </View>
      </Pressable>
    );
  }

  return (
    <View style={styles.container}>
      {/* Tape Header */}
      <View style={styles.cassetteHeader}>
        <View style={styles.vintageTag}>
          <Text style={styles.vintageTagText}>🎙️ AUDIO POSTCARD</Text>
        </View>
        <Text style={styles.speakerText}>{speaker}</Text>
      </View>

      {/* Caption */}
      <Text style={styles.captionText}>"{caption}"</Text>

      {/* Visual Audio Waveform */}
      <View style={styles.waveformContainer}>
        {[20, 50, 85, 40, 65, 95, 70, 30, 80, 100, 60, 45, 90, 75, 35, 55, 85, 40].map((h, index) => {
          const isActive = playbackProgress >= index / 18;
          return (
            <View
              key={index}
              style={[
                styles.waveBar,
                {
                  height: isPlaying ? Math.max(6, (h / 100) * 28 * (0.6 + Math.random() * 0.8)) : (h / 100) * 24
                },
                isActive && styles.waveBarActive
              ]}
            />
          );
        })}
      </View>

      {/* Controls Row */}
      <View style={styles.controlsRow}>
        <Pressable
          style={[styles.playButton, isPlaying && styles.playButtonActive]}
          onPress={togglePlay}
        >
          <AppIcon name={isPlaying ? "close" : "spark"} color={palette.ink} size={16} />
          <Text style={styles.playButtonText}>{isPlaying ? "Pause" : "Play Memory"}</Text>
        </Pressable>

        <Text style={styles.timerText}>
          {isPlaying ? `0:0${remainingSeconds}` : `0:${duration < 10 ? `0${duration}` : duration}`}
        </Text>

        {onRecordNew ? (
          <Pressable style={styles.recordNewBtn} onPress={onRecordNew}>
            <AppIcon name="camera" color={palette.mutedBrown} size={14} />
            <Text style={styles.recordNewText}>Add Voice</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FBF7EE",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E2D3B8",
    padding: 14,
    marginVertical: 8,
    shadowColor: palette.ink,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 0,
    elevation: 3
  },
  cassetteHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6
  },
  vintageTag: {
    backgroundColor: "#FFECC8",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#D9A54C"
  },
  vintageTagText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#8B5704",
    letterSpacing: 0.5
  },
  speakerText: {
    fontSize: 13,
    fontWeight: "800",
    color: palette.ink
  },
  captionText: {
    fontSize: 13,
    fontStyle: "italic",
    color: palette.mutedBrown,
    marginBottom: 10
  },
  waveformContainer: {
    height: 34,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F3EBD9",
    borderRadius: 8,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: "#DFD1B8",
    marginBottom: 10
  },
  waveBar: {
    width: 3.5,
    backgroundColor: "#C5B297",
    borderRadius: 2
  },
  waveBarActive: {
    backgroundColor: "#E05A47"
  },
  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  playButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: palette.acidYellow,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: palette.ink
  },
  playButtonActive: {
    backgroundColor: "#FFD08A"
  },
  playButtonText: {
    fontSize: 12,
    fontWeight: "900",
    color: palette.ink
  },
  timerText: {
    fontSize: 12,
    fontWeight: "800",
    color: palette.mutedBrown,
    fontVariant: ["tabular-nums"]
  },
  recordNewBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  recordNewText: {
    fontSize: 11,
    fontWeight: "700",
    color: palette.mutedBrown
  },
  compactContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9F4E8",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E5D9C4",
    gap: 8
  },
  compactContainerPlaying: {
    backgroundColor: "#FFF3DC",
    borderColor: "#F0B429"
  },
  playIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: palette.acidYellow,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: palette.ink
  },
  compactTextCol: {
    flex: 1
  },
  compactSpeaker: {
    fontSize: 12,
    fontWeight: "800",
    color: palette.ink
  },
  compactDuration: {
    fontSize: 10,
    fontWeight: "600",
    color: palette.mutedBrown
  },
  miniWaveform: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2.5
  },
  miniWaveBar: {
    width: 2.5,
    backgroundColor: "#C9B9A3",
    borderRadius: 1.5
  }
});
