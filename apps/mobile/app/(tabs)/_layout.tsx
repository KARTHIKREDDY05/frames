import { Redirect, Tabs } from "expo-router";
import { Text, View } from "react-native";
import { palette } from "@frames/ui";
import { AppIcon, type AppIconName } from "../../components/AppIcon";
import { useAppStore } from "../../store/appStore";

function TabIcon({ name, color, label }: { name: AppIconName; color: string; label: string }) {
  return (
    <View style={{ alignItems: "center", justifyContent: "center", gap: 2, minWidth: 46 }}>
      <AppIcon name={name} color={color} size={21} />
      <Text style={{ color, fontSize: 10, fontWeight: "900" }}>{label}</Text>
    </View>
  );
}

export default function TabsLayout() {
  const currentUser = useAppStore((state) => state.currentUser);
  const authChecked = useAppStore((state) => state.authChecked);

  if (authChecked && !currentUser) return <Redirect href="/login" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.ink,
        tabBarInactiveTintColor: palette.mutedBrown,
        tabBarShowLabel: false,
        tabBarStyle: { backgroundColor: palette.whitePaper, borderTopColor: "#E4D9CA", height: 78, paddingTop: 6 }
      }}
    >
      <Tabs.Screen name="home" options={{ title: "Home", tabBarIcon: ({ color }) => <TabIcon name="home" color={color} label="Home" /> }} />
      <Tabs.Screen name="search" options={{ title: "Search", tabBarIcon: ({ color }) => <TabIcon name="search" color={color} label="Search" /> }} />
      <Tabs.Screen name="camera" options={{ title: "Camera", tabBarIcon: ({ color }) => <TabIcon name="camera" color={color} label="Camera" />, tabBarStyle: { display: "none" } }} />
      <Tabs.Screen name="chats" options={{ title: "Chats", tabBarIcon: ({ color }) => <TabIcon name="comment" color={color} label="Chats" /> }} />
      <Tabs.Screen name="feed" options={{ href: null }} />
      <Tabs.Screen name="archive" options={{ href: null }} />
      <Tabs.Screen name="memories" options={{ href: null }} />
      <Tabs.Screen name="profile" options={{ title: "Profile", tabBarIcon: ({ color }) => <TabIcon name="profile" color={color} label="Profile" /> }} />
    </Tabs>
  );
}
