import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { SessionMode, getModeColor } from "@/lib/store";

interface ModeBadgeProps {
  mode: SessionMode;
  size?: "sm" | "md";
}

export function ModeBadge({ mode, size = "md" }: ModeBadgeProps) {
  const colors = getModeColor(mode);
  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: colors.bg, borderColor: colors.border },
        size === "sm" && styles.badgeSm,
      ]}
    >
      <Text
        style={[
          styles.badgeText,
          { color: colors.text },
          size === "sm" && styles.badgeTextSm,
        ]}
      >
        {mode}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 0,
    alignSelf: "flex-start",
  },
  badgeSm: {
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.4,
  },
  badgeTextSm: {
    fontSize: 10,
  },
});
