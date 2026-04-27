import React, { useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  StyleSheet,
  Animated,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { SessionMode, getModeColor } from "@/lib/store";
import { Button } from "@/components/Button";
import {
  Users,
  BookOpen,
  MessageSquare,
  Mic,
  X,
} from "lucide-react-native";

interface CreateBitacoraModalProps {
  visible: boolean;
  onClose: () => void;
  onStart: (data: {
    name: string;
    mode: SessionMode;
    context: string;
  }) => void;
}

const MODES: {
  mode: SessionMode;
  description: string;
  Icon: React.ComponentType<any>;
}[] = [
  {
    mode: "Conference",
    description: "Panels, talks & keynotes",
    Icon: Users,
  },
  {
    mode: "Lecture",
    description: "Classes & educational sessions",
    Icon: BookOpen,
  },
  {
    mode: "Meeting",
    description: "Team discussions & standups",
    Icon: MessageSquare,
  },
  {
    mode: "Podcast",
    description: "Interviews & conversations",
    Icon: Mic,
  },
];

export function CreateBitacoraModal({
  visible,
  onClose,
  onStart,
}: CreateBitacoraModalProps) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [mode, setMode] = useState<SessionMode | null>(null);
  const [context, setContext] = useState("");

  const reset = () => {
    setStep(1);
    setName("");
    setMode(null);
    setContext("");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleStart = () => {
    if (!name.trim() || !mode) return;
    onStart({ name: name.trim(), mode, context });
    reset();
  };

  const canNext =
    step === 1 ? name.trim().length > 0 : step === 2 ? mode !== null : true;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.overlay}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleClose}
        />
        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {step === 1
                ? "Name your session"
                : step === 2
                ? "Choose a mode"
                : "Add context"}
            </Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <X size={20} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {/* Steps */}
          {step === 1 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepLabel}>SESSION NAME</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. AI Summit Keynote"
                placeholderTextColor="#9ca3af"
                value={name}
                onChangeText={setName}
                autoFocus
                returnKeyType="next"
                onSubmitEditing={() => canNext && setStep(2)}
              />
            </View>
          )}

          {step === 2 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepLabel}>SELECT MODE</Text>
              <View style={styles.modesGrid}>
                {MODES.map(({ mode: m, description, Icon }) => {
                  const colors = getModeColor(m);
                  const selected = mode === m;
                  return (
                    <TouchableOpacity
                      key={m}
                      onPress={() => setMode(m)}
                      style={[
                        styles.modeCard,
                        selected && {
                          borderColor: colors.border,
                          backgroundColor: colors.bg,
                        },
                      ]}
                      activeOpacity={0.8}
                    >
                      <View
                        style={[
                          styles.modeIconBox,
                          selected && { backgroundColor: colors.bg },
                        ]}
                      >
                        <Icon
                          size={22}
                          color={selected ? colors.text : "#6b7280"}
                        />
                      </View>
                      <Text
                        style={[
                          styles.modeName,
                          selected && { color: colors.text },
                        ]}
                      >
                        {m}
                      </Text>
                      <Text style={styles.modeDesc}>{description}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {step === 3 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepLabel}>YOUR CONTEXT</Text>
              <Text style={styles.optionalHint}>Optional — helps AI personalize your brief</Text>
              <TextInput
                style={[styles.input, styles.textarea]}
                placeholder="e.g. Product manager focused on AI tooling and automation workflows..."
                placeholderTextColor="#9ca3af"
                value={context}
                onChangeText={setContext}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          )}

          {/* Progress dots */}
          <View style={styles.dots}>
            {[1, 2, 3].map((s) => (
              <View
                key={s}
                style={[styles.dot, step >= s && styles.dotActive]}
              />
            ))}
          </View>

          {/* Actions */}
          <View style={styles.modalActions}>
            {step > 1 && (
              <Button
                label="Back"
                variant="ghost"
                onPress={() => setStep(step - 1)}
                style={styles.actionBtn}
              />
            )}
            {step < 3 ? (
              <Button
                label="Next"
                variant="primary"
                onPress={() => setStep(step + 1)}
                disabled={!canNext}
                style={[styles.actionBtn, styles.actionBtnFlex]}
              />
            ) : (
              <Button
                label="Start Session"
                variant="primary"
                onPress={handleStart}
                disabled={!name.trim() || !mode}
                style={[styles.actionBtn, styles.actionBtnFlex]}
              />
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "transparent",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(45,37,64,0.5)",
  },
  modal: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 20,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#2d2540",
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },
  stepContent: {
    marginBottom: 20,
  },
  stepLabel: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.8,
    color: "#6b7280",
    marginBottom: 10,
    textTransform: "uppercase",
  },
  optionalHint: {
    fontSize: 13,
    color: "#9ca3af",
    marginBottom: 10,
    marginTop: -6,
  },
  input: {
    backgroundColor: "#faf8ff",
    borderWidth: 1.5,
    borderColor: "rgba(45,37,64,0.12)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: "#2d2540",
  },
  textarea: {
    height: 120,
    paddingTop: 14,
  },
  modesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  modeCard: {
    width: "47%",
    backgroundColor: "#faf8ff",
    borderWidth: 1.5,
    borderColor: "rgba(45,37,64,0.1)",
    borderRadius: 14,
    padding: 14,
  },
  modeIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  modeName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#2d2540",
    marginBottom: 3,
  },
  modeDesc: {
    fontSize: 12,
    color: "#6b7280",
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(45,37,64,0.1)",
  },
  dotActive: {
    backgroundColor: "#7C3AED",
    width: 20,
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
  },
  actionBtn: {
    flex: 0,
    minWidth: 90,
  },
  actionBtnFlex: {
    flex: 1,
  },
});
