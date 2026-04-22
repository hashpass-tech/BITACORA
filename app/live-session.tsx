import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SessionMode, GlossaryTerm, TranscriptLine, getModeColor } from "@/lib/store";
import { ModeBadge } from "@/components/ModeBadge";
import { Button } from "@/components/Button";
import { Square, Mic } from "lucide-react-native";

// Simulated transcript lines for demo
const DEMO_CHUNKS = [
  {
    speaker: "Speaker 1",
    text: "Welcome everyone to today's session. We're going to explore some fascinating territory at the intersection of technology and human cognition.",
    terms: [{ term: "human cognition", def: "The mental processes involved in gaining knowledge and comprehension." }],
  },
  {
    speaker: "Speaker 2",
    text: "That's a great framing. I think the key challenge we face is the signal-to-noise ratio in modern information environments.",
    terms: [{ term: "signal-to-noise ratio", def: "A measure comparing the level of desired signal to background noise." }],
  },
  {
    speaker: "Speaker 1",
    text: "Exactly. And this is where large language models are showing real promise — they can serve as intelligent filters that surface the most contextually relevant information.",
    terms: [{ term: "large language models", def: "AI systems trained on vast text datasets capable of generating human-like text." }],
  },
  {
    speaker: "Speaker 2",
    text: "Though we need to be careful about hallucination — that's still an open research problem that could undermine trust in AI-synthesized outputs.",
    terms: [{ term: "hallucination", def: "When AI generates plausible-sounding but factually incorrect information." }],
  },
  {
    speaker: "Speaker 1",
    text: "True. Retrieval-augmented generation has been the leading approach to grounding model outputs in factual sources. RAG dramatically reduces hallucination rates.",
    terms: [{ term: "RAG", def: "Retrieval-Augmented Generation — combining document retrieval with generative AI." }],
  },
  {
    speaker: "Speaker 2",
    text: "The agentic paradigm takes this further — rather than a single query-response loop, we're seeing multi-step reasoning chains that can autonomously verify information.",
    terms: [{ term: "agentic paradigm", def: "AI systems that autonomously plan and execute multi-step tasks." }],
  },
];

function padTime(n: number) {
  return String(n).padStart(2, "0");
}

function formatElapsed(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${padTime(m)}:${padTime(s)}`;
}

function fmtTimestamp(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${padTime(m)}:${padTime(s)}`;
}

export default function LiveSessionScreen() {
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const name = (params.name as string) || "New Session";
  const mode = (params.mode as SessionMode) || "Conference";
  const modeColors = getModeColor(mode);

  const [elapsed, setElapsed] = useState(0);
  const [transcript, setTranscript] = useState<TranscriptLine[]>([]);
  const [glossary, setGlossary] = useState<GlossaryTerm[]>([]);
  const [chunkIndex, setChunkIndex] = useState(0);
  const [processing, setProcessing] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scrollRef = useRef<ScrollView>(null);
  const sessionSeconds = useRef(0);

  // Timer
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed((e) => e + 1);
      sessionSeconds.current += 1;
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Recording pulse
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.4,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 750,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  // Simulate transcript chunk arrival
  useEffect(() => {
    if (chunkIndex >= DEMO_CHUNKS.length) return;

    const delay = chunkIndex === 0 ? 2000 : 4500;
    const timer = setTimeout(() => {
      const chunk = DEMO_CHUNKS[chunkIndex];
      const newLine: TranscriptLine = {
        id: `t-${chunkIndex}`,
        timestamp: fmtTimestamp(sessionSeconds.current),
        speaker: chunk.speaker,
        text: chunk.text,
        highlightedTerms: chunk.terms.map((t) => t.term),
      };
      setTranscript((prev) => [...prev, newLine]);

      // Add glossary terms
      chunk.terms.forEach((t) => {
        const newTerm: GlossaryTerm = {
          id: `g-${chunkIndex}-${t.term}`,
          term: t.term,
          definition: t.def,
          timestamp: fmtTimestamp(sessionSeconds.current),
        };
        setGlossary((prev) => {
          if (prev.some((g) => g.term === t.term)) return prev;
          return [...prev, newTerm];
        });
      });

      setChunkIndex((i) => i + 1);
      scrollRef.current?.scrollToEnd({ animated: true });
    }, delay);

    return () => clearTimeout(timer);
  }, [chunkIndex]);

  const handleEnd = () => {
    router.replace({
      pathname: "/brief/[id]",
      params: {
        id: "new",
        name,
        mode,
        duration: `${Math.floor(elapsed / 60)} min`,
        transcriptJson: JSON.stringify(transcript),
        glossaryJson: JSON.stringify(glossary),
      },
    });
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <View style={styles.recordDotContainer}>
            <Animated.View
              style={[styles.recordDotPulse, { transform: [{ scale: pulseAnim }] }]}
            />
            <View style={styles.recordDot} />
          </View>
          <View>
            <Text style={styles.sessionName} numberOfLines={1}>
              {name}
            </Text>
            <View style={styles.timerRow}>
              <Text style={styles.timer}>{formatElapsed(elapsed)}</Text>
            </View>
          </View>
        </View>
        <View style={styles.topBarRight}>
          <ModeBadge mode={mode} size="sm" />
          <Button
            label="End"
            variant="destructive"
            size="sm"
            onPress={handleEnd}
          />
        </View>
      </View>

      {/* Main content */}
      <View style={styles.main}>
        {/* Transcript */}
        <View style={styles.transcriptPanel}>
          <Text style={styles.panelLabel}>TRANSCRIPT</Text>
          <ScrollView
            ref={scrollRef}
            style={styles.transcriptScroll}
            contentContainerStyle={styles.transcriptContent}
            showsVerticalScrollIndicator={false}
          >
            {transcript.length === 0 ? (
              <View style={styles.waitingState}>
                <View style={styles.waitingIcon}>
                  <Mic size={24} color="#7C3AED" />
                </View>
                <Text style={styles.waitingText}>
                  Listening and researching…
                </Text>
                <Text style={styles.waitingSubtext}>
                  Claims will be verified in real-time.
                </Text>
              </View>
            ) : (
              transcript.map((line) => (
                <TranscriptLineView key={line.id} line={line} modeColor={modeColors.text} />
              ))
            )}
          </ScrollView>
        </View>

        {/* Glossary sidebar */}
        <View style={styles.glossaryPanel}>
          <Text style={styles.panelLabel}>CONCEPTS</Text>
          <ScrollView
            style={styles.glossaryScroll}
            contentContainerStyle={styles.glossaryContent}
            showsVerticalScrollIndicator={false}
          >
            {glossary.length === 0 ? (
              <Text style={styles.glossaryEmpty}>Terms detected will appear here</Text>
            ) : (
              glossary.map((term) => (
                <GlossaryCard key={term.id} term={term} accentColor={modeColors.text} />
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </View>
  );
}

function TranscriptLineView({
  line,
  modeColor,
}: {
  line: TranscriptLine;
  modeColor: string;
}) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.transcriptLine,
        { opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }] },
      ]}
    >
      <View style={styles.transcriptMeta}>
        <Text style={styles.transcriptTimestamp}>{line.timestamp}</Text>
        <Text style={styles.transcriptSpeaker}>{line.speaker}</Text>
      </View>
      <Text style={styles.transcriptText}>{line.text}</Text>
    </Animated.View>
  );
}

function GlossaryCard({
  term,
  accentColor,
}: {
  term: GlossaryTerm;
  accentColor: string;
}) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(anim, {
      toValue: 1,
      damping: 15,
      stiffness: 150,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.glossaryCard,
        {
          opacity: anim,
          transform: [
            { scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.93, 1] }) },
            { translateX: anim.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) },
          ],
        },
      ]}
    >
      <View style={[styles.glossaryCardAccent, { backgroundColor: accentColor }]} />
      <Text style={[styles.glossaryTerm, { color: accentColor }]}>{term.term}</Text>
      <Text style={styles.glossaryDef}>{term.definition}</Text>
      <Text style={styles.glossaryTimestamp}>{term.timestamp}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#faf8ff" },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(45,37,64,0.08)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  topBarLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  recordDotContainer: {
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  recordDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#ef4444",
    position: "absolute",
  },
  recordDotPulse: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "rgba(239,68,68,0.25)",
  },
  sessionName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#2d2540",
    maxWidth: 160,
  },
  timerRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 1 },
  timer: { fontSize: 12, color: "#6b7280", fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace" },
  topBarRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  main: {
    flex: 1,
    flexDirection: "row",
  },
  transcriptPanel: {
    flex: 7,
    borderRightWidth: 1,
    borderRightColor: "rgba(45,37,64,0.07)",
    backgroundColor: "#fdfcff",
  },
  glossaryPanel: {
    flex: 3,
    backgroundColor: "#faf8ff",
  },
  panelLabel: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.8,
    color: "#9ca3af",
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(45,37,64,0.06)",
    textTransform: "uppercase",
  },
  transcriptScroll: { flex: 1 },
  transcriptContent: { padding: 14, paddingBottom: 40 },
  transcriptLine: {
    marginBottom: 16,
  },
  transcriptMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  transcriptTimestamp: {
    fontSize: 11,
    color: "#9ca3af",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  transcriptSpeaker: {
    fontSize: 11,
    fontWeight: "600",
    color: "#7C3AED",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  transcriptText: {
    fontSize: 13,
    color: "#2d2540",
    lineHeight: 20,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  waitingState: {
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  waitingIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(124,58,237,0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  waitingText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2d2540",
    marginBottom: 6,
    textAlign: "center",
  },
  waitingSubtext: {
    fontSize: 12,
    color: "#9ca3af",
    textAlign: "center",
    lineHeight: 18,
  },
  glossaryScroll: { flex: 1 },
  glossaryContent: { padding: 10, paddingBottom: 40 },
  glossaryEmpty: {
    fontSize: 11,
    color: "#d1d5db",
    textAlign: "center",
    paddingTop: 20,
    paddingHorizontal: 8,
    lineHeight: 16,
  },
  glossaryCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    shadowColor: "rgba(100,80,140,1)",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: "rgba(45,37,64,0.06)",
    overflow: "hidden",
  },
  glossaryCardAccent: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    width: 3,
  },
  glossaryTerm: {
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 4,
    marginLeft: 6,
  },
  glossaryDef: {
    fontSize: 11,
    color: "#6b7280",
    lineHeight: 15,
    marginLeft: 6,
    marginBottom: 4,
  },
  glossaryTimestamp: {
    fontSize: 10,
    color: "#d1d5db",
    marginLeft: 6,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
});
