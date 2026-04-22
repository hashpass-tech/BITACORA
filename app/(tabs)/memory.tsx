import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MOCK_SESSIONS, formatDate } from "@/lib/store";
import { ModeBadge } from "@/components/ModeBadge";
import { Search, Brain, ChevronDown, ChevronUp, Clock } from "lucide-react-native";

const SUGGESTED_QUERIES = [
  "What were the key AI trends discussed?",
  "Summarize all meeting decisions",
  "What concepts appeared across sessions?",
  "Find mentions of automation",
];

interface SearchResult {
  id: string;
  query: string;
  answer: string;
  sources: {
    sessionId: string;
    sessionName: string;
    mode: any;
    date: string;
    timestamp: string;
    excerpt: string;
  }[];
}

function simulateSearch(query: string): Promise<SearchResult> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        id: Date.now().toString(),
        query,
        answer: `Based on your recorded sessions, here's a synthesized answer to "${query}":\n\nAcross the AI & Future of Work panel and Distributed Systems lecture, several key themes emerged. Large language models are rapidly transitioning from conversational tools to active workflow participants. The AI panel emphasized that agentic workflows create entirely new categories of work — not just automating existing tasks. The distributed systems lecture provided important context: just as CP vs AP trade-offs require deliberate architectural choices, AI integration requires deliberate organizational choices about where autonomy is appropriate versus where human oversight is critical.`,
        sources: [
          {
            sessionId: "1",
            sessionName: "AI & The Future of Work Panel",
            mode: "Conference",
            date: "Jan 15, 2025",
            timestamp: "00:02:14",
            excerpt:
              "The convergence of large language models and traditional enterprise software is creating unprecedented opportunities for automation.",
          },
          {
            sessionId: "1",
            sessionName: "AI & The Future of Work Panel",
            mode: "Conference",
            date: "Jan 15, 2025",
            timestamp: "00:08:15",
            excerpt:
              "Agentic workflows don't just automate tasks — they create entirely new categories of work.",
          },
          {
            sessionId: "2",
            sessionName: "Distributed Systems Lecture",
            mode: "Lecture",
            date: "Jan 12, 2025",
            timestamp: "00:05:10",
            excerpt:
              "The CAP theorem states that a distributed system can only guarantee two of three properties.",
          },
        ],
      });
    }, 2200);
  });
}

export default function MemoryScreen() {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [expandedSources, setExpandedSources] = useState(false);

  const hasSessions = MOCK_SESSIONS.length > 0;

  const handleSearch = async (q?: string) => {
    const searchQuery = q ?? query;
    if (!searchQuery.trim()) return;
    setQuery(searchQuery);
    setLoading(true);
    setResult(null);
    try {
      const res = await simulateSearch(searchQuery);
      setResult(res);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Brain size={20} color="#7C3AED" />
        </View>
        <View>
          <Text style={styles.headerTitle}>Memory</Text>
          <Text style={styles.headerSub}>Search across all sessions</Text>
        </View>
      </View>

      {/* Search bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={18} color="#9ca3af" />
          <TextInput
            style={styles.searchInput}
            placeholder="Ask anything across your sessions…"
            placeholderTextColor="#9ca3af"
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            onSubmitEditing={() => handleSearch()}
          />
          {query.length > 0 && (
            <TouchableOpacity
              onPress={() => handleSearch()}
              style={styles.searchBtn}
              activeOpacity={0.85}
            >
              <Text style={styles.searchBtnText}>Ask</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {!hasSessions ? (
          <EmptyState />
        ) : !loading && !result ? (
          <>
            <Text style={styles.suggestLabel}>SUGGESTED QUERIES</Text>
            <View style={styles.chipsRow}>
              {SUGGESTED_QUERIES.map((q) => (
                <TouchableOpacity
                  key={q}
                  style={styles.chip}
                  onPress={() => handleSearch(q)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.chipText}>{q}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.recentLabel}>RECENT SESSIONS</Text>
            {MOCK_SESSIONS.slice(0, 3).map((s) => (
              <TouchableOpacity
                key={s.id}
                style={styles.recentCard}
                onPress={() =>
                  router.push({
                    pathname: "/session/[id]",
                    params: { id: s.id },
                  })
                }
                activeOpacity={0.88}
              >
                <Text style={styles.recentName} numberOfLines={1}>
                  {s.name}
                </Text>
                <View style={styles.recentMeta}>
                  <ModeBadge mode={s.mode} size="sm" />
                  <View style={styles.recentDate}>
                    <Clock size={11} color="#9ca3af" />
                    <Text style={styles.recentDateText}>
                      {formatDate(s.createdAt)}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </>
        ) : loading ? (
          <LoadingState />
        ) : result ? (
          <ResultView
            result={result}
            expandedSources={expandedSources}
            onToggleSources={() => setExpandedSources(!expandedSources)}
            onNewQuery={() => {
              setResult(null);
              setQuery("");
            }}
          />
        ) : null}
      </ScrollView>
    </View>
  );
}

function LoadingState() {
  return (
    <View style={styles.loadingState}>
      <ActivityIndicator size="large" color="#7C3AED" />
      <Text style={styles.loadingText}>Searching across sessions…</Text>
      {[1, 2, 3].map((i) => (
        <View key={i} style={styles.skeletonCard}>
          <View style={[styles.skeletonLine, { width: "70%" }]} />
          <View style={[styles.skeletonLine, { width: "100%", marginTop: 8 }]} />
          <View style={[styles.skeletonLine, { width: "90%", marginTop: 6 }]} />
        </View>
      ))}
    </View>
  );
}

function ResultView({
  result,
  expandedSources,
  onToggleSources,
  onNewQuery,
}: {
  result: SearchResult;
  expandedSources: boolean;
  onToggleSources: () => void;
  onNewQuery: () => void;
}) {
  return (
    <View>
      {/* Answer card */}
      <View style={styles.answerCard}>
        <View style={styles.answerHeader}>
          <Brain size={16} color="#7C3AED" />
          <Text style={styles.answerHeaderText}>AI Synthesis</Text>
        </View>
        <Text style={styles.answerText}>{result.answer}</Text>
      </View>

      {/* Sources */}
      <TouchableOpacity
        style={styles.sourcesToggle}
        onPress={onToggleSources}
        activeOpacity={0.8}
      >
        <Text style={styles.sourcesToggleText}>
          {result.sources.length} cited sources
        </Text>
        {expandedSources ? (
          <ChevronUp size={16} color="#7C3AED" />
        ) : (
          <ChevronDown size={16} color="#7C3AED" />
        )}
      </TouchableOpacity>

      {expandedSources &&
        result.sources.map((source, i) => (
          <TouchableOpacity
            key={i}
            style={styles.sourceCard}
            onPress={() =>
              router.push({
                pathname: "/session/[id]",
                params: { id: source.sessionId },
              })
            }
            activeOpacity={0.88}
          >
            <View style={styles.sourceHeader}>
              <Text style={styles.sourceName} numberOfLines={1}>
                {source.sessionName}
              </Text>
              <ModeBadge mode={source.mode} size="sm" />
            </View>
            <View style={styles.sourceTime}>
              <Clock size={11} color="#9ca3af" />
              <Text style={styles.sourceTimeText}>
                {source.date} · {source.timestamp}
              </Text>
            </View>
            <Text style={styles.sourceExcerpt}>"{source.excerpt}"</Text>
          </TouchableOpacity>
        ))}

      <TouchableOpacity style={styles.newQueryBtn} onPress={onNewQuery}>
        <Search size={16} color="#7C3AED" />
        <Text style={styles.newQueryText}>Ask another question</Text>
      </TouchableOpacity>
    </View>
  );
}

function EmptyState() {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Brain size={32} color="#7C3AED" />
      </View>
      <Text style={styles.emptyTitle}>No sessions yet</Text>
      <Text style={styles.emptyDesc}>
        Complete at least one session to start searching across your memory.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#faf8ff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(45,37,64,0.07)",
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(124,58,237,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#2d2540" },
  headerSub: { fontSize: 12, color: "#9ca3af", marginTop: 1 },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(45,37,64,0.06)",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "rgba(124,58,237,0.2)",
    paddingHorizontal: 14,
    paddingVertical: 2,
    gap: 10,
    shadowColor: "rgba(100,80,140,1)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#2d2540",
    paddingVertical: 12,
  },
  searchBtn: {
    backgroundColor: "#7C3AED",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 9,
  },
  searchBtnText: { fontSize: 13, fontWeight: "600", color: "#ffffff" },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 80 },
  suggestLabel: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.7,
    color: "#9ca3af",
    marginBottom: 12,
    textTransform: "uppercase",
  },
  chipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 28 },
  chip: {
    backgroundColor: "#ffffff",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: "rgba(124,58,237,0.15)",
    shadowColor: "rgba(100,80,140,1)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  chipText: { fontSize: 13, color: "#7C3AED", fontWeight: "500" },
  recentLabel: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.7,
    color: "#9ca3af",
    marginBottom: 12,
    textTransform: "uppercase",
  },
  recentCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(45,37,64,0.06)",
    shadowColor: "rgba(100,80,140,1)",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  recentName: { fontSize: 15, fontWeight: "600", color: "#2d2540", marginBottom: 8 },
  recentMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  recentDate: { flexDirection: "row", alignItems: "center", gap: 4 },
  recentDateText: { fontSize: 12, color: "#9ca3af" },
  loadingState: { paddingTop: 20 },
  loadingText: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    marginTop: 12,
    marginBottom: 24,
  },
  skeletonCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(45,37,64,0.05)",
  },
  skeletonLine: {
    height: 12,
    backgroundColor: "rgba(124,58,237,0.07)",
    borderRadius: 6,
  },
  answerCard: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: "rgba(124,58,237,0.15)",
    shadowColor: "rgba(100,80,140,1)",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 6,
  },
  answerHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  answerHeaderText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#7C3AED",
    letterSpacing: 0.3,
  },
  answerText: {
    fontSize: 14,
    color: "#2d2540",
    lineHeight: 22,
  },
  sourcesToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(124,58,237,0.06)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
  },
  sourcesToggleText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#7C3AED",
  },
  sourceCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(45,37,64,0.07)",
    borderLeftWidth: 3,
    borderLeftColor: "#7C3AED",
  },
  sourceHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  sourceName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#2d2540",
    flex: 1,
    marginRight: 8,
  },
  sourceTime: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 8 },
  sourceTimeText: { fontSize: 11, color: "#9ca3af" },
  sourceExcerpt: {
    fontSize: 13,
    color: "#6b7280",
    fontStyle: "italic",
    lineHeight: 19,
  },
  newQueryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "rgba(124,58,237,0.2)",
    backgroundColor: "rgba(124,58,237,0.04)",
  },
  newQueryText: { fontSize: 14, fontWeight: "600", color: "#7C3AED" },
  emptyState: { alignItems: "center", paddingTop: 60 },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(124,58,237,0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  emptyTitle: { fontSize: 20, fontWeight: "700", color: "#2d2540", marginBottom: 10 },
  emptyDesc: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 22,
  },
});
