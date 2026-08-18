import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { palette } from "@frames/ui";
import { type EmailOtpType } from "@supabase/supabase-js";
import { ensureUserProfile, supabase } from "../../services/supabase";
import { useAppStore } from "../../store/appStore";

export default function AuthCallback() {
  const [ready, setReady] = useState(false);
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

  if (ready) return <Redirect href="/(tabs)/home" />;

  return (
    <View style={styles.container}>
      <ActivityIndicator />
      <Text style={styles.text}>Verifying your email...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.paperCream, alignItems: "center", justifyContent: "center", gap: 14 },
  text: { color: palette.ink, fontWeight: "900" }
});
