import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  SessionMode,
  BriefSection,
  GlossaryTerm,
  TranscriptLine,
  getModeColor,
  MOCK_SESSIONS,
} from "@/lib/store";
import { ModeBadge } from "@/components/ModeBadge";
import { Button } from "@/components/Button";
import {
  ArrowLeft,
  Mail,
  Download,
  FileText,
  CheckCircle,
  Sparkles,
} from "lucide-react-native";

const MODE_BRIEF_TEMPLATES: Record<SessionMode, BriefSection[]> = {
  Conference: [
    {
      id: "b1",
      label: "Key Themes",
      content:
        "The session explored the intersection of AI and human cognition, with a focus on how large language models are changing information processing. Signal-to-noise ratio emerged as a central challenge, with RAG architectures positioned as the leading solution.",
    },
    {
      id: "b2",
      label: "Notable Takeaways",
      content:
        "Hallucination remains an open problem but RAG dramatically reduces rates. Agentic paradigms represent the next evolution beyond single query-response loops. Multi-step reasoning chains can autonomously verify information at scale.",
    },
    {
      id: "b3",
      label: "Key Concepts Introduced",
      content:
        "Human cognition, signal-to-noise ratio, large language models, hallucination, retrieval-augmented generation (RAG), agentic paradigm.",
    },
    {
      id: "b4",
      label: "Action Items",
      content:
        "Evaluate RAG frameworks for internal knowledge management. Research agentic workflow tooling. Follow up with speaker on hallucination mitigation benchmarks.",
    },
  ],
  Lecture: [
    {
      id: "b1",
      label: "Core Concepts",
      content:
        "Large language models as intelligent information filters. RAG as the grounding mechanism for factual accuracy. Agentic paradigm enabling autonomous multi-step reasoning.",
    },
    {
      id: "b2",
      label: "Definitions",
      content:
        "Hallucination: AI generating plausible but incorrect information. RAG: Retrieval-Augmented Generation combining search with generation. Agentic: AI systems that autonomously plan and execute tasks.",
    },
    {
      id: "b3",
      label: "Review Questions",
      content:
        "1. Why does RAG reduce hallucination rates? 2. How does the agentic paradigm differ from standard LLM usage? 3. What are the key trade-offs in building agentic systems?",
    },
  ],
  Meeting: [
    {
      id: "b1",
      label: "Decisions Made",
      content:
        "Approved evaluation of RAG frameworks for Q2 implementation. Agreed to establish AI ethics review process before agentic deployment.",
    },
    {
      id: "b2",
      label: "Action Items",
      content:
        "Engineering team: benchmark top 3 RAG frameworks by Feb 1. Product: draft AI integration roadmap. Legal: review hallucination liability implications.",
    },
    {
      id: "b3",
      label: "Owners & Deadlines",
      content:
        "RAG benchmark: Engineering (Feb 1). Roadmap draft: Product (Jan 25). Legal review: Legal team (Feb 15).",
    },
  ],
  Podcast: [
    {
      id: "b1",
      label: "Episode Highlights",
      content:
        "Fascinating discussion on AI as cognitive augmentation tool. Both speakers aligned on RAG as the near-term solution to hallucination. Strong disagreement on timeline for reliable agentic systems.",
    },
    {
      id: "b2",
      label: "Memorable Quotes",
      content:
        '"Large language models are showing real promise — they can serve as intelligent filters." — Speaker 1\n"We need to be careful about hallucination — that\'s still an open research problem." — Speaker 2',
    },
    {
      id: "b3",
      label: "Topics to Explore",
      content:
        "Retrieval-augmented generation frameworks, agentic workflow platforms, AI hallucination benchmarks, cognitive load theory.",
    },
  ],
};

const PROGRESS_STEPS = [
  "Analyzing transcript…",
  "Identifying key concepts…",
  "Structuring brief…",
  "Finalizing output…",
];

export default function BriefScreen() {
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const id = params.id as string;
  const isNew = id === "new";

  // For new sessions, generate brief; for existing, load from mock data
  const existingSession = !isNew ? MOCK_SESSIONS.find((s) => s.id === id) : null;

  const name = existingSession?.name ?? (params.name as string) ?? "Session";
  const mode: SessionMode =
    existingSession?.mode ?? ((params.mode as SessionMode) ?? "Conference");
  const duration =
    existingSession?.duration ?? (params.duration as string) ?? "—";
  const date = existingSession
    ? new Date(existingSession.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });

  const modeColors = getModeColor(mode);
  const briefSections: BriefSection[] =
    existingSession?.brief ?? MODE_BRIEF_TEMPLATES[mode];

  const [loading, setLoading] = useState(isNew);
  const [progressStep, setProgressStep] = useState(0);
  const [showToast, setShowToast] = useState(false);
  const sectionAnims = useRef(briefSections.map(() => new Animated.Value(0))).current;

  // Loading sequence for new sessions
  useEffect(() => {
    if (!isNew) {
      animateSections();
      return;
    }
    let step = 0;
    const advance = () => {
      step++;
      setProgressStep(step);
      if (step < PROGRESS_STEPS.length) {
        setTimeout(advance, 700);
      } else {
        setTimeout(() => {
          setLoading(false);
          animateSections();
        }, 500);
      }
    };
    setTimeout(advance, 700);
  }, []);

  const animateSections = () => {
    briefSections.forEach((_, i) => {
      setTimeout(() => {
        Animated.timing(sectionAnims[i], {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }).start();
      }, i * 100);
    });
  };

  const handleEmail = () => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  if (loading) {
    return (
      <View style={[styles.root, styles.loadingRoot, { paddingTop: insets.top }]}>
        <View style={styles.loadingCard}>
          <View style={styles.loadingIconBox}>
            <Sparkles size={28} color="#7C3AED" />
          </View>
          <Text style={styles.loadingTitle}>Generating your brief…</Text>
          <View style={styles.progressSteps}>
            {PROGRESS_STEPS.map((step, i) => (
              <View key={i} style={styles.progressStep}>
                <View
                  style={[
                    styles.progressDot,
                    i <= progressStep && styles.progressDotActive,
                    i < progressStep && styles.progressDotDone,
                  ]}
                >
                  {i < progressStep && (
                    <CheckCircle size={12} color="#ffffff" />
                  )}
                </View>
                <Text
                  style={[
                    styles.progressStepText,
                    i <= progressStep && styles.progressStepTextActive,
                  ]}
                >
                  {step}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.replace("/(tabs)")}
        >
          <ArrowLeft size={20} color="#2d2540" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Brief
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Session info card */}
        <View style={styles.infoCard}>
          <View style={styles.infoCardTop}>
            <Text style={styles.sessionName}>{name}</Text>
            <ModeBadge mode={mode} />
          </View>
          <View style={styles.infoMeta}>
            <Text style={styles.infoMetaText}>{date}</Text>
            {duration && (
              <>
                <Text style={styles.metaDot}>·</Text>
                <Text style={styles.infoMetaText}>{duration}</Text>
              </>
            )}
          </View>
        </View>

        {/* Brief sections */}
        {briefSections.map((section, i) => (
          <Animated.View
            key={section.id}
            style={[
              styles.sectionCard,
              {
                opacity: sectionAnims[i],
                transform: [
                  {
                    translateY: sectionAnims[i].interpolate({
                      inputRange: [0, 1],
                      outputRange: [12, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <View
              style={[
                styles.sectionLabel,
                { backgroundColor: modeColors.bg },
              ]}
            >
              <Text
                style={[styles.sectionLabelText, { color: modeColors.text }]}
              >
                {section.label}
              </Text>
            </View>
            <Text style={styles.sectionContent}>{section.content}</Text>
          </Animated.View>
        ))}

        {/* Action bar */}
        <View style={styles.actionBar}>
          <Button
            label="Email Brief"
            variant="primary"
            size="md"
            onPress={handleEmail}
            style={styles.actionBtn}
          />
          <Button
            label="Export PDF"
            variant="ghost"
            size="md"
            onPress={() => {}}
            style={styles.actionBtn}
          />
        </View>

        <TouchableOpacity
          style={styles.transcriptLink}
          onPress={() =>
            router.push({
              pathname: "/session/[id]",
              params: { id: existingSession?.id ?? "1" },
            })
          }
        >
          <FileText size={16} color="#7C3AED" />
          <Text style={styles.transcriptLinkText}>View Full Transcript</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Toast */}
      {showToast && (
        <View style={styles.toast}>
          <CheckCircle size={16} color="#10b981" />
          <Text style={styles.toastText}>Brief sent to your email!</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#faf8ff" },
  loadingRoot: {
    alignItems: "center",
    justifyContent: "center",
  },
  loadingCard: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    marginHorizontal: 32,
    shadowColor: "rgba(100,80,140,1)",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 32,
    elevation: 10,
    borderWidth: 1,
    borderColor: "rgba(45,37,64,0.06)",
    width: "80%",
  },
  loadingIconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(124,58,237,0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  loadingTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2d2540",
    marginBottom: 24,
  },
  progressSteps: { width: "100%", gap: 12 },
  progressStep: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  progressDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(45,37,64,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  progressDotActive: {
    backgroundColor: "rgba(124,58,237,0.2)",
  },
  progressDotDone: {
    backgroundColor: "#7C3AED",
  },
  progressStepText: {
    fontSize: 14,
    color: "#9ca3af",
  },
  progressStepTextActive: {
    color: "#2d2540",
    fontWeight: "500",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(45,37,64,0.07)",
    backgroundColor: "#ffffff",
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#2d2540",
  },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 60 },
  infoCard: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 20,
    marginBottom: 16,
    shadowColor: "rgba(100,80,140,1)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 1,
    borderColor: "rgba(45,37,64,0.06)",
  },
  infoCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  sessionName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2d2540",
    flex: 1,
    marginRight: 12,
  },
  infoMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  infoMetaText: {
    fontSize: 13,
    color: "#6b7280",
    fontWeight: "500",
  },
  metaDot: { color: "#d1d5db", fontSize: 13 },
  sectionCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    shadowColor: "rgba(100,80,140,1)",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: "rgba(45,37,64,0.06)",
  },
  sectionLabel: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 12,
  },
  sectionLabelText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  sectionContent: {
    fontSize: 14,
    color: "#2d2540",
    lineHeight: 22,
  },
  actionBar: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
    marginBottom: 16,
  },
  actionBtn: {
    flex: 1,
  },
  transcriptLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
  },
  transcriptLinkText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#7C3AED",
  },
  toast: {
    position: "absolute",
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: "#2d2540",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 12,
  },
  toastText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ffffff",
  },
});
