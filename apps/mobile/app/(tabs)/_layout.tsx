import { Tabs } from "expo-router";
import { View, StyleSheet, Text } from "react-native";
import { Home, Brain, User, Mic, FileText, Users, Zap, Network, Wifi } from "lucide-react-native";
import { useNetworkStatus } from "../../lib/useNetworkStatus";

const DARK_BG = "#0A1628";
const DARK_TAB_BG = "#0F172A";
const TEXT_PRIMARY = "#E5E7EB";
const ACCENT = "#7C3AED";
const ACCENT_INACTIVE = "#9CA3AF";
const OFFLINE_COLOR = "#EF4444";

export default function TabLayout() {
  const networkStatus = useNetworkStatus();

  return (
    <View style={styles.container}>
      {/* Offline indicator */}
      {!networkStatus.isOnline && (
        <View style={styles.offlineIndicator}>
          <Wifi size={14} color={OFFLINE_COLOR} />
          <Text style={styles.offlineText}>Offline Mode</Text>
        </View>
      )}

      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: styles.tabBar,
          tabBarActiveTintColor: ACCENT,
          tabBarInactiveTintColor: ACCENT_INACTIVE,
          tabBarLabelStyle: styles.tabLabel,
          tabBarShowLabel: true,
          tabBarHideOnKeyboard: true,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color, size }) => (
              <Home size={size} color={color} strokeWidth={2} />
            ),
          }}
        />
        <Tabs.Screen
          name="record"
          options={{
            title: "Record",
            tabBarIcon: ({ color, focused }) => (
              <View
                style={[
                  styles.recordBtn,
                  focused && styles.recordBtnActive,
                ]}
              >
                <Mic
                  size={22}
                  color={focused ? "#ffffff" : "#7C3AED"}
                  strokeWidth={2}
                />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="memos"
          options={{
            title: "Memos",
            tabBarIcon: ({ color, size }) => (
              <FileText size={size} color={color} strokeWidth={2} />
            ),
          }}
        />
        <Tabs.Screen
          name="memory"
          options={{
            title: "Memory",
            tabBarIcon: ({ color, size }) => (
              <Brain size={size} color={color} strokeWidth={2} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ color, size }) => (
              <User size={size} color={color} strokeWidth={2} />
            ),
          }}
        />
        <Tabs.Screen
          name="peers"
          options={{
            title: "Peers",
            tabBarIcon: ({ color, size }) => (
              <Users size={size} color={color} strokeWidth={2} />
            ),
          }}
        />
        <Tabs.Screen
          name="sync"
          options={{
            title: "Sync",
            tabBarIcon: ({ color, size }) => (
              <Zap size={size} color={color} strokeWidth={2} />
            ),
          }}
        />
        <Tabs.Screen
          name="graph"
          options={{
            title: "Graph",
            tabBarIcon: ({ color, size }) => (
              <Network size={size} color={color} strokeWidth={2} />
            ),
          }}
        />
        <Tabs.Screen
          name="ai"
          options={{
            title: "AI",
            tabBarIcon: ({ color, size }) => (
              <Brain size={size} color={color} strokeWidth={2} />
            ),
          }}
        />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  offlineIndicator: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(239, 68, 68, 0.3)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    justifyContent: "center",
  },
  offlineText: {
    fontSize: 12,
    fontWeight: "600",
    color: OFFLINE_COLOR,
  },
  tabBar: {
    backgroundColor: DARK_TAB_BG,
    borderTopColor: "rgba(229, 231, 235, 0.1)",
    borderTopWidth: 1,
    paddingTop: 6,
    paddingBottom: 8,
    height: 70,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 10,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },
  recordBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(124,58,237,0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: -8,
    borderWidth: 1.5,
    borderColor: "rgba(124,58,237,0.3)",
  },
  recordBtnActive: {
    backgroundColor: "#7C3AED",
    borderColor: "#7C3AED",
  },
});
