import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  User,
  Settings,
  Bell,
  Shield,
  HelpCircle,
  LogOut,
  ChevronRight,
  Mic,
} from "lucide-react-native";

const MENU_ITEMS = [
  { icon: Settings, label: "Preferences", sub: "App settings and display" },
  { icon: Bell, label: "Notifications", sub: "Email and push alerts" },
  { icon: Shield, label: "Privacy", sub: "Data and permissions" },
  { icon: HelpCircle, label: "Help & Support", sub: "Docs and contact" },
];

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <User size={28} color="#7C3AED" />
          </View>
          <Text style={styles.profileName}>Bitácora User</Text>
          <Text style={styles.profileEmail}>user@example.com</Text>
          <View style={styles.profileBadge}>
            <Mic size={12} color="#7C3AED" />
            <Text style={styles.profileBadgeText}>3 sessions captured</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {[
            { label: "Sessions", value: "3" },
            { label: "Concepts", value: "5" },
            { label: "Briefs", value: "3" },
          ].map((stat) => (
            <View key={stat.label} style={styles.statItem}>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Menu */}
        <View style={styles.menuCard}>
          {MENU_ITEMS.map(({ icon: Icon, label, sub }, i) => (
            <TouchableOpacity
              key={label}
              style={[
                styles.menuItem,
                i < MENU_ITEMS.length - 1 && styles.menuItemBorder,
              ]}
              activeOpacity={0.8}
            >
              <View style={styles.menuIconBox}>
                <Icon size={18} color="#7C3AED" />
              </View>
              <View style={styles.menuText}>
                <Text style={styles.menuLabel}>{label}</Text>
                <Text style={styles.menuSub}>{sub}</Text>
              </View>
              <ChevronRight size={16} color="#d1d5db" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Sign out */}
        <TouchableOpacity
          style={styles.signOutBtn}
          onPress={() => router.replace("/")}
          activeOpacity={0.85}
        >
          <LogOut size={18} color="#ef4444" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Bitácora v1.0.0 · Hackathon MVP</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#faf8ff" },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(45,37,64,0.07)",
  },
  headerTitle: { fontSize: 28, fontWeight: "700", color: "#2d2540" },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 80 },
  profileCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "rgba(100,80,140,1)",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
    borderWidth: 1,
    borderColor: "rgba(45,37,64,0.06)",
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(124,58,237,0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    borderWidth: 2,
    borderColor: "rgba(124,58,237,0.2)",
  },
  profileName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#2d2540",
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 12,
  },
  profileBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(124,58,237,0.07)",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  profileBadgeText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#7C3AED",
  },
  statsRow: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    marginBottom: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(45,37,64,0.06)",
  },
  statItem: {
    flex: 1,
    paddingVertical: 18,
    alignItems: "center",
    borderRightWidth: 1,
    borderRightColor: "rgba(45,37,64,0.07)",
  },
  statValue: {
    fontSize: 22,
    fontWeight: "700",
    color: "#7C3AED",
    marginBottom: 3,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "500",
    color: "#9ca3af",
    letterSpacing: 0.3,
  },
  menuCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(45,37,64,0.06)",
    shadowColor: "rgba(100,80,140,1)",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(45,37,64,0.06)",
  },
  menuIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(124,58,237,0.07)",
    alignItems: "center",
    justifyContent: "center",
  },
  menuText: { flex: 1 },
  menuLabel: { fontSize: 15, fontWeight: "600", color: "#2d2540" },
  menuSub: { fontSize: 12, color: "#9ca3af", marginTop: 2 },
  signOutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#ffffff",
    borderRadius: 14,
    paddingVertical: 16,
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: "rgba(239,68,68,0.2)",
  },
  signOutText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#ef4444",
  },
  version: {
    fontSize: 12,
    color: "#d1d5db",
    textAlign: "center",
  },
});
