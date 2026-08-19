import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { palette } from "@frames/ui";
import { type EmailOtpType } from "@supabase/supabase-js";
import { ensureUserProfile, supabase } from "../../services/supabase";
import { useAppStore } from "../../store/appStore";

export default function AuthCallback() {
  const [ready, setReady] = useState(false);
  const [appUrl, setAppUrl] = useState("");
  const setCurrentUser = useAppStore((state) => state.setCurrentUser);
  const completeIntro = useAppStore((state) => state.completeIntro);

  useEffect(() => {
    const finishAuth = async () => {
      if (typeof window !== "undefined") {
        const search = new URLSearchParams(window.location.search);
        const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
        const errorDescription = search.get("error_description") ?? hash.get("error_description");
        if (errorDescription) {
          setReady(true);
          return;
        }

        const tokenHash = search.get("token_hash");
        const type = search.get("type") as EmailOtpType | null;
        const code = search.get("code");
        const accessToken = hash.get("access_token");
        const refreshToken = hash.get("refresh_token");

        // Construct deep link for mobile app
        const fullParams = window.location.search || (window.location.hash ? `?${window.location.hash.slice(1)}` : "");
        const deepLink = `frames://auth/callback${fullParams}`;
        setAppUrl(deepLink);

        // If on mobile browser, attempt automatic deep link back into the app
        const isMobileDevice = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
        if (isMobileDevice) {
          try {
            window.location.href = deepLink;
          } catch {
            // Ignored
          }
        }

        if (tokenHash && type) {
          await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
        } else if (code) {
          await supabase.auth.exchangeCodeForSession(code);
        } else if (accessToken && refreshToken) {
          await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
        }
      }

      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;
      if (user) {
        const { profile } = await ensureUserProfile(user);
        setCurrentUser(profile);
      }
      completeIntro();
      setReady(true);
    };

    void finishAuth();
  }, [completeIntro, setCurrentUser]);

  if (ready && typeof window === "undefined") {
    return <Redirect href="/(tabs)/home" />;
  }

  const openApp = () => {
    if (appUrl) {
      if (typeof window !== "undefined") {
        window.location.href = appUrl;
      } else {
        void Linking.openURL(appUrl);
      }
    }
  };

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={palette.ink} />
      <Text style={styles.title}>Signed in successfully!</Text>
      <Text style={styles.copy}>Redirecting you back to your Frames app...</Text>
      {appUrl ? (
        <Pressable style={styles.button} onPress={openApp}>
          <Text style={styles.buttonText}>Open Frames App ›</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.paperCream, alignItems: "center", justifyContent: "center", padding: 24, gap: 16 },
  title: { fontSize: 22, fontWeight: "900", color: palette.ink, textAlign: "center" },
  copy: { fontSize: 15, color: palette.mutedBrown, textAlign: "center", lineHeight: 22 },
  button: { marginTop: 12, backgroundColor: palette.ink, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 24 },
  buttonText: { color: palette.whitePaper, fontSize: 16, fontWeight: "900" }
});
