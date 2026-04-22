import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from "react-native";

interface ButtonProps {
  onPress?: () => void;
  label: string;
  variant?: "primary" | "secondary" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg";
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
}

export function Button({
  onPress,
  label,
  variant = "primary",
  size = "md",
  style,
  textStyle,
  loading,
  disabled,
  fullWidth,
}: ButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
      style={[
        styles.base,
        styles[variant],
        styles[`size_${size}`],
        fullWidth && styles.fullWidth,
        (disabled || loading) && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === "primary" ? "#fff" : "#7C3AED"}
        />
      ) : (
        <Text
          style={[
            styles.text,
            styles[`text_${variant}`],
            styles[`textSize_${size}`],
            textStyle,
          ]}
        >
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  primary: {
    backgroundColor: "#7C3AED",
    borderColor: "#7C3AED",
  },
  secondary: {
    backgroundColor: "rgba(124,58,237,0.08)",
    borderColor: "rgba(124,58,237,0.2)",
  },
  ghost: {
    backgroundColor: "transparent",
    borderColor: "rgba(45,37,64,0.15)",
  },
  destructive: {
    backgroundColor: "transparent",
    borderColor: "#ef4444",
  },
  size_sm: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  size_md: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  size_lg: {
    paddingHorizontal: 28,
    paddingVertical: 16,
  },
  fullWidth: {
    width: "100%",
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  text_primary: {
    color: "#ffffff",
  },
  text_secondary: {
    color: "#7C3AED",
  },
  text_ghost: {
    color: "#2d2540",
  },
  text_destructive: {
    color: "#ef4444",
  },
  textSize_sm: {
    fontSize: 13,
  },
  textSize_md: {
    fontSize: 15,
  },
  textSize_lg: {
    fontSize: 16,
  },
});
