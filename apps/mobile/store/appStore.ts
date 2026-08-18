import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { DailyFrameDto, PhotoFilter, PostDto, Privacy, UserDto } from "@frames/types";

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
  mediaType?: "IMAGE" | "VIDEO";
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
  setCurrentUser: (user: UserDto | null) => void;
  setAuthChecked: (checked: boolean) => void;
  setPosts: (posts: PostDto[]) => void;
  mergePosts: (posts: PostDto[]) => void;
  mergeChatMessages: (messages: ChatMessage[]) => void;
  mergeNotifications: (notifications: UserNotification[]) => void;
  mergeComments: (comments: FrameComment[]) => void;
  signUp: (input: { displayName: string; username: string; email: string; password?: string }) => UserDto;
  signIn: (email: string, password: string) => UserDto | null;
  updateProfile: (input: Partial<Pick<UserDto, "displayName" | "username" | "email" | "bio" | "avatarUrl" | "defaultPrivacy" | "profileVisibility">>) => { ok: boolean; message?: string };
  completeIntro: () => void;
  logout: () => void;
  createPost: (input: { caption: string; privacy: Privacy; frameStyle: PostDto["frameStyle"]; mediaUrl: string; filterPreset?: PhotoFilter }) => void;
  deletePost: (postId: string) => void;
  reactToPost: (postId: string) => void;
  commentOnPost: (postId: string, text: string) => void;
  sendChatMessage: (threadUserId: string, text: string) => void;
  sendFollowRequest: (targetUserId: string) => void;
  acceptFollowRequest: (requestId: string) => void;
  declineFollowRequest: (requestId: string) => void;
  markNotificationsRead: () => void;
  getPostComments: (postId: string) => FrameComment[];
  createShareLink: (input: { resourceType: ShareRecord["resourceType"]; resourceId: string; access: ShareRecord["access"] }) => ShareRecord;
  setPendingMediaUrl: (uri: string | null) => void;
  setPendingCaptureMeta: (meta: CaptureMeta | null) => void;
  archiveExpiredNow: () => void;
}

const nowIso = () => new Date().toISOString();
const tomorrowIso = () => new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
const USERNAME_COOLDOWN_MS = 90 * 24 * 60 * 60 * 1000;
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
      pendingMediaUrl: null,
      pendingCaptureMeta: null,
      setCurrentUser: (user) => set({ currentUser: user }),
      setAuthChecked: (checked) => set({ authChecked: checked }),
      setPosts: (posts) => set({ posts }),
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
          return { ok: false, message: "Username can only be changed once every 90 days." };
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
      sendChatMessage: (threadUserId, text) => {
        const clean = text.trim();
        const user = get().currentUser;
        if (!user || !clean) return;
        const message: ChatMessage = {
          id: `chat-${Date.now()}`,
          threadUserId,
          fromUserId: user.id,
          text: clean,
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
      }
    }),
    {
      name: "frames-app-v2",
      version: 10,
      storage: createJSONStorage(() => localStorage)
    }
  )
);
