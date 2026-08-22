import React, { useState } from "react";
import {
  Dimensions,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import { palette } from "@frames/ui";
import { AppIcon } from "./AppIcon";
import { FrameButton } from "./FrameButton";
import { VoiceMemoryPlayer } from "./VoiceMemoryPlayer";
import { useAppStore } from "../store/appStore";

interface StoryChapter {
  id: string;
  chapterNumber: number;
  title: string;
  narration: string;
  quote: string;
  mediaUrl: string;
  date: string;
  authorNote?: string;
}

const DEFAULT_CHAPTERS: StoryChapter[] = [
  {
    id: "chap-1",
    chapterNumber: 1,
    title: "Once Upon a Sunny Afternoon ☀️",
    narration:
      "The sun peeked through the leafy canopy as little feet ran through the golden grass. There were bubbles floating in the air, and every single one was chased like a precious treasure. Moments like this remind us that magic isn't in far-off fairy lands — it's right in our backyard.",
    quote: "“The best days are measured in grass stains and giggles.”",
    mediaUrl: "https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=600",
    date: "August 18, 2026",
    authorNote: "Recorded by Mom at 3:45 PM"
  },
  {
    id: "chap-2",
    chapterNumber: 2,
    title: "The Great Pancake Conspiracy 🥞",
    narration:
      "Flour on the nose, syrup on the elbows, and smiles that could light up the entire kitchen. We didn't just make breakfast; we made memories that will warm our hearts twenty years from now.",
    quote: "“Love is the secret ingredient in every messy recipe.”",
    mediaUrl: "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=600",
    date: "August 20, 2026",
    authorNote: "Dad was the sous-chef"
  }
];

export function FamilyStorybookView({ onExportStory }: { onExportStory?: () => void }) {
  const posts = useAppStore((state) => state.posts);
  const [chapters, setChapters] = useState<StoryChapter[]>(DEFAULT_CHAPTERS);
  const [activeChapterIndex, setActiveChapterIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isReadingAloud, setIsReadingAloud] = useState(false);

  const activeChapter = chapters[activeChapterIndex] || chapters[0]!;

  const handleGenerateAiStory = () => {
    setIsGenerating(true);
    setTimeout(() => {
      if (posts.length > 0) {
        const randomPost = posts[Math.floor(Math.random() * posts.length)]!;
        const newChapter: StoryChapter = {
          id: `chap-${Date.now()}`,
          chapterNumber: chapters.length + 1,
          title: `Chapter ${chapters.length + 1}: The Little Wonders ✨`,
          narration: `Under the gentle glow of today, another golden chapter was written. With every smile and quiet glance, our family's story grew richer, reminding us that love is found in the smallest, everyday moments.`,
          quote: "“Family is where our story begins and never ends.”",
          mediaUrl: randomPost.mediaUrl,
          date: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
          authorNote: "AI Storyteller Chronicle"
        };
        setChapters((prev) => [...prev, newChapter]);
        setActiveChapterIndex(chapters.length);
      }
      setIsGenerating(false);
    }, 1200);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Storybook Hardcover Header */}
      <View style={styles.storybookHeader}>
        <View style={styles.bookBadge}>
          <Text style={styles.bookBadgeText}>📖 AI BEDTIME STORYBOOK</Text>
        </View>
        <Text style={styles.bookTitle}>The Chronicles of Us</Text>
        <Text style={styles.bookSubtitle}>
          Your daily frames turned into heartwarming illustrated bedtime story pages
        </Text>
      </View>

      {/* Chapter Selector Ribbon */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chapterRibbon}>
        {chapters.map((chap, idx) => (
          <Pressable
            key={chap.id}
            style={[styles.ribbonTab, activeChapterIndex === idx && styles.ribbonTabActive]}
            onPress={() => setActiveChapterIndex(idx)}
          >
            <Text style={[styles.ribbonTabText, activeChapterIndex === idx && styles.ribbonTabTextActive]}>
              Ch. {chap.chapterNumber}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Illustrated Storybook Page Spread */}
      <View style={styles.pageSpread}>
        {/* Ornate Page Corner */}
        <View style={styles.cornerAccentTopLeft}>
          <Text style={styles.cornerSymbol}>❦</Text>
        </View>
        <View style={styles.cornerAccentTopRight}>
          <Text style={styles.cornerSymbol}>❦</Text>
        </View>

        {/* Chapter Title */}
        <Text style={styles.chapterNumberLabel}>CHAPTER {activeChapter.chapterNumber}</Text>
        <Text style={styles.chapterTitle}>{activeChapter.title}</Text>
        <Text style={styles.chapterDate}>{activeChapter.date}</Text>

        {/* Framed Illustration with Gold Trim */}
        <View style={styles.illustrationFrame}>
          <Image source={{ uri: activeChapter.mediaUrl }} style={styles.illustrationImage} />
        </View>

        {/* Poetic Narration with Drop Cap */}
        <View style={styles.narrationBox}>
          <Text style={styles.narrationText}>{activeChapter.narration}</Text>
        </View>

        {/* Heartfelt Quote */}
        <View style={styles.quoteBox}>
          <Text style={styles.quoteText}>{activeChapter.quote}</Text>
        </View>

        {activeChapter.authorNote ? (
          <Text style={styles.authorNote}>— {activeChapter.authorNote}</Text>
        ) : null}

        {/* Audio Read-Aloud Simulator */}
        <Pressable
          style={[styles.readAloudBtn, isReadingAloud && styles.readAloudBtnActive]}
          onPress={() => setIsReadingAloud(!isReadingAloud)}
        >
          <AppIcon name={isReadingAloud ? "close" : "spark"} color={palette.ink} size={14} />
          <Text style={styles.readAloudText}>
            {isReadingAloud ? "Pause Storyteller Audio ⏸️" : "Listen to Bedtime Narration 🎙️"}
          </Text>
        </Pressable>
      </View>

      {/* Navigation and AI Generation Toolbar */}
      <View style={styles.actionsToolbar}>
        <Pressable
          style={[styles.actionBtn, styles.generateBtn]}
          onPress={handleGenerateAiStory}
          disabled={isGenerating}
        >
          <AppIcon name="spark" color={palette.ink} size={16} />
          <Text style={styles.generateBtnText}>
            {isGenerating ? "Crafting Story..." : "+ Auto-Weave Today's Story"}
          </Text>
        </Pressable>

        <Pressable
          style={[styles.actionBtn, styles.exportBtn]}
          onPress={() => {
            if (onExportStory) onExportStory();
          }}
        >
          <AppIcon name="share" color={palette.ink} size={16} />
          <Text style={styles.exportBtnText}>Print Hardcover Book</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 40
  },
  storybookHeader: {
    backgroundColor: "#F4EDE2",
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderColor: "#DFCDB5",
    alignItems: "center"
  },
  bookBadge: {
    backgroundColor: "#FFECC8",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D9A54C",
    marginBottom: 6
  },
  bookBadgeText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#8B5704",
    letterSpacing: 0.5
  },
  bookTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#2C1B10",
    textAlign: "center"
  },
  bookSubtitle: {
    fontSize: 12,
    color: "#735D4C",
    textAlign: "center",
    marginTop: 4,
    lineHeight: 16
  },
  chapterRibbon: {
    backgroundColor: "#EAE0D2",
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: "row"
  },
  ribbonTab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#DFD1BF",
    marginRight: 8
  },
  ribbonTabActive: {
    backgroundColor: "#2C1B10"
  },
  ribbonTabText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#5B4434"
  },
  ribbonTabTextActive: {
    color: "#FFF4E3"
  },
  pageSpread: {
    backgroundColor: "#FFFDF9",
    margin: 16,
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: "#D4C2A9",
    shadowColor: palette.ink,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
    position: "relative"
  },
  cornerAccentTopLeft: {
    position: "absolute",
    top: 10,
    left: 12
  },
  cornerAccentTopRight: {
    position: "absolute",
    top: 10,
    right: 12
  },
  cornerSymbol: {
    fontSize: 16,
    color: "#B39878"
  },
  chapterNumberLabel: {
    fontSize: 11,
    fontWeight: "900",
    color: "#9C7954",
    textAlign: "center",
    letterSpacing: 1.5,
    marginTop: 4
  },
  chapterTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#2C1B10",
    textAlign: "center",
    marginTop: 2,
    marginBottom: 2
  },
  chapterDate: {
    fontSize: 11,
    fontWeight: "700",
    color: "#8B735F",
    textAlign: "center",
    marginBottom: 16
  },
  illustrationFrame: {
    borderRadius: 12,
    borderWidth: 3,
    borderColor: "#E2C898",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
    marginBottom: 16
  },
  illustrationImage: {
    width: "100%",
    height: 220,
    backgroundColor: "#EAE0D2"
  },
  narrationBox: {
    marginBottom: 14
  },
  narrationText: {
    fontSize: 14,
    lineHeight: 22,
    color: "#38281C",
    fontWeight: "500",
    textAlign: "justify"
  },
  quoteBox: {
    backgroundColor: "#FAF3E8",
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderColor: "#C9A063",
    marginBottom: 10
  },
  quoteText: {
    fontSize: 13,
    fontStyle: "italic",
    color: "#5C412B",
    lineHeight: 18,
    fontWeight: "600"
  },
  authorNote: {
    fontSize: 11,
    color: "#967F6C",
    textAlign: "right",
    fontStyle: "italic",
    marginBottom: 14
  },
  readAloudBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#FFECC8",
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#D9A54C"
  },
  readAloudBtnActive: {
    backgroundColor: "#FFD285"
  },
  readAloudText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#744503"
  },
  actionsToolbar: {
    paddingHorizontal: 16,
    gap: 10
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: palette.ink
  },
  generateBtn: {
    backgroundColor: palette.acidYellow
  },
  generateBtnText: {
    fontSize: 13,
    fontWeight: "900",
    color: palette.ink
  },
  exportBtn: {
    backgroundColor: palette.whitePaper
  },
  exportBtnText: {
    fontSize: 13,
    fontWeight: "800",
    color: palette.ink
  }
});
