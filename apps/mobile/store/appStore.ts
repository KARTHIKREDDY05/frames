import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { DailyFrameDto, PhotoFilter, PostDto, PrintOrderDto, Privacy, UserDto } from "@frames/types";
import { zustandUniversalStorage } from "../services/universalStorage";

export interface TimeCapsule {
  id: string;
  title: string;
  unlockDate: string; // ISO date string
  mediaUrl: string;
  note: string;
  sealColor: "crimson" | "gold" | "sapphire" | "emerald";
  isUnlocked: boolean;
  createdAt: string;
}

export interface FridgeMagnetItem {
  id: string;
  postId: string;
  mediaUrl: string;
  caption?: string;
  magnetType: "cherry" | "lemon" | "star" | "flower" | "heart" | "clover" | "polaroid_clip";
  rotation: number; // degrees
  createdAt: string;
}

export interface VoiceMemory {
  id: string;
  postId?: string;
  audioUrl: string;
  durationSec: number;
  speakerName: string;
  caption: string;
  createdAt: string;
}

interface Account extends UserDto {
  password?: string;
}

export interface FrameComment {
  id: string;
  postId: string;
  user: UserDto;
  text: string;
  createdAt: string;
}

export interface ShareRecord {
  id: string;
  resourceType: "profile" | "post" | "daily_frame";
  resourceId: string;
  access: "PUBLIC" | "FRIENDS" | "PASSWORD" | "EXPIRING";
  url: string;
  createdAt: string;
}

export interface FriendRequest {
  id: string;
  fromUser: UserDto;
  toUser: UserDto;
  status: "PENDING" | "ACCEPTED" | "DECLINED";
  createdAt: string;
}

export interface UserNotification {
  id: string;
  type: "FOLLOW_REQUEST" | "FOLLOW_ACCEPTED" | "REACTION" | "COMMENT" | "SHARE" | "ARCHIVE_READY";
  title: string;
  body: string;
  actor?: UserDto;
  requestId?: string;
  postId?: string;
  recipientId?: string;
  read: boolean;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  threadUserId: string;
  fromUserId: string;
  text: string;
  mediaUrl?: string;
  mediaType?: "IMAGE" | "VIDEO" | "VOICE";
  audioDurationSec?: number;
  status: "SENT" | "DELIVERED" | "SEEN";
  deliveredAt?: string;
  seenAt?: string;
  createdAt: string;
}

export interface CaptureMeta {
  filterPreset?: PhotoFilter;
  locationName?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

interface AppState {
  currentUser: UserDto | null;
  authChecked: boolean;
  hasSeenIntro: boolean;
  hasSeenNavigationGuide: boolean;
  accounts: Account[];
  posts: PostDto[];
  dailyFrames: DailyFrameDto[];
  friends: UserDto[];
  discoverableUsers: UserDto[];
  friendRequests: FriendRequest[];
  notifications: UserNotification[];
  chatMessages: ChatMessage[];
  likedPostIds: string[];
  comments: FrameComment[];
  shareLinks: ShareRecord[];
  pendingMediaUrl: string | null;
  pendingCaptureMeta: CaptureMeta | null;
  timeCapsules: TimeCapsule[];
  fridgeItems: FridgeMagnetItem[];
  voiceMemories: VoiceMemory[];
  printOrders: PrintOrderDto[];
  setCurrentUser: (user: UserDto | null) => void;
  setAuthChecked: (checked: boolean) => void;
  setPosts: (posts: PostDto[]) => void;
  setFriends: (friends: UserDto[]) => void;
  mergePosts: (posts: PostDto[]) => void;
  mergeChatMessages: (messages: ChatMessage[]) => void;
  mergeNotifications: (notifications: UserNotification[]) => void;
  mergeComments: (comments: FrameComment[]) => void;
  addPrintOrder: (order: PrintOrderDto) => void;
  setPrintOrders: (orders: PrintOrderDto[]) => void;
  updatePrintOrderStatus: (orderId: string, status: string, trackingNumber?: string) => void;
  signUp: (input: { displayName: string; username: string; email: string; password?: string }) => UserDto;
  signIn: (email: string, password: string) => UserDto | null;
  updateProfile: (input: Partial<Pick<UserDto, "displayName" | "username" | "email" | "bio" | "avatarUrl" | "defaultPrivacy" | "profileVisibility">>) => { ok: boolean; message?: string };
  completeIntro: () => void;
  completeNavigationGuide: () => void;
  logout: () => void;
  createPost: (input: { caption: string; privacy: Privacy; frameStyle: PostDto["frameStyle"]; mediaUrl: string; filterPreset?: PhotoFilter }) => void;
  deletePost: (postId: string) => void;
  reactToPost: (postId: string) => void;
  commentOnPost: (postId: string, text: string) => void;
  sendChatMessage: (threadUserId: string, text: string, options?: { mediaUrl?: string; mediaType?: "IMAGE" | "VIDEO" | "VOICE"; audioDurationSec?: number }) => void;
  sendFollowRequest: (targetUserId: string) => void;
  acceptFollowRequest: (requestId: string) => void;
  declineFollowRequest: (requestId: string) => void;
  markNotificationsRead: () => void;
  getPostComments: (postId: string) => FrameComment[];
  createShareLink: (input: { resourceType: ShareRecord["resourceType"]; resourceId: string; access: ShareRecord["access"] }) => ShareRecord;
  setPendingMediaUrl: (uri: string | null) => void;
  setPendingCaptureMeta: (meta: CaptureMeta | null) => void;
  archiveExpiredNow: () => void;
  createTimeCapsule: (input: Omit<TimeCapsule, "id" | "isUnlocked" | "createdAt">) => TimeCapsule;
  unlockTimeCapsule: (id: string) => void;
  pinToFridge: (input: Omit<FridgeMagnetItem, "id" | "createdAt">) => void;
  unpinFromFridge: (id: string) => void;
  saveVoiceMemory: (input: Omit<VoiceMemory, "id" | "createdAt">) => VoiceMemory;
}

const nowIso = () => new Date().toISOString();
const tomorrowIso = () => new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
const USERNAME_COOLDOWN_MS = 30 * 24 * 60 * 60 * 1000; // 30 days cooldown (once per month)
function makeUsername(input: { displayName: string; username?: string; email: string }) {
  const fallback = input.email.split("@")[0] ?? `user_${Date.now()}`;
  const raw = input.username?.trim() || input.displayName.trim() || fallback;
  return raw.toLowerCase().replace(/[^a-z0-9_]/g, "_").replace(/^_+|_+$/g, "") || fallback.toLowerCase();
}

function makeUser(input: { displayName: string; username: string; email: string }): UserDto {
  return {
    id: `user-${Date.now()}`,
    displayName: input.displayName.trim(),
    username: makeUsername(input),
    email: input.email.toLowerCase(),
    avatarUrl: `https://i.pravatar.cc/160?u=${encodeURIComponent(input.email)}`,
    bio: null,
    defaultPrivacy: "FRIENDS",
    profileVisibility: "PUBLIC",
    usernameUpdatedAt: nowIso(),
    lastSeenAt: nowIso()
  };
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      authChecked: false,
      hasSeenIntro: false,
      hasSeenNavigationGuide: false,
      completeNavigationGuide: () => set({ hasSeenNavigationGuide: true }),
      accounts: [],
      posts: [],
      dailyFrames: [],
      friends: [],
      discoverableUsers: [],
      friendRequests: [],
      notifications: [],
      chatMessages: [],
      likedPostIds: [],
      comments: [],
      shareLinks: [],
      printOrders: [],
      pendingMediaUrl: null,
      pendingCaptureMeta: null,
      setCurrentUser: (user) => set({ currentUser: user }),
      setAuthChecked: (checked) => set({ authChecked: checked }),
      setPosts: (posts) => set({ posts }),
      setFriends: (friends) => set({ friends }),
      mergePosts: (posts) => set((state) => {
        const byId = new Map<string, PostDto>();
        [...posts, ...state.posts].forEach((post) => byId.set(post.id, post));
        return { posts: Array.from(byId.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) };
      }),
      mergeChatMessages: (messages) => set((state) => {
        const byId = new Map<string, ChatMessage>();
        [...state.chatMessages, ...messages].forEach((message) => byId.set(message.id, message));
        return { chatMessages: Array.from(byId.values()).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) };
      }),
      mergeNotifications: (notifications) => set((state) => {
        const byId = new Map<string, UserNotification>();
        [...notifications, ...state.notifications].forEach((notification) => byId.set(notification.id, notification));
        return { notifications: Array.from(byId.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) };
      }),
      mergeComments: (comments) => set((state) => {
        const byId = new Map<string, FrameComment>();
        [...state.comments, ...comments].forEach((comment) => byId.set(comment.id, comment));
        return { comments: Array.from(byId.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) };
      }),
      addPrintOrder: (order) => set((state) => ({
        printOrders: [order, ...state.printOrders.filter((o) => o.id !== order.id && o.orderId !== order.orderId)]
      })),
      setPrintOrders: (orders) => set({ printOrders: orders }),
      updatePrintOrderStatus: (orderId, status, trackingNumber) => set((state) => ({
        printOrders: state.printOrders.map((o) =>
          o.id === orderId || o.orderId === orderId
            ? { ...o, status: status as any, trackingNumber: trackingNumber || o.trackingNumber, updatedAt: nowIso() }
            : o
        )
      })),
      signUp: (input) => {
        const user = makeUser(input);
        set((state) => ({
          currentUser: user,
          accounts: [...state.accounts, { ...user, password: input.password }]
        }));
        return user;
      },
      signIn: (email, password) => {
        const account = get().accounts.find((item) => item.email?.toLowerCase() === email.toLowerCase() && (!item.password || item.password === password));
        if (!account) return null;
        const { password: _password, ...user } = account;
        set({ currentUser: user });
        return user;
      },
      completeIntro: () => set({ hasSeenIntro: true }),
      updateProfile: (input) => {
        const currentUser = get().currentUser;
        if (!currentUser) return { ok: false, message: "Sign in to update your profile." };
        const nextUsername = input.username ? makeUsername({ displayName: input.displayName ?? currentUser.displayName, username: input.username, email: input.email ?? currentUser.email ?? "" }) : currentUser.username;
        const usernameChanged = nextUsername !== currentUser.username;
        if (usernameChanged && currentUser.usernameUpdatedAt && Date.now() - new Date(currentUser.usernameUpdatedAt).getTime() < USERNAME_COOLDOWN_MS) {
          const daysLeft = Math.ceil((USERNAME_COOLDOWN_MS - (Date.now() - new Date(currentUser.usernameUpdatedAt).getTime())) / (24 * 60 * 60 * 1000));
          return { ok: false, message: `Username can only be changed once per month (30 days). You can change it again in ${daysLeft} day${daysLeft === 1 ? "" : "s"}.` };
        }
        const updated: UserDto = {
          ...currentUser,
          ...input,
          displayName: input.displayName?.trim() || currentUser.displayName,
          username: nextUsername,
          email: input.email?.toLowerCase() ?? currentUser.email,
          profileVisibility: input.profileVisibility ?? currentUser.profileVisibility ?? "PUBLIC",
          usernameUpdatedAt: usernameChanged ? nowIso() : currentUser.usernameUpdatedAt
        };
        set((state) => ({
          currentUser: updated,
          accounts: state.accounts.map((account) => (account.id === updated.id ? { ...account, ...updated } : account)),
          posts: state.posts.map((post) => (post.user.id === updated.id ? { ...post, user: updated } : post)),
          dailyFrames: state.dailyFrames.map((frame) => ({
            ...frame,
            posts: frame.posts.map((post) => (post.user.id === updated.id ? { ...post, user: updated } : post))
          }))
        }));
        return { ok: true };
      },
      logout: () => set({ currentUser: null }),
      createPost: (input) => {
        const user = get().currentUser;
        if (!user) return;
        const post: PostDto = {
          id: `post-${Date.now()}`,
          user,
          mediaType: "IMAGE",
          mediaUrl: input.mediaUrl,
          caption: input.caption || "A fresh Frame from today.",
          locationName: get().pendingCaptureMeta?.locationName ?? null,
          latitude: get().pendingCaptureMeta?.latitude ?? null,
          longitude: get().pendingCaptureMeta?.longitude ?? null,
          privacy: input.privacy,
          frameStyle: input.frameStyle,
          filterPreset: input.filterPreset ?? get().pendingCaptureMeta?.filterPreset ?? "ORIGINAL",
          profileFeatured: false,
          createdAt: nowIso(),
          expiresAt: tomorrowIso(),
          reactionCount: 0,
          commentCount: 0
        };
        set((state) => ({ posts: [post, ...state.posts] }));
      },
      deletePost: (postId) => {
        const user = get().currentUser;
        if (!user) return;
        set((state) => ({
          posts: state.posts.filter((post) => post.id !== postId || post.user.id !== user.id),
          comments: state.comments.filter((comment) => comment.postId !== postId),
          likedPostIds: state.likedPostIds.filter((id) => id !== postId),
          shareLinks: state.shareLinks.filter((link) => link.resourceId !== postId)
        }));
      },
      reactToPost: (postId) => {
        const user = get().currentUser;
        if (!user) return;
        const post = get().posts.find((item) => item.id === postId);
        const alreadyLiked = get().likedPostIds.includes(postId);
        set((state) => ({
          likedPostIds: alreadyLiked ? state.likedPostIds.filter((id) => id !== postId) : [...state.likedPostIds, postId],
          posts: state.posts.map((item) => (item.id === postId ? { ...item, reactionCount: Math.max(0, item.reactionCount + (alreadyLiked ? -1 : 1)) } : item)),
          notifications: !alreadyLiked && post && post.user.id !== user.id ? [
            {
              id: `notification-${Date.now()}`,
              type: "REACTION",
              title: "New like",
              body: `${user.displayName} liked your Frame.`,
              actor: user,
              postId,
              recipientId: post.user.id,
              read: false,
              createdAt: nowIso()
            },
            ...state.notifications
          ] : state.notifications
        }));
      },
      commentOnPost: (postId, text) => {
        const clean = text.trim();
        if (!clean) return;
        const user = get().currentUser;
        if (!user) return;
        const post = get().posts.find((item) => item.id === postId);
        const comment: FrameComment = { id: `comment-${Date.now()}`, postId, user, text: clean, createdAt: nowIso() };
        set((state) => ({
          comments: [...state.comments, comment],
          posts: state.posts.map((item) => (item.id === postId ? { ...item, commentCount: item.commentCount + 1 } : item)),
          notifications: post && post.user.id !== user.id ? [
            {
              id: `notification-${Date.now()}`,
              type: "COMMENT",
              title: "New comment",
              body: `${user.displayName} commented: ${clean.slice(0, 80)}`,
              actor: user,
              postId,
              recipientId: post.user.id,
              read: false,
              createdAt: nowIso()
            },
            ...state.notifications
          ] : state.notifications
        }));
      },
      timeCapsules: [
        {
          id: "capsule-1",
          title: "Message for Baby's 18th Birthday 🎂",
          unlockDate: "2030-05-14T00:00:00.000Z",
          mediaUrl: "https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=600",
          note: "Never forget how tiny your little hand was when you held my finger for the first time.",
          sealColor: "crimson",
          isUnlocked: false,
          createdAt: new Date(Date.now() - 15 * 86400000).toISOString()
        },
        {
          id: "capsule-2",
          title: "Next Mother's Day Time Vault 🌸",
          unlockDate: new Date(Date.now() + 60 * 86400000).toISOString(),
          mediaUrl: "https://images.unsplash.com/photo-1492725764893-90b379c2b6e7?w=600",
          note: "A secret love letter and thank you note for everything you do silently every day.",
          sealColor: "gold",
          isUnlocked: false,
          createdAt: new Date(Date.now() - 5 * 86400000).toISOString()
        }
      ],
      fridgeItems: [
        {
          id: "fridge-1",
          postId: "sample-1",
          mediaUrl: "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=500",
          caption: "Sunday pancake morning with mom 🥞",
          magnetType: "cherry",
          rotation: -4,
          createdAt: new Date().toISOString()
        },
        {
          id: "fridge-2",
          postId: "sample-2",
          mediaUrl: "https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=500",
          caption: "First day riding bicycle without training wheels! 🚲",
          magnetType: "star",
          rotation: 3,
          createdAt: new Date().toISOString()
        },
        {
          id: "fridge-3",
          postId: "sample-3",
          mediaUrl: "https://images.unsplash.com/photo-1511895426328-dc8714191300?w=500",
          caption: "Family sunset by the lake 🌅",
          magnetType: "lemon",
          rotation: -2,
          createdAt: new Date().toISOString()
        }
      ],
      voiceMemories: [
        {
          id: "voice-1",
          postId: "sample-1",
          audioUrl: "https://sample-audio.org/sample-audio-1.mp3",
          durationSec: 14,
          speakerName: "Mom",
          caption: "Lullaby & laugh after pancake disaster ❤️",
          createdAt: new Date().toISOString()
        }
      ],
      sendChatMessage: (threadUserId, text, options) => {
        const clean = text.trim();
        const user = get().currentUser;
        if (!user || (!clean && !options?.mediaUrl)) return;
        const message: ChatMessage = {
          id: `chat-${Date.now()}`,
          threadUserId,
          fromUserId: user.id,
          text: clean,
          mediaUrl: options?.mediaUrl,
          mediaType: options?.mediaType ?? "IMAGE",
          audioDurationSec: options?.audioDurationSec,
          status: "DELIVERED",
          deliveredAt: nowIso(),
          createdAt: nowIso()
        };
        set((state) => ({ chatMessages: [...state.chatMessages, message] }));
      },
      sendFollowRequest: (targetUserId) => {
        const currentUser = get().currentUser;
        if (!currentUser) return;
        const target = get().discoverableUsers.find((user) => user.id === targetUserId);
        if (!target || target.id === currentUser.id) return;
        const alreadyFriends = get().friends.some((friend) => friend.id === target.id);
        const existing = get().friendRequests.some((request) => request.fromUser.id === currentUser.id && request.toUser.id === target.id && request.status === "PENDING");
        if (alreadyFriends || existing) return;
        const request: FriendRequest = {
          id: `follow-${Date.now()}`,
          fromUser: currentUser,
          toUser: target,
          status: "PENDING",
          createdAt: nowIso()
        };
        set((state) => ({
          friendRequests: [request, ...state.friendRequests],
          notifications: [
            {
              id: `notification-${Date.now()}`,
              type: "FOLLOW_REQUEST",
              title: "Follow request sent",
              body: `${target.displayName} has a pending request from you.`,
              actor: target,
              requestId: request.id,
              read: false,
              createdAt: nowIso()
            },
            ...state.notifications
          ]
        }));
      },
      acceptFollowRequest: (requestId) => {
        const request = get().friendRequests.find((item) => item.id === requestId);
        if (!request) return;
        set((state) => ({
          friendRequests: state.friendRequests.map((item) => (item.id === requestId ? { ...item, status: "ACCEPTED" } : item)),
          friends: state.friends.some((friend) => friend.id === request.toUser.id) ? state.friends : [request.toUser, ...state.friends],
          notifications: [
            {
              id: `notification-${Date.now()}`,
              type: "FOLLOW_ACCEPTED",
              title: "Follow request accepted",
              body: `You and ${request.toUser.displayName} are now friends.`,
              actor: request.toUser,
              requestId,
              read: false,
              createdAt: nowIso()
            },
            ...state.notifications
          ]
        }));
      },
      declineFollowRequest: (requestId) => {
        set((state) => ({
          friendRequests: state.friendRequests.map((item) => (item.id === requestId ? { ...item, status: "DECLINED" } : item))
        }));
      },
      markNotificationsRead: () => {
        const user = get().currentUser;
        set((state) => ({
          notifications: state.notifications.map((notification) => (
            !notification.recipientId || notification.recipientId === user?.id ? { ...notification, read: true } : notification
          ))
        }));
      },
      getPostComments: (postId) => get().comments.filter((comment) => comment.postId === postId),
      createShareLink: (input) => {
        const user = get().currentUser;
        if (!user) {
          return {
            id: `share-denied-${Date.now()}`,
            resourceType: input.resourceType,
            resourceId: input.resourceId,
            access: input.access,
            url: "",
            createdAt: nowIso()
          };
        }
        const link: ShareRecord = {
          id: `share-${Date.now()}`,
          resourceType: input.resourceType,
          resourceId: input.resourceId,
          access: input.access,
          url: `https://frames.app/${user.username}/${input.resourceType}/${input.resourceId}`,
          createdAt: nowIso()
        };
        const post = input.resourceType === "post" ? get().posts.find((item) => item.id === input.resourceId) : null;
        set((state) => ({
          shareLinks: [link, ...state.shareLinks],
          notifications: post && post.user.id !== user.id ? [
            {
              id: `notification-${Date.now()}`,
              type: "SHARE",
              title: "Frame shared",
              body: `${user.displayName} shared your Frame.`,
              actor: user,
              postId: post.id,
              recipientId: post.user.id,
              read: false,
              createdAt: nowIso()
            },
            ...state.notifications
          ] : state.notifications
        }));
        return link;
      },
      setPendingMediaUrl: (uri) => set({ pendingMediaUrl: uri }),
      setPendingCaptureMeta: (meta) => set({ pendingCaptureMeta: meta }),
      archiveExpiredNow: () => {
        const user = get().currentUser;
        if (!user) return;
        const ownPosts = get().posts.filter((post) => post.user.id === user.id);
        if (ownPosts.length === 0) return;

        const today = new Date().toISOString().slice(0, 10);
        const frame: DailyFrameDto = {
          id: `daily-${Date.now()}`,
          date: today,
          title: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
          subtitle: "A day worth remembering.",
          coverMediaUrl: ownPosts[0]?.mediaUrl,
          renderedImageUrl: null,
          metadata: { template: "polaroid-chaos", simulated: true },
          posts: ownPosts
        };

        set((state) => ({
          posts: state.posts.filter((post) => post.user.id !== user.id),
          dailyFrames: [frame, ...state.dailyFrames.filter((item) => item.date !== today)]
        }));
      },
      createTimeCapsule: (input) => {
        const capsule: TimeCapsule = {
          ...input,
          id: `capsule-${Date.now()}`,
          isUnlocked: new Date(input.unlockDate).getTime() <= Date.now(),
          createdAt: nowIso()
        };
        set((state) => ({ timeCapsules: [capsule, ...state.timeCapsules] }));
        return capsule;
      },
      unlockTimeCapsule: (id) => {
        set((state) => ({
          timeCapsules: state.timeCapsules.map((c) => (c.id === id ? { ...c, isUnlocked: true } : c))
        }));
      },
      pinToFridge: (input) => {
        const item: FridgeMagnetItem = {
          ...input,
          id: `fridge-${Date.now()}`,
          createdAt: nowIso()
        };
        set((state) => ({
          fridgeItems: [item, ...state.fridgeItems.filter((f) => f.postId !== input.postId)]
        }));
      },
      unpinFromFridge: (id) => {
        set((state) => ({
          fridgeItems: state.fridgeItems.filter((item) => item.id !== id)
        }));
      },
      saveVoiceMemory: (input) => {
        const memory: VoiceMemory = {
          ...input,
          id: `voice-${Date.now()}`,
          createdAt: nowIso()
        };
        set((state) => ({
          voiceMemories: [memory, ...state.voiceMemories]
        }));
        return memory;
      }
    }),
    {
      name: "frames-app-v2",
      version: 11,
      storage: createJSONStorage(() => zustandUniversalStorage)
    }
  )
);
