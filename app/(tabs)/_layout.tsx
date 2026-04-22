import { Tabs } from "expo-router";
import { View, StyleSheet } from "react-native";
import { Home, Brain, User, Mic } from "lucide-react-native";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: "#7C3AED",
        tabBarInactiveTintColor: "#9ca3af",
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
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: "#ffffff",
    borderTopColor: "rgba(45,37,64,0.08)",
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
