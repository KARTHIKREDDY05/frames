import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { DailyFrameDto, PostDto, Privacy, UserDto } from "@frames/types";
import { demoUser } from "../features/demo/demoData";

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

interface AppState {
  currentUser: UserDto | null;
  accounts: Account[];
  posts: PostDto[];
  dailyFrames: DailyFrameDto[];
  friends: UserDto[];
  likedPostIds: string[];
  comments: FrameComment[];
  shareLinks: ShareRecord[];
  pendingMediaUrl: string | null;
  signUp: (input: { displayName: string; username?: string; email: string; password?: string }) => UserDto;
  signIn: (email: string, password: string) => UserDto | null;
  updateProfile: (input: Partial<Pick<UserDto, "displayName" | "username" | "email" | "bio" | "avatarUrl" | "defaultPrivacy">>) => void;
  signInDemo: () => void;
  logout: () => void;
  createPost: (input: { caption: string; privacy: Privacy; frameStyle: PostDto["frameStyle"]; mediaUrl: string }) => void;
  reactToPost: (postId: string) => void;
  commentOnPost: (postId: string, text: string) => void;
  getPostComments: (postId: string) => FrameComment[];
  createShareLink: (input: { resourceType: ShareRecord["resourceType"]; resourceId: string; access: ShareRecord["access"] }) => ShareRecord;
  setPendingMediaUrl: (uri: string | null) => void;
  archiveExpiredNow: () => void;
}

const nowIso = () => new Date().toISOString();
const tomorrowIso = () => new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

function makeUsername(input: { displayName: string; username?: string; email: string }) {
  const fallback = input.email.split("@")[0] ?? `user_${Date.now()}`;
  const raw = input.username?.trim() || input.displayName.trim() || fallback;
  return raw.toLowerCase().replace(/[^a-z0-9_]/g, "_").replace(/^_+|_+$/g, "") || fallback.toLowerCase();
}

function makeUser(input: { displayName: string; username?: string; email: string }): UserDto {
  return {
    id: `user-${Date.now()}`,
    displayName: input.displayName.trim(),
    username: makeUsername(input),
    email: input.email.toLowerCase(),
    avatarUrl: `https://i.pravatar.cc/160?u=${encodeURIComponent(input.email)}`,
    bio: null,
    defaultPrivacy: "FRIENDS"
  };
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      accounts: [{ ...demoUser, password: "password123" }],
      posts: [],
      dailyFrames: [],
      friends: [],
      likedPostIds: [],
      comments: [],
      shareLinks: [],
      pendingMediaUrl: null,
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
      updateProfile: (input) => {
        const currentUser = get().currentUser;
        if (!currentUser) return;
        const updated: UserDto = {
          ...currentUser,
          ...input,
          displayName: input.displayName?.trim() || currentUser.displayName,
          username: input.username ? makeUsername({ displayName: input.displayName ?? currentUser.displayName, username: input.username, email: input.email ?? currentUser.email ?? "" }) : currentUser.username,
          email: input.email?.toLowerCase() ?? currentUser.email
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
      },
      signInDemo: () => set({ currentUser: demoUser }),
      logout: () => set({ currentUser: null }),
      createPost: (input) => {
        const user = get().currentUser ?? demoUser;
        const post: PostDto = {
          id: `post-${Date.now()}`,
          user,
          mediaType: "IMAGE",
          mediaUrl: input.mediaUrl,
          caption: input.caption || "A fresh Frame from today.",
          locationName: "Hyderabad, India",
          privacy: input.privacy,
          frameStyle: input.frameStyle,
          createdAt: nowIso(),
          expiresAt: tomorrowIso(),
          reactionCount: 0,
          commentCount: 0
        };
        set((state) => ({ posts: [post, ...state.posts] }));
      },
      reactToPost: (postId) => {
        if (get().likedPostIds.includes(postId)) return;
        set((state) => ({
          likedPostIds: [...state.likedPostIds, postId],
          posts: state.posts.map((post) => (post.id === postId ? { ...post, reactionCount: post.reactionCount + 1 } : post))
        }));
      },
      commentOnPost: (postId, text) => {
        const clean = text.trim();
        if (!clean) return;
        const user = get().currentUser ?? demoUser;
        const comment: FrameComment = { id: `comment-${Date.now()}`, postId, user, text: clean, createdAt: nowIso() };
        set((state) => ({
          comments: [...state.comments, comment],
          posts: state.posts.map((post) => (post.id === postId ? { ...post, commentCount: post.commentCount + 1 } : post))
        }));
      },
      getPostComments: (postId) => get().comments.filter((comment) => comment.postId === postId),
      createShareLink: (input) => {
        const user = get().currentUser ?? demoUser;
        const link: ShareRecord = {
          id: `share-${Date.now()}`,
          resourceType: input.resourceType,
          resourceId: input.resourceId,
          access: input.access,
          url: `https://frames.app/${user.username}/${input.resourceType}/${input.resourceId}`,
          createdAt: nowIso()
        };
        set((state) => ({ shareLinks: [link, ...state.shareLinks] }));
        return link;
      },
      setPendingMediaUrl: (uri) => set({ pendingMediaUrl: uri }),
      archiveExpiredNow: () => {
        const user = get().currentUser ?? demoUser;
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
      name: "frames-local-test",
      version: 3,
      storage: createJSONStorage(() => localStorage)
    }
  )
);
