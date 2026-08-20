import { createClient, type Provider, type User } from "@supabase/supabase-js";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import type { ChatMessageDto, DailyFrameDto, PostDto, UserDto, UserNotificationDto } from "@frames/types";
import { triggerLocalPushNotification } from "./pushNotificationService";

WebBrowser.maybeCompleteAuthSession();

export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "https://fjhfmxpuyijwinvmqsch.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "sb_publishable_hKlYOlHiS9ApC6y55NTPVg_oD9ZQWSs";
const enabledOAuthProviders = (process.env.EXPO_PUBLIC_ENABLED_OAUTH_PROVIDERS ?? "google")
  .split(",")
  .map((provider: string) => provider.trim().toLowerCase())
  .filter(Boolean);

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    autoRefreshToken: true,
    detectSessionInUrl: true,
    persistSession: true
  }
});

interface DbUser {
  id: string;
  username: string;
  displayName: string;
  email?: string;
  avatarUrl?: string | null;
  bio?: string | null;
  defaultPrivacy: "PUBLIC" | "FRIENDS";
  profileVisibility?: "PUBLIC" | "PRIVATE";
  usernameUpdatedAt?: string | null;
  lastSeenAt?: string | null;
}

interface DbFriendship {
  id: string;
  requesterId: string;
  receiverId: string;
  status: "PENDING" | "ACCEPTED" | "BLOCKED";
  createdAt: string;
  updatedAt: string;
}

interface DbPost {
  id: string;
  userId: string;
  mediaType: "IMAGE" | "VIDEO";
  mediaUrl: string;
  thumbnailUrl?: string | null;
  caption?: string | null;
  locationName?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  privacy: Privacy;
  frameStyle: FrameStyle;
  filterPreset?: PhotoFilter | null;
  profileFeatured?: boolean | null;
  createdAt: string;
  expiresAt: string;
}

interface DbChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  mediaUrl?: string | null;
  mediaType?: "IMAGE" | "VIDEO" | null;
  status: "SENT" | "DELIVERED" | "SEEN";
  deliveredAt?: string | null;
  seenAt?: string | null;
  createdAt: string;
}

interface DbNotification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

export function getAuthRedirectUrl(path = "auth/callback") {
  if (typeof window !== "undefined" && window.location?.origin) {
    return `${window.location.origin}/${path.replace(/^\//, "")}`;
  }
  return `frames://${path.replace(/^\//, "")}`;
}

export function isOAuthProviderEnabled(provider: Provider) {
  return enabledOAuthProviders.includes(provider);
}

export function shouldShowOAuthProvider(provider: Provider) {
  return provider === "google" || isOAuthProviderEnabled(provider);
}

export async function createVerifiedEmailAccount(input: { displayName: string; email: string; password: string; username: string }) {
  const metadata = {
    display_name: input.displayName,
    username: input.username
  };

  return supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: metadata,
      emailRedirectTo: getAuthRedirectUrl()
    }
  });
}

export async function signInWithVerifiedEmail(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signInWithOAuthProvider(provider: Provider) {
  if (!isOAuthProviderEnabled(provider)) {
    return { data: null, error: new Error(`${provider} provider is not enabled.`) };
  }

  const redirectUrl = getAuthRedirectUrl();
  const isWeb = typeof window !== "undefined" && Boolean(window.location?.origin);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: redirectUrl,
      skipBrowserRedirect: !isWeb
    }
  });

  if (error || !data?.url) {
    return { data, error };
  }

  if (!isWeb) {
    try {
      const authRes = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
      if (authRes.type === "success" && authRes.url) {
        const urlToParse = authRes.url.replace("#", "?");
        const parsed = new URL(urlToParse);
        const code = parsed.searchParams.get("code");
        const accessToken = parsed.searchParams.get("access_token");
        const refreshToken = parsed.searchParams.get("refresh_token");

        if (code) {
          const { data: sessionData, error: sessionError } = await supabase.auth.exchangeCodeForSession(code);
          return { data: sessionData, error: sessionError };
        } else if (accessToken && refreshToken) {
          const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });
          return { data: sessionData, error: sessionError };
        }
      }
    } catch (browserError) {
      return { data: null, error: browserError instanceof Error ? browserError : new Error("OAuth window error") };
    }
  }

  return { data, error: null };
}

export function mapDbUser(row: DbUser): UserDto {
  return {
    id: row.id,
    username: row.username,
    displayName: row.displayName,
    email: row.email,
    avatarUrl: row.avatarUrl,
    bio: row.bio,
    defaultPrivacy: row.defaultPrivacy,
    profileVisibility: row.profileVisibility ?? "PUBLIC",
    usernameUpdatedAt: normalizeDbTimestamp(row.usernameUpdatedAt),
    lastSeenAt: normalizeDbTimestamp(row.lastSeenAt)
  };
}

function normalizeDbTimestamp(value?: string | null) {
  if (!value) return value;
  if (/[zZ]|[+-]\d{2}:?\d{2}$/.test(value)) return value;
  return `${value.replace(" ", "T")}Z`;
}

function cleanUsername(input: string) {
  return input.toLowerCase().replace(/[^a-z0-9_]/g, "_").replace(/^_+|_+$/g, "") || `user_${Date.now()}`;
}

export async function ensureUserProfile(authUser: User) {
  const email = authUser.email ?? "";
  const metadata = authUser.user_metadata ?? {};
  const displayName = String(metadata.display_name ?? metadata.full_name ?? email.split("@")[0] ?? "Frames User");
  const username = cleanUsername(String(metadata.username ?? email.split("@")[0] ?? displayName));
  const avatarUrl = typeof metadata.avatar_url === "string" ? metadata.avatar_url : null;

  const { data, error } = await supabase
    .from("User")
    .upsert({
      id: authUser.id,
      username,
      displayName,
      email,
      passwordHash: "supabase-auth",
      avatarUrl,
      defaultPrivacy: "FRIENDS",
      profileVisibility: "PUBLIC",
      updatedAt: new Date().toISOString(),
      usernameUpdatedAt: new Date().toISOString(),
      lastSeenAt: new Date().toISOString()
    }, { onConflict: "id" })
    .select("id, username, displayName, email, avatarUrl, bio, defaultPrivacy, profileVisibility, usernameUpdatedAt, lastSeenAt")
    .single();

  return { profile: data ? mapDbUser(data as DbUser) : null, error };
}

export async function fetchCurrentUserProfile() {
  const { data: authData, error: userError } = await supabase.auth.getUser();
  if (userError || !authData.user) return { profile: null, error: userError };

  const { data, error } = await supabase
    .from("User")
    .select("id, username, displayName, email, avatarUrl, bio, defaultPrivacy, profileVisibility, usernameUpdatedAt, lastSeenAt")
    .eq("id", authData.user.id)
    .single();

  if (data) return { profile: mapDbUser(data as DbUser), error: null };
  return ensureUserProfile(authData.user);
}

export async function searchProfiles(query: string) {
  const { data: authData } = await supabase.auth.getUser();
  const ownId = authData.user?.id;
  const clean = query.trim();
  let request = supabase
    .from("User")
    .select("id, username, displayName, email, avatarUrl, bio, defaultPrivacy, profileVisibility, usernameUpdatedAt, lastSeenAt")
    .eq("profileVisibility", "PUBLIC")
    .order("displayName", { ascending: true })
    .limit(30);

  if (clean) request = request.or(`username.ilike.%${clean}%,displayName.ilike.%${clean}%`);

  const { data, error } = await request;
  const profiles = ((data ?? []) as DbUser[]).map(mapDbUser).filter((profile) => profile.id !== ownId);
  return { profiles, error };
}

export async function fetchProfileById(id: string) {
  const { data, error } = await supabase
    .from("User")
    .select("id, username, displayName, email, avatarUrl, bio, defaultPrivacy, profileVisibility, usernameUpdatedAt, lastSeenAt")
    .eq("id", id)
    .single();
  return { profile: data ? mapDbUser(data as DbUser) : null, error };
}

export async function fetchMyFriendships() {
  const { data: authData, error: userError } = await supabase.auth.getUser();
  if (userError || !authData.user) return { friendships: [], users: new Map<string, UserDto>(), error: userError };
  const userId = authData.user.id;

  const { data, error } = await supabase
    .from("Friendship")
    .select("id, requesterId, receiverId, status, createdAt, updatedAt")
    .or(`requesterId.eq.${userId},receiverId.eq.${userId}`)
    .order("createdAt", { ascending: false });

  const friendships = (data ?? []) as DbFriendship[];
  const userIds = Array.from(new Set(friendships.flatMap((item) => [item.requesterId, item.receiverId])));
  if (userIds.length === 0) return { friendships, users: new Map<string, UserDto>(), error };

  const { data: userRows, error: profileError } = await supabase
    .from("User")
    .select("id, username, displayName, email, avatarUrl, bio, defaultPrivacy, profileVisibility, usernameUpdatedAt, lastSeenAt")
    .in("id", userIds);

  const users = new Map<string, UserDto>();
  ((userRows ?? []) as DbUser[]).forEach((row) => users.set(row.id, mapDbUser(row)));
  return { friendships, users, error: error ?? profileError };
}

export async function fetchRelationshipWithProfile(profileId: string) {
  const { data: authData, error: userError } = await supabase.auth.getUser();
  if (userError || !authData.user) return { relation: null, user: null, error: userError };
  const userId = authData.user.id;

  const { data, error } = await supabase
    .from("Friendship")
    .select("id, requesterId, receiverId, status, createdAt, updatedAt")
    .or(`and(requesterId.eq.${userId},receiverId.eq.${profileId}),and(requesterId.eq.${profileId},receiverId.eq.${userId})`)
    .order("status", { ascending: true })
    .order("updatedAt", { ascending: false })
    .limit(1);

  const profile = await fetchProfileById(profileId);
  return { relation: ((data ?? []) as DbFriendship[])[0] ?? null, user: profile.profile, error: error ?? profile.error };
}

export async function sendFollowRequestToProfile(receiverId: string) {
  const { data: authData, error: userError } = await supabase.auth.getUser();
  if (userError || !authData.user) return { error: userError ?? new Error("Sign in to send follow requests.") };
  const requesterId = authData.user.id;
  if (requesterId === receiverId) return { error: new Error("You cannot follow yourself.") };

  const existing = await fetchRelationshipWithProfile(receiverId);
  if (existing.relation) {
    return { error: new Error(existing.relation.status === "ACCEPTED" ? "You are already friends." : "A follow request already exists for this profile.") };
  }

  return supabase.from("Friendship").insert({
    id: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `follow-${Date.now()}`,
    requesterId,
    receiverId,
    status: "PENDING",
    updatedAt: new Date().toISOString()
  });
}

export async function answerFollowRequest(requestId: string, status: "ACCEPTED" | "BLOCKED") {
  return supabase
    .from("Friendship")
    .update({ status, updatedAt: new Date().toISOString() })
    .eq("id", requestId);
}

export async function updateMyProfile(input: Partial<Pick<UserDto, "displayName" | "username" | "email" | "bio" | "avatarUrl" | "defaultPrivacy" | "profileVisibility">>) {
  const { data: authData, error: userError } = await supabase.auth.getUser();
  if (userError || !authData.user) return { profile: null, error: userError ?? new Error("Sign in to save your profile.") };

  const patch: Record<string, string | null | undefined> = {
    displayName: input.displayName?.trim(),
    username: input.username ? cleanUsername(input.username) : undefined,
    email: input.email?.toLowerCase(),
    bio: input.bio ?? null,
    avatarUrl: input.avatarUrl ?? null,
    defaultPrivacy: input.defaultPrivacy,
    profileVisibility: input.profileVisibility,
    updatedAt: new Date().toISOString()
  };

  Object.keys(patch).forEach((key) => {
    if (patch[key] === undefined) delete patch[key];
  });

  if (patch.username) patch.usernameUpdatedAt = new Date().toISOString();

  const { data, error } = await supabase
    .from("User")
    .update(patch)
    .eq("id", authData.user.id)
    .select("id, username, displayName, email, avatarUrl, bio, defaultPrivacy, profileVisibility, usernameUpdatedAt, lastSeenAt")
    .single();

  return { profile: data ? mapDbUser(data as DbUser) : null, error };
}

export async function touchMyPresence() {
  const { data: authData, error: userError } = await supabase.auth.getUser();
  if (userError || !authData.user) return { error: userError };
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("User")
    .update({ lastSeenAt: now, updatedAt: now })
    .eq("id", authData.user.id);
  return { error };
}

function makeId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return `${prefix}-${crypto.randomUUID()}`;
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

async function mapPosts(rows: DbPost[]) {
  const userIds = Array.from(new Set(rows.map((post) => post.userId)));
  const reactionCounts = new Map<string, number>();
  const commentCounts = new Map<string, number>();
  const users = new Map<string, UserDto>();

  if (userIds.length > 0) {
    const { data: userRows } = await supabase
      .from("User")
      .select("id, username, displayName, email, avatarUrl, bio, defaultPrivacy, profileVisibility, usernameUpdatedAt, lastSeenAt")
      .in("id", userIds);
    ((userRows ?? []) as DbUser[]).forEach((row) => users.set(row.id, mapDbUser(row)));
  }

  const postIds = rows.map((post) => post.id);
  if (postIds.length > 0) {
    const [{ data: reactionRows }, { data: commentRows }] = await Promise.all([
      supabase.from("Reaction").select("postId").in("postId", postIds),
      supabase.from("Comment").select("postId").in("postId", postIds)
    ]);
    ((reactionRows ?? []) as { postId: string }[]).forEach((row) => reactionCounts.set(row.postId, (reactionCounts.get(row.postId) ?? 0) + 1));
    ((commentRows ?? []) as { postId: string }[]).forEach((row) => commentCounts.set(row.postId, (commentCounts.get(row.postId) ?? 0) + 1));
  }

  return rows.flatMap((row): PostDto[] => {
    const user = users.get(row.userId);
    if (!user) return [];
    return [{
      id: row.id,
      user,
      mediaType: row.mediaType,
      mediaUrl: row.mediaUrl,
      thumbnailUrl: row.thumbnailUrl,
      caption: row.caption,
      locationName: row.locationName,
      latitude: row.latitude,
      longitude: row.longitude,
      privacy: row.privacy,
      frameStyle: row.frameStyle,
      filterPreset: row.filterPreset ?? "ORIGINAL",
      profileFeatured: Boolean(row.profileFeatured),
      createdAt: normalizeDbTimestamp(row.createdAt) ?? row.createdAt,
      expiresAt: normalizeDbTimestamp(row.expiresAt) ?? row.expiresAt,
      reactionCount: reactionCounts.get(row.id) ?? 0,
      commentCount: commentCounts.get(row.id) ?? 0
    }];
  });
}

export async function uploadFrameMedia(localUri: string, userId: string) {
  if (/^https?:\/\//i.test(localUri)) return { publicUrl: localUri, error: null };
  try {
    const response = await fetch(localUri);
    const blob = await response.blob();
    const dataUrl = await blobToDataUrl(blob);
    const contentType = blob.type || "image/jpeg";
    const extension = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : contentType.includes("gif") ? "gif" : "jpg";
    const path = `${userId}/${Date.now()}-${makeId("media")}.${extension}`;
    const { error } = await supabase.storage.from("frame-media").upload(path, blob, { contentType, upsert: false });
    if (error) return { publicUrl: dataUrl, error: null };
    const { data } = supabase.storage.from("frame-media").getPublicUrl(path);
    return { publicUrl: data.publicUrl, error: null };
  } catch {
    return { publicUrl: localUri, error: null };
  }
}

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onloadend = () => resolve(String(reader.result));
    reader.readAsDataURL(blob);
  });
}

export async function createRemotePost(input: { caption: string; privacy: Privacy; frameStyle: FrameStyle; mediaUrl: string; filterPreset?: PhotoFilter; profileFeatured?: boolean; locationName?: string | null; latitude?: number | null; longitude?: number | null }) {
  const { data: authData, error: userError } = await supabase.auth.getUser();
  if (userError || !authData.user) return { post: null, error: userError ?? new Error("Sign in to post a Frame.") };
  const uploaded = await uploadFrameMedia(input.mediaUrl, authData.user.id);
  if (uploaded.error || !uploaded.publicUrl) return { post: null, error: uploaded.error ?? new Error("Media upload failed.") };

  const { data, error } = await supabase
    .from("Post")
    .insert({
      id: makeId("post"),
      userId: authData.user.id,
      mediaType: "IMAGE",
      mediaUrl: uploaded.publicUrl,
      caption: input.caption || "A fresh Frame from today.",
      locationName: input.locationName ?? null,
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      privacy: input.privacy,
      frameStyle: input.frameStyle,
      filterPreset: input.filterPreset ?? "ORIGINAL",
      profileFeatured: input.profileFeatured ?? false,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    })
    .select("id, userId, mediaType, mediaUrl, thumbnailUrl, caption, locationName, latitude, longitude, privacy, frameStyle, filterPreset, profileFeatured, createdAt, expiresAt")
    .single();

  if (error || !data) return { post: null, error };
  const posts = await mapPosts([data as DbPost]);
  return { post: posts[0] ?? null, error: null };
}

export async function fetchVisiblePosts() {
  const { data, error } = await supabase
    .from("Post")
    .select("id, userId, mediaType, mediaUrl, thumbnailUrl, caption, locationName, latitude, longitude, privacy, frameStyle, filterPreset, profileFeatured, createdAt, expiresAt")
    .is("deletedAt", null)
    .gt("expiresAt", new Date().toISOString())
    .order("createdAt", { ascending: false })
    .limit(80);
  return { posts: await mapPosts((data ?? []) as DbPost[]), error };
}

export async function fetchUserPosts(userId: string) {
  const { data, error } = await supabase
    .from("Post")
    .select("id, userId, mediaType, mediaUrl, thumbnailUrl, caption, locationName, latitude, longitude, privacy, frameStyle, filterPreset, profileFeatured, createdAt, expiresAt")
    .eq("userId", userId)
    .is("deletedAt", null)
    .order("createdAt", { ascending: false });
  return { posts: await mapPosts((data ?? []) as DbPost[]), error };
}

export async function setRemotePostProfileFeatured(postId: string, profileFeatured: boolean) {
  const { data, error } = await supabase
    .from("Post")
    .update({ profileFeatured })
    .eq("id", postId)
    .select("id, userId, mediaType, mediaUrl, thumbnailUrl, caption, locationName, latitude, longitude, privacy, frameStyle, filterPreset, profileFeatured, createdAt, expiresAt")
    .single();
  if (error || !data) return { post: null, error };
  const posts = await mapPosts([data as DbPost]);
  return { post: posts[0] ?? null, error: null };
}

export async function deleteRemotePost(postId: string) {
  const { error } = await supabase
    .from("Post")
    .update({ deletedAt: new Date().toISOString() })
    .eq("id", postId);
  return { error };
}

export async function updateRemotePostPrivacy(postId: string, privacy: Privacy) {
  const { data, error } = await supabase
    .from("Post")
    .update({ privacy })
    .eq("id", postId)
    .select("id, userId, mediaType, mediaUrl, thumbnailUrl, caption, locationName, latitude, longitude, privacy, frameStyle, filterPreset, profileFeatured, createdAt, expiresAt")
    .single();
  if (error || !data) return { post: null, error };
  const posts = await mapPosts([data as DbPost]);
  return { post: posts[0] ?? null, error: null };
}

export async function toggleRemoteReaction(post: PostDto, liked: boolean) {
  const { data: authData, error: userError } = await supabase.auth.getUser();
  if (userError || !authData.user) return { error: userError ?? new Error("Sign in to like Frames.") };
  const userId = authData.user.id;
  if (liked) {
    const { error } = await supabase.from("Reaction").delete().eq("postId", post.id).eq("userId", userId).eq("type", "LIKE");
    return { error };
  }
  const { error } = await supabase.from("Reaction").upsert({
    id: makeId("reaction"),
    postId: post.id,
    userId,
    type: "LIKE"
  }, { onConflict: "postId,userId,type" });
  return { error };
}

export async function createRemoteComment(post: PostDto, text: string) {
  const clean = text.trim();
  const { data: authData, error: userError } = await supabase.auth.getUser();
  if (userError || !authData.user) return { comment: null, error: userError ?? new Error("Sign in to comment.") };
  const userId = authData.user.id;
  const { data, error } = await supabase.from("Comment").insert({
    id: makeId("comment"),
    postId: post.id,
    userId,
    text: clean,
    updatedAt: new Date().toISOString()
  }).select("id, postId, userId, text, createdAt").single();
  return { comment: data, error };
}

export async function fetchRemoteNotifications() {
  const { data: authData } = await supabase.auth.getUser();
  const userId = authData?.user?.id;
  let query = supabase.from("Notification").select("id, userId, type, title, message, read, metadata, createdAt");
  if (userId) query = query.eq("userId", userId);
  const { data, error } = await query.order("createdAt", { ascending: false }).limit(80);
  const notifications = ((data ?? []) as DbNotification[]).map((row) => ({
    id: row.id,
    type: row.type as "FOLLOW_REQUEST" | "FOLLOW_ACCEPTED" | "REACTION" | "COMMENT" | "SHARE" | "ARCHIVE_READY",
    title: row.title,
    body: row.message,
    postId: typeof row.metadata?.postId === "string" ? row.metadata.postId : undefined,
    recipientId: row.userId,
    read: row.read,
    createdAt: normalizeDbTimestamp(row.createdAt) ?? row.createdAt
  }));
  return { notifications, error };
}

export async function markRemoteNotificationsRead() {
  const { data: authData, error: userError } = await supabase.auth.getUser();
  if (userError || !authData.user) return { error: userError };
  const { error } = await supabase.from("Notification").update({ read: true }).eq("userId", authData.user.id);
  return { error };
}

export async function fetchProfileStats(userId: string) {
  const [{ count: friends }, { count: followers }, { count: following }] = await Promise.all([
    supabase
      .from("Friendship")
      .select("id", { count: "exact", head: true })
      .or(`requesterId.eq.${userId},receiverId.eq.${userId}`)
      .eq("status", "ACCEPTED"),
    supabase.from("Friendship").select("id", { count: "exact", head: true }).eq("receiverId", userId).eq("status", "ACCEPTED"),
    supabase.from("Friendship").select("id", { count: "exact", head: true }).eq("requesterId", userId).eq("status", "ACCEPTED")
  ]);
  return { friends: friends ?? 0, followers: followers ?? 0, following: following ?? 0 };
}

export async function fetchFollowersList(userId: string) {
  const { data, error } = await supabase
    .from("Friendship")
    .select("requesterId")
    .eq("receiverId", userId)
    .eq("status", "ACCEPTED");
  if (error || !data || data.length === 0) return { users: [], error };
  const userIds = data.map((r) => r.requesterId);
  const { data: userData, error: userError } = await supabase
    .from("User")
    .select("id, username, displayName, email, avatarUrl, bio, defaultPrivacy, profileVisibility, usernameUpdatedAt, lastSeenAt")
    .in("id", userIds);
  return { users: ((userData ?? []) as DbUser[]).map(mapDbUser), error: userError };
}

export async function fetchFollowingList(userId: string) {
  const { data, error } = await supabase
    .from("Friendship")
    .select("receiverId")
    .eq("requesterId", userId)
    .eq("status", "ACCEPTED");
  if (error || !data || data.length === 0) return { users: [], error };
  const userIds = data.map((r) => r.receiverId);
  const { data: userData, error: userError } = await supabase
    .from("User")
    .select("id, username, displayName, email, avatarUrl, bio, defaultPrivacy, profileVisibility, usernameUpdatedAt, lastSeenAt")
    .in("id", userIds);
  return { users: ((userData ?? []) as DbUser[]).map(mapDbUser), error: userError };
}

export async function fetchFriendsList(userId: string) {
  const { data, error } = await supabase
    .from("Friendship")
    .select("requesterId, receiverId")
    .or(`requesterId.eq.${userId},receiverId.eq.${userId}`)
    .eq("status", "ACCEPTED");
  if (error || !data || data.length === 0) return { users: [], error };
  const userIds = Array.from(new Set(data.map((r) => (r.requesterId === userId ? r.receiverId : r.requesterId))));
  const { data: userData, error: userError } = await supabase
    .from("User")
    .select("id, username, displayName, email, avatarUrl, bio, defaultPrivacy, profileVisibility, usernameUpdatedAt, lastSeenAt")
    .in("id", userIds);
  return { users: ((userData ?? []) as DbUser[]).map(mapDbUser), error: userError };
}

export function mapDbChatMessage(row: DbChatMessage, currentUserId: string) {
  const otherId = row.senderId === currentUserId ? row.receiverId : row.senderId;
  return {
    id: row.id,
    threadUserId: otherId,
    fromUserId: row.senderId,
    text: row.text,
    mediaUrl: row.mediaUrl ?? undefined,
    mediaType: row.mediaType ?? undefined,
    status: row.status,
    deliveredAt: normalizeDbTimestamp(row.deliveredAt) ?? undefined,
    seenAt: normalizeDbTimestamp(row.seenAt) ?? undefined,
    createdAt: normalizeDbTimestamp(row.createdAt) ?? row.createdAt
  };
}

export async function fetchMyChatMessages() {
  const { data: authData, error: userError } = await supabase.auth.getUser();
  if (userError || !authData.user) return { messages: [], error: userError };
  const userId = authData.user.id;
  const { data, error } = await supabase
    .from("ChatMessage")
    .select("id, senderId, receiverId, text, mediaUrl, mediaType, status, deliveredAt, seenAt, createdAt")
    .or(`senderId.eq.${userId},receiverId.eq.${userId}`)
    .order("createdAt", { ascending: true });
  return { messages: ((data ?? []) as DbChatMessage[]).map((row) => mapDbChatMessage(row, userId)), error };
}

export async function fetchThreadMessages(threadUserId: string) {
  const { data: authData, error: userError } = await supabase.auth.getUser();
  if (userError || !authData.user) return { messages: [], error: userError };
  const userId = authData.user.id;
  const { data, error } = await supabase
    .from("ChatMessage")
    .select("id, senderId, receiverId, text, mediaUrl, mediaType, status, deliveredAt, seenAt, createdAt")
    .or(`and(senderId.eq.${userId},receiverId.eq.${threadUserId}),and(senderId.eq.${threadUserId},receiverId.eq.${userId})`)
    .order("createdAt", { ascending: true });
  return { messages: ((data ?? []) as DbChatMessage[]).map((row) => mapDbChatMessage(row, userId)), error };
}

export async function sendRemoteChatMessage(receiverId: string, text: string) {
  const clean = text.trim();
  const { data: authData, error: userError } = await supabase.auth.getUser();
  if (userError || !authData.user) return { message: null, error: userError ?? new Error("Sign in to chat.") };
  const userId = authData.user.id;
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("ChatMessage")
    .insert({
      id: makeId("chat"),
      senderId: userId,
      receiverId,
      text: clean,
      status: "DELIVERED",
      deliveredAt: now,
      updatedAt: now
    })
    .select("id, senderId, receiverId, text, mediaUrl, mediaType, status, deliveredAt, seenAt, createdAt")
    .single();
  return { message: data ? mapDbChatMessage(data as DbChatMessage, userId) : null, error };
}

export async function sendRemoteChatMedia(receiverId: string, mediaUri: string) {
  const { data: authData, error: userError } = await supabase.auth.getUser();
  if (userError || !authData.user) return { message: null, error: userError ?? new Error("Sign in to chat.") };
  const uploaded = await uploadFrameMedia(mediaUri, authData.user.id);
  if (uploaded.error || !uploaded.publicUrl) return { message: null, error: uploaded.error ?? new Error("Media upload failed.") };
  const userId = authData.user.id;
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("ChatMessage")
    .insert({
      id: makeId("chat"),
      senderId: userId,
      receiverId,
      text: "Photo",
      mediaUrl: uploaded.publicUrl,
      mediaType: "IMAGE",
      status: "DELIVERED",
      deliveredAt: now,
      updatedAt: now
    })
    .select("id, senderId, receiverId, text, mediaUrl, mediaType, status, deliveredAt, seenAt, createdAt")
    .single();
  return { message: data ? mapDbChatMessage(data as DbChatMessage, userId) : null, error };
}

export async function markThreadSeen(threadUserId: string) {
  const { data: authData, error: userError } = await supabase.auth.getUser();
  if (userError || !authData.user) return { error: userError };
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("ChatMessage")
    .update({ status: "SEEN", seenAt: now, updatedAt: now })
    .eq("senderId", threadUserId)
    .eq("receiverId", authData.user.id)
    .neq("status", "SEEN");
  return { error };
}

export interface PrintOrderPayload {
  dateTitle: string;
  photoUrls: string[];
  shippingName: string;
  shippingAddress: string;
  city: string;
  zipCode: string;
  totalPrice: string;
}

export async function createRemotePrintOrder(payload: PrintOrderPayload) {
  const { data: authData } = await supabase.auth.getUser();
  const userId = authData?.user?.id ?? "user-guest";
  const orderId = `FRM-PRINT-${Math.floor(100000 + Math.random() * 900000)}`;

  try {
    const { error } = await supabase.from("Notification").insert({
      id: makeId("print_order"),
      userId,
      type: "ARCHIVE_READY",
      title: `Order Placed: ${payload.dateTitle}`,
      message: `Physical Polaroid Print Pack (${payload.photoUrls.length} Prints) is confirmed. Tracking ID: ${orderId}`,
      read: false,
      metadata: {
        orderId,
        shippingName: payload.shippingName,
        shippingAddress: `${payload.shippingAddress}, ${payload.city} ${payload.zipCode}`,
        totalPrice: payload.totalPrice,
        photoCount: payload.photoUrls.length,
        status: "PRINTING_DISPATCHED"
      }
    });

    // Trigger OS Mobile Push Notification banner on phone
    void triggerLocalPushNotification(
      "Frames Print Order Placed 📦",
      `Your physical Polaroid pack (${payload.photoUrls.length} Prints) is confirmed. Tracking ID: ${orderId}`
    );

    return { trackingId: orderId, error };
  } catch (err: any) {
    return { trackingId: orderId, error: err };
  }
}


