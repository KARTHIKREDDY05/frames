import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Link, Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Platform, Pressable, StatusBar, StyleSheet, Text, View } from "react-native";
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
  const [dismissedToastIds, setDismissedToastIds] = useState<Record<string, boolean>>({});
  const seenRequestIds = useRef(new Set<string>());

  const toast = useMemo(() => {
    if (followToast && !dismissedToastIds[followToast.id]) return followToast;
    if (latestNotification && !dismissedToastIds[latestNotification.id]) {
      return { id: latestNotification.id, body: latestNotification.body };
    }
    return null;
  }, [dismissedToastIds, followToast, latestNotification]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setDismissedToastIds((prev) => ({ ...prev, [toast.id]: true }));
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

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
            <View style={styles.toast}>
              <Link href="/notifications" asChild>
                <Pressable style={styles.toastContent}>
                  <View style={styles.toastIcon}><AppIcon name="bell" color={palette.ink} size={18} /></View>
                  <View style={styles.toastText}>
                    <Text style={styles.toastTitle}>Frames</Text>
                    <Text numberOfLines={2} style={styles.toastBody}>{toast.body}</Text>
                  </View>
                </Pressable>
              </Link>
              <Pressable
                style={styles.toastDismiss}
                onPress={() => setDismissedToastIds((prev) => ({ ...prev, [toast.id]: true }))}
              >
                <Text style={styles.toastDismissText}>✕</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#1A1817", alignItems: "center", justifyContent: "center" },
  shell: {
    flex: 1,
    width: "100%",
    maxWidth: 480,
    backgroundColor: palette.paperCream,
    borderLeftWidth: Platform.OS === "web" ? 2 : 0,
    borderRightWidth: Platform.OS === "web" ? 2 : 0,
    borderColor: palette.ink,
    overflow: "hidden"
  },
  toast: { position: "absolute", top: 16, left: 14, right: 14, minHeight: 60, borderRadius: 8, backgroundColor: palette.whitePaper, borderWidth: 2, borderColor: palette.ink, flexDirection: "row", alignItems: "center", padding: 10, shadowColor: palette.ink, shadowOffset: { width: 3, height: 3 }, shadowOpacity: 0.9, shadowRadius: 0, elevation: 8, zIndex: 100 },
  toastContent: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  toastIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: palette.acidYellow, borderWidth: 1.5, borderColor: palette.ink, alignItems: "center", justifyContent: "center" },
  toastText: { flex: 1 },
  toastTitle: { color: palette.ink, fontWeight: "900", fontSize: 13 },
  toastBody: { color: palette.mutedBrown, fontWeight: "700", marginTop: 1, lineHeight: 16, fontSize: 11 },
  toastDismiss: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", marginLeft: 6 },
  toastDismissText: { color: palette.mutedBrown, fontSize: 13, fontWeight: "900" }
});
