import type { DailyFrameDto, MonthlyCollageDto, PostDto, UserDto, YearbookDto } from "@frames/types";

export const demoUser: UserDto = {
  id: "user-arjun",
  username: "arjun",
  displayName: "Arjun Rao",
  email: "arjun@frames.local",
  avatarUrl: "https://i.pravatar.cc/160?u=arjun",
  bio: "Collecting ordinary magic.",
  defaultPrivacy: "FRIENDS"
};

const friends: UserDto[] = [
  { id: "user-maya", username: "maya", displayName: "Maya", avatarUrl: "https://i.pravatar.cc/160?u=maya", defaultPrivacy: "PUBLIC" },
  { id: "user-noah", username: "noah", displayName: "Noah", avatarUrl: "https://i.pravatar.cc/160?u=noah", defaultPrivacy: "FRIENDS" },
  { id: "user-lena", username: "lena", displayName: "Lena", avatarUrl: "https://i.pravatar.cc/160?u=lena", defaultPrivacy: "PUBLIC" }
];

export const demoPosts: PostDto[] = [
  {
    id: "post-1",
    user: friends[0]!,
    mediaType: "IMAGE",
    mediaUrl: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80",
    caption: "Morning light caught the table before anyone else arrived.",
    locationName: "Hyderabad, India",
    privacy: "PUBLIC",
    frameStyle: "POLAROID",
    createdAt: "2026-08-17T08:12:00.000Z",
    expiresAt: "2026-08-18T08:12:00.000Z",
    reactionCount: 18,
    commentCount: 4
  },
  {
    id: "post-2",
    user: friends[1]!,
    mediaType: "IMAGE",
    mediaUrl: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=900&q=80",
    caption: "The song everyone knew by the second chorus.",
    locationName: "Bengaluru, India",
    privacy: "FRIENDS",
    frameStyle: "FILMSTRIP",
    createdAt: "2026-08-17T13:44:00.000Z",
    expiresAt: "2026-08-18T13:44:00.000Z",
    reactionCount: 31,
    commentCount: 9
  },
  {
    id: "post-3",
    user: friends[2]!,
    mediaType: "IMAGE",
    mediaUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80",
    caption: "A sky that looked edited, but wasn't.",
    locationName: "Goa, India",
    privacy: "PUBLIC",
    frameStyle: "TORN_PAPER",
    createdAt: "2026-08-17T17:30:00.000Z",
    expiresAt: "2026-08-18T17:30:00.000Z",
    reactionCount: 44,
    commentCount: 6
  }
];

export const demoDailyFrames: DailyFrameDto[] = Array.from({ length: 7 }).map((_, index) => {
  const day = String(16 - index).padStart(2, "0");
  return {
    id: `daily-${day}`,
    date: `2026-08-${day}`,
    title: `August ${16 - index}, 2026`,
    subtitle: index === 0 ? "A Sunday worth remembering." : "Small moments, neatly kept.",
    coverMediaUrl: demoPosts[index % demoPosts.length]!.mediaUrl,
    renderedImageUrl: null,
    metadata: { template: index % 2 === 0 ? "polaroid-chaos" : "quiet-journal" },
    posts: demoPosts
  };
});

export const demoMonthly: MonthlyCollageDto = {
  id: "monthly-august",
  year: 2026,
  month: 8,
  title: "August Memories",
  coverUrl: demoPosts[2]!.mediaUrl,
  renderedImageUrl: null,
  metadata: { frames: 31, places: 12, friends: 8, line: "1 unforgettable month" }
};

export const demoYearbook: YearbookDto = {
  id: "yearbook-2026",
  year: 2026,
  title: "Arjun's Frames",
  coverUrl: demoPosts[1]!.mediaUrl,
  pdfUrl: null,
  videoUrl: null,
  status: "READY",
  metadata: { pages: 18 }
};
