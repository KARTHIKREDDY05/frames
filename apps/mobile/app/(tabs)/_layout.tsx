import { Tabs } from "expo-router";
import Feather from "@expo/vector-icons/Feather";
import { palette } from "@frames/ui";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.ink,
        tabBarInactiveTintColor: palette.mutedBrown,
        tabBarStyle: { backgroundColor: palette.whitePaper, borderTopColor: "#E4D9CA", height: 82, paddingTop: 8 }
      }}
    >
      <Tabs.Screen name="home" options={{ title: "Home", tabBarIcon: ({ color }) => <Feather name="home" color={color} size={22} /> }} />
      <Tabs.Screen name="archive" options={{ title: "Archive", tabBarIcon: ({ color }) => <Feather name="book-open" color={color} size={22} /> }} />
      <Tabs.Screen name="camera" options={{ title: "Camera", tabBarIcon: ({ color }) => <Feather name="camera" color={color} size={30} /> }} />
      <Tabs.Screen name="memories" options={{ title: "Memories", tabBarIcon: ({ color }) => <Feather name="image" color={color} size={22} /> }} />
      <Tabs.Screen name="profile" options={{ title: "Profile", tabBarIcon: ({ color }) => <Feather name="user" color={color} size={22} /> }} />
    </Tabs>
  );
}
