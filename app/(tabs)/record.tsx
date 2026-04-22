import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CreateBitacoraModal } from "@/components/CreateBitacoraModal";
import { Mic, Radio } from "lucide-react-native";

export default function RecordScreen() {
  const insets = useSafeAreaInsets();
  const [showCreate, setShowCreate] = useState(false);

  const handleStart = ({
    name,
    mode,
    context,
  }: {
    name: string;
    mode: any;
    context: string;
  }) => {
    setShowCreate(false);
    router.push({
      pathname: "/live-session",
      params: { name, mode, context },
    });
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Record</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.pulseRing}>
          <View style={styles.pulseRing2}>
            <TouchableOpacity
              style={styles.micBtn}
              onPress={() => setShowCreate(true)}
              activeOpacity={0.85}
            >
              <Mic size={40} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.title}>Start a new session</Text>
        <Text style={styles.desc}>
          Tap the microphone to begin capturing any session. AI will transcribe, identify concepts, and generate a brief automatically.
        </Text>
        <TouchableOpacity
          style={styles.startBtn}
          onPress={() => setShowCreate(true)}
          activeOpacity={0.85}
        >
          <Radio size={18} color="#ffffff" />
          <Text style={styles.startBtnText}>New Bitácora</Text>
        </TouchableOpacity>
      </View>

      <CreateBitacoraModal
        visible={showCreate}
        onClose={() => setShowCreate(false)}
        onStart={handleStart}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#faf8ff",
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(45,37,64,0.07)",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#2d2540",
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  pulseRing: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "rgba(124,58,237,0.06)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 32,
  },
  pulseRing2: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: "rgba(124,58,237,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  micBtn: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#7C3AED",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#2d2540",
    marginBottom: 12,
    textAlign: "center",
  },
  desc: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 28,
  },
  startBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#7C3AED",
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  startBtnText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
});
