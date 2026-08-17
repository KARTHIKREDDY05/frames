export type Privacy = "PUBLIC" | "FRIENDS";
export type MediaType = "IMAGE" | "VIDEO";
export type FrameStyle = "POLAROID" | "FILMSTRIP" | "TORN_PAPER" | "STICKER" | "MINIMAL" | "VINTAGE";
export type FriendshipStatus = "PENDING" | "ACCEPTED" | "BLOCKED";
export type YearbookStatus = "GENERATING" | "READY" | "FAILED";
export type UserRole = "USER" | "ADMIN";

export interface UserDto {
  id: string;
  username: string;
  displayName: string;
  email?: string;
  avatarUrl?: string | null;
  bio?: string | null;
  defaultPrivacy: Privacy;
  role?: UserRole;
}

export interface PostDto {
  id: string;
  user: UserDto;
  mediaType: MediaType;
  mediaUrl: string;
  thumbnailUrl?: string | null;
  caption?: string | null;
  locationName?: string | null;
  privacy: Privacy;
  frameStyle: FrameStyle;
  createdAt: string;
  expiresAt: string;
  reactionCount: number;
  commentCount: number;
}

export interface DailyFrameDto {
  id: string;
  date: string;
  title: string;
  subtitle: string;
  coverMediaUrl?: string | null;
  renderedImageUrl?: string | null;
  metadata: Record<string, unknown>;
  posts: PostDto[];
}

export interface MonthlyCollageDto {
  id: string;
  year: number;
  month: number;
  title: string;
  coverUrl?: string | null;
  renderedImageUrl?: string | null;
  metadata: Record<string, unknown>;
}

export interface YearbookDto {
  id: string;
  year: number;
  title: string;
  coverUrl?: string | null;
  pdfUrl?: string | null;
  videoUrl?: string | null;
  status: YearbookStatus;
  metadata: Record<string, unknown>;
}

export interface Page<T> {
  items: T[];
  nextCursor: string | null;
}
