import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Link, Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Pressable, StatusBar, StyleSheet, Text, View } from "react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import { palette } from "@frames/ui";
import { AppIcon } from "../components/AppIcon";
import { fetchCurrentUserProfile, fetchMyFriendships, fetchRemoteNotifications, touchMyPresence } from "../services/supabase";
import { useAppStore } from "../store/appStore";

const queryClient = new QueryClient();

export default function RootLayout() {
  const setCurrentUser = useAppStore((state) => state.setCurrentUser);
  const setAuthChecked = useAppStore((state) => state.setAuthChecked);
  const completeIntro = useAppStore((state) => state.completeIntro);
  const currentUser = useAppStore((state) => state.currentUser);
  const mergeNotifications = useAppStore((state) => state.mergeNotifications);
  const latestNotification = useAppStore((state) => state.notifications.find((notification) => !notification.read && (!notification.recipientId || notification.recipientId === state.currentUser?.id)));
  const [followToast, setFollowToast] = useState<{ id: string; body: string } | null>(null);
  const seenRequestIds = useRef(new Set<string>());
  const toast = useMemo(() => followToast ?? (latestNotification ? { id: latestNotification.id, body: latestNotification.body } : null), [followToast, latestNotification]);

  useEffect(() => {
    const hydrate = async () => {
      const { profile } = await fetchCurrentUserProfile();
      if (profile) {
        setCurrentUser(profile);
        completeIntro();
      }
      setAuthChecked(true);
    };
    void hydrate();
  }, [completeIntro, setAuthChecked, setCurrentUser]);

  useEffect(() => {
    if (!currentUser) return;
    let mounted = true;
    const checkRequests = async () => {
      const [result, notificationResult] = await Promise.all([fetchMyFriendships(), fetchRemoteNotifications()]);
      if (!mounted || result.error) return;
      mergeNotifications(notificationResult.notifications);
      const incoming = result.friendships.find((friendship) => friendship.receiverId === currentUser.id && friendship.status === "PENDING");
      if (!incoming || seenRequestIds.current.has(incoming.id)) return;
      seenRequestIds.current.add(incoming.id);
      const requester = result.users.get(incoming.requesterId);
      setFollowToast({ id: incoming.id, body: `${requester?.displayName ?? "Someone"} requested to follow you.` });
      setTimeout(() => setFollowToast((value) => (value?.id === incoming.id ? null : value)), 5000);
    };
    void checkRequests();
    const interval = setInterval(() => { void checkRequests(); }, 15000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [currentUser, mergeNotifications]);

  useEffect(() => {
    if (!currentUser) return;
    void touchMyPresence();
    const interval = setInterval(() => { void touchMyPresence(); }, 60000);
    return () => clearInterval(interval);
  }, [currentUser]);

  return (
    <GestureHandlerRootView style={styles.root}>
      <QueryClientProvider client={queryClient}>
        <View style={styles.shell}>
          <StatusBar barStyle="dark-content" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="onboarding" />
            <Stack.Screen name="login" />
            <Stack.Screen name="register" />
            <Stack.Screen name="auth/callback" />
            <Stack.Screen name="post/[id]" />
            <Stack.Screen name="user/[id]" />
            <Stack.Screen name="chat/[id]" />
            <Stack.Screen name="comments/[id]" />
            <Stack.Screen name="daily/[date]" />
            <Stack.Screen name="editor" />
            <Stack.Screen name="notifications" />
            <Stack.Screen name="settings" />
            <Stack.Screen name="share" options={{ presentation: "modal" }} />
            <Stack.Screen name="export" options={{ presentation: "modal" }} />
          </Stack>
          {toast ? (
            <Link href="/notifications" asChild>
              <Pressable style={styles.toast}>
                <View style={styles.toastIcon}><AppIcon name="bell" color={palette.ink} size={18} /></View>
                <View style={styles.toastText}>
                  <Text style={styles.toastTitle}>Frames</Text>
                  <Text numberOfLines={2} style={styles.toastBody}>{toast.body}</Text>
                </View>
              </Pressable>
            </Link>
          ) : null}
        </View>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#171414", alignItems: "center" },
  shell: { flex: 1, width: "100%", maxWidth: 560, backgroundColor: palette.paperCream, overflow: "hidden" },
  toast: { position: "absolute", top: 16, left: 14, right: 14, minHeight: 66, borderRadius: 18, backgroundColor: "rgba(255,253,248,.98)", borderWidth: 1, borderColor: "#E4D9CA", flexDirection: "row", alignItems: "center", gap: 12, padding: 12, shadowColor: "#000", shadowOpacity: 0.18, shadowRadius: 18, elevation: 8 },
  toastIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: palette.sunshine, alignItems: "center", justifyContent: "center" },
  toastText: { flex: 1 },
  toastTitle: { color: palette.ink, fontWeight: "900" },
  toastBody: { color: palette.mutedBrown, fontWeight: "800", marginTop: 2, lineHeight: 18 }
});
