export interface ScrapbookSlot {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  scale: number;
  decoration?: "tape" | "stamp" | "sticker" | "clip";
}

export interface ScrapbookTemplate {
  id: string;
  name: string;
  background: "journal-paper" | "grid-paper" | "cream-paper" | "vintage-paper";
  slots: ScrapbookSlot[];
}

export const dailyTemplates: ScrapbookTemplate[] = [
  {
    id: "polaroid-chaos",
    name: "Polaroid Chaos",
    background: "journal-paper",
    slots: [
      { x: 24, y: 88, width: 210, height: 250, rotation: -5, scale: 1, decoration: "tape" },
      { x: 126, y: 210, width: 210, height: 250, rotation: 6, scale: 0.92, decoration: "sticker" },
      { x: 42, y: 386, width: 250, height: 210, rotation: -2, scale: 1, decoration: "stamp" }
    ]
  },
  {
    id: "quiet-journal",
    name: "Quiet Journal",
    background: "cream-paper",
    slots: [
      { x: 28, y: 96, width: 300, height: 320, rotation: 0, scale: 1, decoration: "clip" },
      { x: 54, y: 444, width: 250, height: 180, rotation: 2, scale: 1, decoration: "tape" }
    ]
  }
];

export const monthlyLayouts = ["Classic Scrapbook", "Polaroid Grid", "Film Roll", "Journal", "Minimal", "Travel Diary"] as const;
