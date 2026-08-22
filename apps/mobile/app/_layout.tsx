import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Link, Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Animated, Platform, Pressable, StatusBar, StyleSheet, Text, View } from "react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import { palette } from "@frames/ui";
import { AppIcon } from "../components/AppIcon";
import { registerForPushNotificationsAsync, triggerLocalPushNotification } from "../services/pushNotificationService";
import { fetchCurrentUserProfile, fetchMyFriendships, fetchRemoteNotifications, touchMyPresence } from "../services/supabase";
import { useAppStore } from "../store/appStore";

const queryClient = new QueryClient();

export default function RootLayout() {
  const setCurrentUser = useAppStore((state) => state.setCurrentUser);
  const setAuthChecked = useAppStore((state) => state.setAuthChecked);
  const completeIntro = useAppStore((state) => state.completeIntro);
  const currentUser = useAppStore((state) => state.currentUser);
  const mergeNotifications = useAppStore((state) => state.mergeNotifications);
  const [liveToast, setLiveToast] = useState<{ id: string; body: string } | null>(null);
  const [dismissedToastIds, setDismissedToastIds] = useState<Record<string, boolean>>({});
  const seenRequestIds = useRef(new Set<string>());

  const toastAnim = useRef(new Animated.Value(-100)).current;
  const toastOpacity = useRef(new Animated.Value(0)).current;

  const toast = useMemo(() => {
    if (liveToast && !dismissedToastIds[liveToast.id]) return liveToast;
    return null;
  }, [dismissedToastIds, liveToast]);

  const slideOut = () => {
    Animated.parallel([
      Animated.timing(toastAnim, { toValue: -100, duration: 350, useNativeDriver: Platform.OS !== "web" }),
      Animated.timing(toastOpacity, { toValue: 0, duration: 300, useNativeDriver: Platform.OS !== "web" })
    ]).start(() => {
      if (toast) setDismissedToastIds((prev) => ({ ...prev, [toast.id]: true }));
    });
  };

  useEffect(() => {
    if (toast) {
      Animated.parallel([
        Animated.spring(toastAnim, { toValue: 16, tension: 50, friction: 8, useNativeDriver: Platform.OS !== "web" }),
        Animated.timing(toastOpacity, { toValue: 1, duration: 250, useNativeDriver: Platform.OS !== "web" })
      ]).start();

      const timer = setTimeout(() => {
        slideOut();
      }, 4500);

      return () => clearTimeout(timer);
    } else {
      toastAnim.setValue(-100);
      toastOpacity.setValue(0);
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
      void registerForPushNotificationsAsync();
    };
    void hydrate();
  }, [completeIntro, setAuthChecked, setCurrentUser]);

  useEffect(() => {
    if (!currentUser) return;
    let mounted = true;
    const checkRequests = async () => {
      try {
        const [result, notificationResult] = await Promise.all([fetchMyFriendships(), fetchRemoteNotifications()]);
        if (!mounted || result.error) return;
        mergeNotifications(notificationResult.notifications);
        const incoming = result.friendships.find((friendship) => friendship.receiverId === currentUser.id && friendship.status === "PENDING");
        if (!incoming || seenRequestIds.current.has(incoming.id)) return;
        seenRequestIds.current.add(incoming.id);
        const requester = result.users.get(incoming.requesterId);
        setLiveToast({ id: incoming.id, body: `${requester?.displayName ?? "Someone"} requested to follow you.` });
      } catch {
        // Handled silently
      }
    };
    void checkRequests();
    const interval = setInterval(() => { void checkRequests(); }, 20000);
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
            <Stack.Screen name="orders" />
          </Stack>

          {toast ? (
            <Animated.View
              style={[
                styles.toast,
                {
                  top: toastAnim,
                  opacity: toastOpacity
                }
              ]}
            >
              <Link href="/notifications" asChild onPress={slideOut}>
                <Pressable style={styles.toastContent}>
                  <View style={styles.toastIcon}><AppIcon name="bell" color={palette.ink} size={18} /></View>
                  <View style={styles.toastText}>
                    <Text style={styles.toastTitle}>Frames</Text>
                    <Text numberOfLines={2} style={styles.toastBody}>{toast.body}</Text>
                  </View>
                </Pressable>
              </Link>
              <Pressable style={styles.toastDismiss} onPress={slideOut}>
                <Text style={styles.toastDismissText}>✕</Text>
              </Pressable>
            </Animated.View>
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
  toast: { position: "absolute", left: 14, right: 14, minHeight: 60, borderRadius: 8, backgroundColor: palette.whitePaper, borderWidth: 2, borderColor: palette.ink, flexDirection: "row", alignItems: "center", padding: 10, shadowColor: palette.ink, shadowOffset: { width: 3, height: 3 }, shadowOpacity: 0.9, shadowRadius: 0, elevation: 8, zIndex: 100 },
  toastContent: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  toastIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: palette.acidYellow, borderWidth: 1.5, borderColor: palette.ink, alignItems: "center", justifyContent: "center" },
  toastText: { flex: 1 },
  toastTitle: { color: palette.ink, fontWeight: "900", fontSize: 13 },
  toastBody: { color: palette.mutedBrown, fontWeight: "700", marginTop: 1, lineHeight: 16, fontSize: 11 },
  toastDismiss: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center", marginLeft: 6, backgroundColor: palette.paperCream, borderWidth: 1, borderColor: palette.ink },
  toastDismissText: { color: palette.ink, fontSize: 12, fontWeight: "900" }
});
