import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MOCK_SESSIONS, getModeColor, formatDate } from "@/lib/store";
import { ModeBadge } from "@/components/ModeBadge";
import {
  ArrowLeft,
  BookOpen,
  List,
  FileText,
  ChevronDown,
  ChevronUp,
  Clock,
} from "lucide-react-native";

type Tab = "transcript" | "glossary" | "brief";

export default function SessionDetailScreen() {
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const id = params.id as string;
  const session = MOCK_SESSIONS.find((s) => s.id === id);
  const [activeTab, setActiveTab] = useState<Tab>("brief");
  const [expandedTerms, setExpandedTerms] = useState<Set<string>>(new Set());

  if (!session) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Session not found</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backLink}>← Go back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const modeColors = getModeColor(session.mode);

  const toggleTerm = (id: string) => {
    setExpandedTerms((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color="#2d2540" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {session.name}
          </Text>
          <View style={styles.headerMeta}>
            <Text style={styles.headerDate}>{formatDate(session.createdAt)}</Text>
            {session.duration && (
              <>
                <Text style={styles.metaDot}>·</Text>
                <Text style={styles.headerDate}>{session.duration}</Text>
              </>
            )}
          </View>
        </View>
        <ModeBadge mode={session.mode} size="sm" />
      </View>

      {/* Tab bar */}
      <View style={styles.tabBar}>
        {(
          [
            { key: "brief", label: "Brief", Icon: FileText },
            { key: "transcript", label: "Transcript", Icon: List },
            { key: "glossary", label: "Concepts", Icon: BookOpen },
          ] as { key: Tab; label: string; Icon: any }[]
        ).map(({ key, label, Icon }) => (
          <TouchableOpacity
            key={key}
            style={[styles.tab, activeTab === key && styles.tabActive]}
            onPress={() => setActiveTab(key)}
            activeOpacity={0.8}
          >
            <Icon
              size={15}
              color={activeTab === key ? "#7C3AED" : "#9ca3af"}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === key && styles.tabTextActive,
              ]}
            >
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Brief tab */}
        {activeTab === "brief" && session.brief && (
          <>
            {session.brief.map((section) => (
              <View key={section.id} style={styles.sectionCard}>
                <View
                  style={[
                    styles.sectionLabel,
                    { backgroundColor: modeColors.bg },
                  ]}
                >
                  <Text
                    style={[
                      styles.sectionLabelText,
                      { color: modeColors.text },
                    ]}
                  >
                    {section.label}
                  </Text>
                </View>
                <Text style={styles.sectionContent}>{section.content}</Text>
              </View>
            ))}
            <TouchableOpacity
              style={styles.viewBriefBtn}
              onPress={() =>
                router.push({
                  pathname: "/brief/[id]",
                  params: { id: session.id },
                })
              }
              activeOpacity={0.85}
            >
              <FileText size={16} color="#7C3AED" />
              <Text style={styles.viewBriefText}>View Full Brief</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Transcript tab */}
        {activeTab === "transcript" && (
          <>
            {session.transcript.length === 0 ? (
              <View style={styles.emptyTab}>
                <Text style={styles.emptyTabText}>No transcript available</Text>
              </View>
            ) : (
              session.transcript.map((line) => (
                <View key={line.id} style={styles.transcriptLine}>
                  <View style={styles.transcriptMeta}>
                    <Clock size={11} color="#9ca3af" />
                    <Text style={styles.transcriptTimestamp}>
                      {line.timestamp}
                    </Text>
                    <Text style={styles.transcriptSpeaker}>{line.speaker}</Text>
                  </View>
                  <Text style={styles.transcriptText}>{line.text}</Text>
                  {line.highlightedTerms && line.highlightedTerms.length > 0 && (
                    <View style={styles.termTags}>
                      {line.highlightedTerms.map((t) => (
                        <View key={t} style={styles.termTag}>
                          <Text style={styles.termTagText}>{t}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              ))
            )}
          </>
        )}

        {/* Glossary tab */}
        {activeTab === "glossary" && (
          <>
            {session.glossary.length === 0 ? (
              <View style={styles.emptyTab}>
                <Text style={styles.emptyTabText}>No concepts detected</Text>
              </View>
            ) : (
              session.glossary.map((term) => (
                <TouchableOpacity
                  key={term.id}
                  style={styles.glossaryCard}
                  onPress={() => toggleTerm(term.id)}
                  activeOpacity={0.88}
                >
                  <View style={styles.glossaryCardHeader}>
                    <View>
                      <Text style={[styles.glossaryTerm, { color: modeColors.text }]}>
                        {term.term}
                      </Text>
                      <Text style={styles.glossaryTimestamp}>
                        {term.timestamp}
                      </Text>
                    </View>
                    {expandedTerms.has(term.id) ? (
                      <ChevronUp size={16} color="#9ca3af" />
                    ) : (
                      <ChevronDown size={16} color="#9ca3af" />
                    )}
                  </View>
                  {expandedTerms.has(term.id) && (
                    <Text style={styles.glossaryDef}>{term.definition}</Text>
                  )}
                </TouchableOpacity>
              ))
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#faf8ff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(45,37,64,0.07)",
    backgroundColor: "#ffffff",
    gap: 10,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: { flex: 1 },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2d2540",
  },
  headerMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  headerDate: { fontSize: 12, color: "#9ca3af" },
  metaDot: { color: "#d1d5db", fontSize: 12 },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(45,37,64,0.07)",
    paddingHorizontal: 16,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: {
    borderBottomColor: "#7C3AED",
  },
  tabText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#9ca3af",
  },
  tabTextActive: {
    color: "#7C3AED",
    fontWeight: "700",
  },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 60 },
  sectionCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(45,37,64,0.06)",
    shadowColor: "rgba(100,80,140,1)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionLabel: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 10,
  },
  sectionLabelText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  sectionContent: {
    fontSize: 14,
    color: "#2d2540",
    lineHeight: 21,
  },
  viewBriefBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "rgba(124,58,237,0.2)",
    backgroundColor: "rgba(124,58,237,0.04)",
    marginTop: 4,
  },
  viewBriefText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#7C3AED",
  },
  transcriptLine: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(45,37,64,0.06)",
  },
  transcriptMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  transcriptTimestamp: {
    fontSize: 11,
    color: "#9ca3af",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  transcriptSpeaker: {
    fontSize: 11,
    fontWeight: "700",
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
  termTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 8,
  },
  termTag: {
    backgroundColor: "rgba(124,58,237,0.07)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(124,58,237,0.15)",
  },
  termTagText: {
    fontSize: 11,
    color: "#7C3AED",
    fontWeight: "500",
  },
  glossaryCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(45,37,64,0.06)",
    shadowColor: "rgba(100,80,140,1)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  glossaryCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  glossaryTerm: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 3,
  },
  glossaryTimestamp: {
    fontSize: 11,
    color: "#9ca3af",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  glossaryDef: {
    fontSize: 13,
    color: "#6b7280",
    lineHeight: 20,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(45,37,64,0.07)",
  },
  emptyTab: {
    alignItems: "center",
    paddingTop: 60,
  },
  emptyTabText: {
    fontSize: 14,
    color: "#9ca3af",
  },
  notFound: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  notFoundText: {
    fontSize: 16,
    color: "#9ca3af",
    marginBottom: 12,
  },
  backLink: {
    fontSize: 14,
    color: "#7C3AED",
    fontWeight: "600",
  },
});
