import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { supabase } from "./supabase";

// Configure how push notifications behave when the app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true
  })
});

/**
 * Register device for Android & iOS Push Notifications
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (Platform.OS === "web") return null;

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      return null;
    }

    // Configure Android Notification Channel for loud heads-up alerts
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Frames Notifications",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#F6D65C"
      });
    }

    const pushTokenData = await Notifications.getExpoPushTokenAsync({
      projectId: "ab4bf3f3-1c17-4513-8943-7afc5ec68d18"
    });

    const token = pushTokenData.data;

    // Save push token in Supabase user profile
    const { data: authData } = await supabase.auth.getUser();
    if (authData?.user?.id) {
      await supabase.from("User").update({ pushToken: token }).eq("id", authData.user.id);
    }

    return token;
  } catch (error) {
    return null;
  }
}

/**
 * Trigger immediate local OS push banner notification on phone
 */
export async function triggerLocalPushNotification(title: string, body: string, data?: object) {
  if (Platform.OS === "web") return;

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: "default",
        data
      },
      trigger: null // Deliver immediately
    });
  } catch (error) {
    // Handled silently
  }
}

/**
 * Send Remote Push Notification to another user via Expo Push API
 */
export async function sendRemotePushNotification(targetPushToken: string, title: string, body: string) {
  if (!targetPushToken) return;

  try {
    await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-encoding": "gzip, deflate",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        to: targetPushToken,
        sound: "default",
        title,
        body,
        priority: "high"
      })
    });
  } catch (error) {
    // Handled silently
  }
}
