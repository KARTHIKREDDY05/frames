import { Link } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import * as Contacts from "expo-contacts";
import { Image, Platform, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from "react-native";
import { palette } from "@frames/ui";
import type { UserDto } from "@frames/types";
import { AppIcon } from "../../components/AppIcon";
import { fetchMyFriendships, searchProfiles, sendFollowRequestToProfile } from "../../services/supabase";
import { useAppStore } from "../../store/appStore";

export default function SearchArchive() {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<UserDto[]>([]);
  const [contacts, setContacts] = useState<Contacts.Contact[]>([]);
  const [mode, setMode] = useState<"profiles" | "contacts">("profiles");
  const [friendIds, setFriendIds] = useState<Set<string>>(new Set());
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [contactsPermission, setContactsPermission] = useState<"unknown" | "granted" | "denied" | "web">("unknown");
  const currentUser = useAppStore((state) => state.currentUser);
  const filtered = useMemo(() => users.filter((user) => `${user.displayName} ${user.username}`.toLowerCase().includes(query.toLowerCase())), [query, users]);
  const filteredContacts = useMemo(() => contacts.filter((contact) => {
    const phones = contact.phoneNumbers?.map((phone) => phone.number ?? "").join(" ") ?? "";
    return `${contact.name ?? ""} ${phones}`.toLowerCase().includes(query.toLowerCase());
  }), [contacts, query]);
  const suggestions = useMemo(() => users.filter((user) => !friendIds.has(user.id)).slice(0, 8), [friendIds, users]);

  const loadPeople = useCallback(async () => {
    setLoading(true);
    const [{ profiles, error }, friendshipResult] = await Promise.all([searchProfiles(query), fetchMyFriendships()]);
    setLoading(false);
    if (error) setMessage(error.message);
    setUsers(profiles);
    const nextFriendIds = new Set<string>();
    const nextPendingIds = new Set<string>();
    friendshipResult.friendships.forEach((friendship) => {
      const otherId = friendship.requesterId === currentUser?.id ? friendship.receiverId : friendship.requesterId;
      if (friendship.status === "ACCEPTED") nextFriendIds.add(otherId);
      if (friendship.status === "PENDING" && friendship.requesterId === currentUser?.id) nextPendingIds.add(friendship.receiverId);
    });
    setFriendIds(nextFriendIds);
    setPendingIds(nextPendingIds);
  }, [currentUser?.id, query]);

  useEffect(() => {
    const timer = setTimeout(() => { void loadPeople(); }, 250);
    return () => clearTimeout(timer);
  }, [loadPeople]);

  const loadContacts = useCallback(async () => {
    setMessage("");
    if (Platform.OS === "web") {
      setContactsPermission("web");
      return;
    }
    setContactsLoading(true);
    const permission = await Contacts.requestPermissionsAsync();
    if (!permission.granted) {
      setContactsPermission("denied");
      setContactsLoading(false);
      setMessage("Contacts permission is needed to show phone contacts here.");
      return;
    }
    setContactsPermission("granted");
    const result = await Contacts.getContactsAsync({
      fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Emails],
      sort: Contacts.SortTypes.FirstName
    });
    setContacts(result.data.filter((contact) => (contact.phoneNumbers?.length ?? 0) > 0));
    setContactsLoading(false);
  }, []);

  useEffect(() => {
    if (mode === "contacts" && contactsPermission === "unknown") void loadContacts();
  }, [contactsPermission, loadContacts, mode]);

  const follow = async (userId: string) => {
    setMessage("");
    if (!currentUser) {
      setMessage("Sign in first so follow requests come from your real account.");
      return;
    }
    const { error } = await sendFollowRequestToProfile(userId);
    if (error) {
      setMessage(error.message.includes("duplicate") ? "A follow request already exists for this profile." : error.message);
      return;
    }
    setPendingIds((ids) => new Set(ids).add(userId));
    setMessage("Follow request sent.");
  };

  const invite = async (contact?: Contacts.Contact) => {
    const phone = contact?.phoneNumbers?.[0]?.number;
    const name = contact?.name ? ` ${contact.name}` : "";
    const appLink = "https://frames-test-build.vercel.app";
    await Share.share({
      message: `Hey${name}, join me on Frames: ${appLink}`,
      url: appLink,
      title: "Join me on Frames"
    });
    setMessage(phone ? `Invite ready for ${phone}.` : "Invite ready to share.");
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>DISCOVER</Text>
        <Text style={styles.title}>Find People</Text>
        <Text style={styles.subtitle}>Search profiles, sync contacts, and invite friends into your Frames circle.</Text>
      </View>
      <View style={styles.quickStats}>
        <View style={styles.statCard}><AppIcon name="profile" color={palette.ink} size={20} /><Text style={styles.statValue}>{users.length}</Text><Text style={styles.statLabel}>Profiles</Text></View>
        <View style={styles.statCard}><AppIcon name="user-plus" color={palette.ink} size={20} /><Text style={styles.statValue}>{contacts.length}</Text><Text style={styles.statLabel}>Contacts</Text></View>
      </View>
      <View style={styles.tabs}>
        <Pressable style={[styles.tab, mode === "contacts" && styles.tabActive]} onPress={() => setMode("contacts")}>
          <AppIcon name="profile" color={mode === "contacts" ? palette.whitePaper : palette.ink} size={16} />
          <Text style={[styles.tabText, mode === "contacts" && styles.tabTextActive]}>Contacts</Text>
        </Pressable>
        <Pressable style={[styles.tab, mode === "profiles" && styles.tabActive]} onPress={() => setMode("profiles")}>
          <AppIcon name="search" color={mode === "profiles" ? palette.whitePaper : palette.ink} size={16} />
          <Text style={[styles.tabText, mode === "profiles" && styles.tabTextActive]}>Profiles</Text>
        </Pressable>
      </View>
      {suggestions.length > 0 ? (
        <View style={styles.suggestionsBlock}>
          <View style={styles.suggestionsHeader}>
            <Text style={styles.suggestionsTitle}>Suggested for you</Text>
            <Text style={styles.suggestionsHint}>Public profiles</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestionRow}>
            {suggestions.map((user) => {
              const pending = pendingIds.has(user.id);
              return (
                <View key={user.id} style={styles.suggestionCard}>
                  <Link href={`/user/${user.id}`} asChild>
                    <Pressable style={styles.suggestionProfile}>
                      <Image source={{ uri: user.avatarUrl ?? undefined }} style={styles.suggestionAvatar} />
                      <Text numberOfLines={1} style={styles.suggestionName}>{user.displayName}</Text>
                      <Text numberOfLines={1} style={styles.suggestionUsername}>@{user.username}</Text>
                    </Pressable>
                  </Link>
                  <Pressable style={[styles.suggestionButton, pending && styles.followButtonMuted]} onPress={() => { void follow(user.id); }} disabled={pending}>
                    <Text style={styles.followText}>{pending ? "Pending" : "Follow"}</Text>
                  </Pressable>
                </View>
              );
            })}
          </ScrollView>
        </View>
      ) : null}
      <View style={styles.search}><AppIcon name="search" color={palette.mutedBrown} size={20} /><TextInput placeholder={mode === "contacts" ? "Search contacts or phone number" : "Search name or username"} style={styles.input} value={query} onChangeText={setQuery} autoCapitalize="none" /></View>
      {!currentUser ? <Text style={styles.notice}>You can browse public profiles. Sign in to send requests.</Text> : null}
      {message ? <Text style={styles.notice}>{message}</Text> : null}
      {mode === "contacts" ? (
        <>
          {contactsPermission === "web" ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>Contacts work in the mobile app.</Text>
              <Text style={styles.emptyCopy}>Browsers cannot read your phone contacts. Install the APK to sync contacts, or share an invite link now.</Text>
              <Pressable style={styles.inviteWide} onPress={() => { void invite(); }}><AppIcon name="send" size={16} /><Text style={styles.followText}>Share invite link</Text></Pressable>
            </View>
          ) : null}
          {contactsPermission === "denied" ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>Contacts permission is off.</Text>
              <Text style={styles.emptyCopy}>Allow Contacts permission in your device settings to see phone numbers here.</Text>
              <Pressable style={styles.inviteWide} onPress={() => { void invite(); }}><AppIcon name="send" size={16} /><Text style={styles.followText}>Share invite link</Text></Pressable>
            </View>
          ) : null}
          {contactsPermission === "granted" && filteredContacts.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>{contactsLoading ? "Loading contacts..." : "No contacts found."}</Text>
              <Text style={styles.emptyCopy}>Contacts with phone numbers will appear here. You can invite anyone to download Frames.</Text>
            </View>
          ) : null}
          {filteredContacts.map((contact) => {
            const phone = contact.phoneNumbers?.[0]?.number ?? "No phone number";
            return (
              <View key={contact.id ?? `${contact.name}-${phone}`} style={styles.person}>
                <View style={styles.profileLink}>
                  <View style={styles.initial}><Text style={styles.initialText}>{(contact.name?.[0] ?? "?").toUpperCase()}</Text></View>
                  <View style={styles.personText}>
                    <Text style={styles.name}>{contact.name ?? "Unnamed contact"}</Text>
                    <Text style={styles.username}>{phone}</Text>
                  </View>
                </View>
                <Pressable style={styles.followButton} onPress={() => { void invite(contact); }}>
                  <AppIcon name="send" color={palette.ink} size={16} />
                  <Text style={styles.followText}>Invite</Text>
                </Pressable>
              </View>
            );
          })}
        </>
      ) : null}
      {mode === "profiles" && filtered.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>{loading ? "Loading profiles..." : "No matching profiles."}</Text>
          <Text style={styles.emptyCopy}>Try another name or username. Public profiles and suggestions appear here; private profiles stay hidden until connected.</Text>
        </View>
      ) : null}
      {mode === "profiles" ? filtered.map((user) => {
        const isFriend = friendIds.has(user.id);
        const pending = pendingIds.has(user.id);
        return (
          <View key={user.id} style={styles.person}>
            <Link href={`/user/${user.id}`} asChild>
              <Pressable style={styles.profileLink}>
                <Image source={{ uri: user.avatarUrl ?? undefined }} style={styles.avatar} />
                <View style={styles.personText}>
                  <Text style={styles.name}>{user.displayName}</Text>
                  <Text style={styles.username}>@{user.username}</Text>
                </View>
              </Pressable>
            </Link>
              <Pressable style={[styles.followButton, (isFriend || pending) && styles.followButtonMuted]} onPress={() => { void follow(user.id); }} disabled={isFriend || pending}>
              <AppIcon name={isFriend ? "check" : pending ? "clock" : "user-plus"} color={palette.ink} size={16} />
              <Text style={styles.followText}>{isFriend ? "Friends" : pending ? "Pending" : "Follow"}</Text>
            </Pressable>
          </View>
        );
      }) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.paperCream },
  content: { padding: 18, paddingTop: 42, paddingBottom: 110, gap: 14 },
  header: { gap: 6, backgroundColor: palette.whitePaper, borderRadius: 8, borderWidth: 1, borderColor: "#E4D9CA", padding: 16 },
  eyebrow: { color: palette.mutedBrown, fontSize: 12, fontWeight: "900", textTransform: "uppercase" },
  subtitle: { color: palette.mutedBrown, lineHeight: 22, fontWeight: "600" },
  quickStats: { flexDirection: "row", gap: 10 },
  statCard: { flex: 1, minHeight: 82, borderRadius: 8, backgroundColor: palette.whitePaper, borderWidth: 1, borderColor: "#E4D9CA", padding: 12, justifyContent: "center", gap: 2 },
  statValue: { color: palette.ink, fontSize: 22, fontWeight: "900" },
  statLabel: { color: palette.mutedBrown, fontSize: 12, fontWeight: "800" },
  tabs: { flexDirection: "row", gap: 8 },
  tab: { flex: 1, minHeight: 48, borderRadius: 24, borderWidth: 1, borderColor: "#E4D9CA", backgroundColor: palette.whitePaper, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 },
  tabActive: { backgroundColor: palette.ink },
  tabText: { color: palette.ink, fontWeight: "900", fontSize: 15 },
  tabTextActive: { color: palette.whitePaper },
  suggestionsBlock: { gap: 10 },
  suggestionsHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  suggestionsTitle: { color: palette.ink, fontSize: 18, fontWeight: "900" },
  suggestionsHint: { color: palette.mutedBrown, fontSize: 12, fontWeight: "800" },
  suggestionRow: { gap: 10, paddingRight: 8 },
  suggestionCard: { width: 138, backgroundColor: palette.whitePaper, borderRadius: 8, borderWidth: 1, borderColor: "#E4D9CA", padding: 12, alignItems: "center", gap: 8 },
  suggestionProfile: { alignItems: "center", gap: 5, alignSelf: "stretch" },
  suggestionAvatar: { width: 62, height: 62, borderRadius: 31, backgroundColor: "#E4D9CA", borderWidth: 2, borderColor: palette.softPeach },
  suggestionName: { color: palette.ink, fontWeight: "900", maxWidth: "100%" },
  suggestionUsername: { color: palette.mutedBrown, fontSize: 12, fontWeight: "700", maxWidth: "100%" },
  suggestionButton: { alignSelf: "stretch", minHeight: 36, borderRadius: 18, backgroundColor: palette.sunshine, alignItems: "center", justifyContent: "center" },
  search: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: palette.whitePaper, borderRadius: 24, paddingHorizontal: 14, borderWidth: 1, borderColor: "#E4D9CA" },
  input: { flex: 1, height: 54 },
  title: { color: palette.ink, fontSize: 34, fontWeight: "900" },
  person: { minHeight: 76, backgroundColor: palette.whitePaper, borderRadius: 8, borderWidth: 1, borderColor: "#E4D9CA", padding: 12, flexDirection: "row", alignItems: "center", gap: 12 },
  profileLink: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  initial: { width: 48, height: 48, borderRadius: 24, backgroundColor: palette.softPeach, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#342829" },
  initialText: { color: palette.ink, fontWeight: "900", fontSize: 18 },
  personText: { flex: 1 },
  name: { color: palette.ink, fontWeight: "900", fontSize: 16 },
  username: { color: palette.mutedBrown, fontWeight: "700" },
  followButton: { minHeight: 40, borderRadius: 20, backgroundColor: palette.sunshine, paddingHorizontal: 12, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 6 },
  inviteWide: { minHeight: 44, borderRadius: 22, backgroundColor: palette.sunshine, paddingHorizontal: 14, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8, alignSelf: "flex-start" },
  followButtonMuted: { backgroundColor: "#E4D9CA" },
  followText: { color: palette.ink, fontWeight: "900", fontSize: 12 },
  notice: { color: palette.ink, backgroundColor: "#F8E7B2", borderRadius: 8, padding: 12, fontWeight: "800", lineHeight: 20 },
  empty: { backgroundColor: palette.whitePaper, borderRadius: 8, borderWidth: 1, borderColor: "#E4D9CA", padding: 16, gap: 6 },
  emptyTitle: { color: palette.ink, fontSize: 20, fontWeight: "900" },
  emptyCopy: { color: palette.mutedBrown, lineHeight: 22 }
});
