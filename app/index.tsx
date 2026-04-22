import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
} from "react-native";
import { router } from "expo-router";
import { Button } from "@/components/Button";
import { Mic, Mail } from "lucide-react-native";

const { width, height } = Dimensions.get("window");

export default function AuthScreen() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const handleContinue = () => {
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    setError("");
    router.replace("/(tabs)");
  };

  const handleGoogle = () => {
    router.replace("/(tabs)");
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.root}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Background glow */}
        <View style={styles.bgGlow} pointerEvents="none" />

        {/* Logo */}
        <View style={styles.logoRow}>
          <View style={styles.logoIconBox}>
            <Mic size={20} color="#7C3AED" />
          </View>
          <Text style={styles.logoText}>Bitácora</Text>
        </View>

        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>Open-Source AI Logbook</Text>
          </View>
          <Text style={styles.heroTitle}>
            Every session,{"\n"}remembered.
          </Text>
          <Text style={styles.heroDesc}>
            Transform any spoken session into structured, searchable memory.
            Your second brain for conferences, lectures, and meetings.
          </Text>
        </View>

        {/* Form Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Get started</Text>
          <Text style={styles.cardDesc}>Enter your email to continue</Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>EMAIL</Text>
            <View style={styles.inputRow}>
              <Mail size={16} color="#9ca3af" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor="#9ca3af"
                value={email}
                onChangeText={(t) => {
                  setEmail(t);
                  if (error) setError("");
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="go"
                onSubmitEditing={handleContinue}
              />
            </View>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </View>

          <Button
            label="Continue with Email"
            variant="primary"
            size="lg"
            fullWidth
            onPress={handleContinue}
            style={styles.primaryBtn}
          />

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <Button
            label="Continue with Google"
            variant="ghost"
            size="lg"
            fullWidth
            onPress={handleGoogle}
          />
        </View>

        <Text style={styles.terms}>
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#faf8ff",
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
    alignItems: "center",
  },
  bgGlow: {
    position: "absolute",
    top: -100,
    left: "50%",
    transform: [{ translateX: -200 }],
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: "rgba(124,58,237,0.06)",
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 40,
    alignSelf: "flex-start",
  },
  logoIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(124,58,237,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    fontSize: 22,
    fontWeight: "700",
    color: "#7C3AED",
    letterSpacing: -0.5,
  },
  hero: {
    alignSelf: "stretch",
    marginBottom: 32,
  },
  heroBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(124,58,237,0.08)",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 16,
  },
  heroBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#7C3AED",
    letterSpacing: 0.3,
  },
  heroTitle: {
    fontSize: 42,
    fontWeight: "800",
    color: "#2d2540",
    lineHeight: 48,
    letterSpacing: -1,
    marginBottom: 14,
  },
  heroDesc: {
    fontSize: 15,
    color: "#6b7280",
    lineHeight: 24,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 24,
    alignSelf: "stretch",
    shadowColor: "rgba(100,80,140,1)",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 32,
    elevation: 8,
    borderWidth: 1,
    borderColor: "rgba(45,37,64,0.06)",
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#2d2540",
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 20,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.8,
    color: "#6b7280",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#faf8ff",
    borderWidth: 1.5,
    borderColor: "rgba(45,37,64,0.12)",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 0,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#2d2540",
    paddingVertical: 13,
  },
  errorText: {
    fontSize: 12,
    color: "#ef4444",
    marginTop: 6,
  },
  primaryBtn: {
    marginBottom: 16,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(45,37,64,0.08)",
  },
  dividerText: {
    fontSize: 13,
    color: "#9ca3af",
  },
  terms: {
    fontSize: 12,
    color: "#9ca3af",
    textAlign: "center",
    marginTop: 20,
    lineHeight: 18,
  },
});

