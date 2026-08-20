import { Redirect, Tabs } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { palette } from "@frames/ui";
import { AppIcon, type AppIconName } from "../../components/AppIcon";
import { useAppStore } from "../../store/appStore";

function TabIcon({ name, focused, label }: { name: AppIconName; focused: boolean; label: string }) {
  return (
    <View style={[styles.tabIconWrap, focused && styles.tabIconWrapActive]}>
      <AppIcon name={name} color={palette.ink} size={20} />
      <Text numberOfLines={1} style={[styles.tabLabel, focused && styles.tabLabelActive]}>{label}</Text>
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
        tabBarStyle: {
          backgroundColor: palette.whitePaper,
          borderTopWidth: 2,
          borderTopColor: palette.ink,
          height: 68,
          paddingTop: 4,
          paddingBottom: 4,
          shadowColor: palette.ink,
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.1,
          shadowRadius: 0
        }
      }}
    >
      <Tabs.Screen name="home" options={{ title: "Home", tabBarIcon: ({ focused }) => <TabIcon name="home" focused={focused} label="Home" /> }} />
      <Tabs.Screen name="search" options={{ title: "Search", tabBarIcon: ({ focused }) => <TabIcon name="search" focused={focused} label="Search" /> }} />
      <Tabs.Screen name="camera" options={{ title: "Camera", tabBarIcon: ({ focused }) => <TabIcon name="camera" focused={focused} label="Camera" />, tabBarStyle: { display: "none" } }} />
      <Tabs.Screen name="chats" options={{ title: "Chats", tabBarIcon: ({ focused }) => <TabIcon name="comment" focused={focused} label="Chats" /> }} />
      <Tabs.Screen name="feed" options={{ href: null }} />
      <Tabs.Screen name="archive" options={{ href: null }} />
      <Tabs.Screen name="memories" options={{ href: null }} />
      <Tabs.Screen name="profile" options={{ title: "Profile", tabBarIcon: ({ focused }) => <TabIcon name="profile" focused={focused} label="Profile" /> }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabIconWrap: {
    width: "100%",
    paddingHorizontal: 4,
    paddingVertical: 3,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    gap: 1
  },
  tabIconWrapActive: {
    backgroundColor: palette.acidYellow,
    borderWidth: 1.5,
    borderColor: palette.ink
  },
  tabLabel: {
    fontSize: 9.5,
    fontWeight: "900",
    color: palette.mutedBrown,
    textAlign: "center",
    includeFontPadding: false
  },
  tabLabelActive: {
    color: palette.ink
  }
});
