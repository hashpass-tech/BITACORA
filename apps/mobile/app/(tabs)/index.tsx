import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Bitacora, MOCK_SESSIONS, formatDate } from "@/lib/store";
import { ModeBadge } from "@/components/ModeBadge";
import { CreateBitacoraModal } from "@/components/CreateBitacoraModal";
import { Plus, Mic, Clock, Layers, FileText } from "lucide-react-native";

let sessionStore: Bitacora[] = [...MOCK_SESSIONS];

export function getSessionStore() {
  return sessionStore;
}

export function addSession(session: Bitacora) {
  sessionStore = [session, ...sessionStore];
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [sessions, setSessions] = useState<Bitacora[]>(sessionStore);
  const [showCreate, setShowCreate] = useState(false);

  const totalConcepts = sessions.reduce((s, b) => s + b.glossary.length, 0);
  const totalBriefs = sessions.filter((b) => b.brief && b.brief.length > 0).length;

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
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.logoIconBox}>
              <Mic size={16} color="#7C3AED" />
            </View>
            <Text style={styles.logoText}>Bitácora</Text>
          </View>
          <TouchableOpacity
            style={styles.avatar}
            onPress={() => router.push("/(tabs)/profile")}
          >
            <Text style={styles.avatarText}>U</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Strip */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Layers size={18} color="#7C3AED" />
            <Text style={styles.statValue}>{sessions.length}</Text>
            <Text style={styles.statLabel}>Sessions</Text>
          </View>
          <View style={styles.statCard}>
            <FileText size={18} color="#4338CA" />
            <Text style={[styles.statValue, { color: "#4338CA" }]}>
              {totalConcepts}
            </Text>
            <Text style={styles.statLabel}>Concepts</Text>
          </View>
          <View style={styles.statCard}>
            <FileText size={18} color="#0D9488" />
            <Text style={[styles.statValue, { color: "#0D9488" }]}>
              {totalBriefs}
            </Text>
            <Text style={styles.statLabel}>Briefs</Text>
          </View>
        </View>

        {/* Section header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your Bitácoras</Text>
          <TouchableOpacity
            style={styles.newBtn}
            onPress={() => setShowCreate(true)}
            activeOpacity={0.8}
          >
            <Plus size={16} color="#7C3AED" />
            <Text style={styles.newBtnText}>New</Text>
          </TouchableOpacity>
        </View>

        {/* Sessions list */}
        {sessions.length === 0 ? (
          <EmptyState onCreate={() => setShowCreate(true)} />
        ) : (
          sessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              onPress={() =>
                router.push({
                  pathname: "/session/[id]",
                  params: { id: session.id },
                })
              }
            />
          ))
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { bottom: 90 + insets.bottom }]}
        onPress={() => setShowCreate(true)}
        activeOpacity={0.85}
      >
        <Plus size={24} color="#ffffff" />
      </TouchableOpacity>

      <CreateBitacoraModal
        visible={showCreate}
        onClose={() => setShowCreate(false)}
        onStart={handleStart}
      />
    </View>
  );
}

function SessionCard({
  session,
  onPress,
}: {
  session: Bitacora;
  onPress: () => void;
}) {
  const snippet = session.brief?.[0]?.content ?? session.transcript[0]?.text ?? "";
  return (
    <TouchableOpacity
      style={styles.sessionCard}
      onPress={onPress}
      activeOpacity={0.88}
    >
      <View style={styles.sessionCardTop}>
        <Text style={styles.sessionName} numberOfLines={1}>
          {session.name}
        </Text>
        <ModeBadge mode={session.mode} size="sm" />
      </View>
      <View style={styles.sessionMeta}>
        <Clock size={12} color="#9ca3af" />
        <Text style={styles.sessionDate}>{formatDate(session.createdAt)}</Text>
        {session.duration && (
          <>
            <Text style={styles.sessionDot}>·</Text>
            <Text style={styles.sessionDate}>{session.duration}</Text>
          </>
        )}
      </View>
      {snippet ? (
        <Text style={styles.sessionSnippet} numberOfLines={2}>
          {snippet}
        </Text>
      ) : null}
      {session.glossary.length > 0 && (
        <View style={styles.sessionTerms}>
          {session.glossary.slice(0, 3).map((g) => (
            <View key={g.id} style={styles.termChip}>
              <Text style={styles.termChipText}>{g.term}</Text>
            </View>
          ))}
          {session.glossary.length > 3 && (
            <Text style={styles.termMore}>
              +{session.glossary.length - 3}
            </Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Mic size={32} color="#7C3AED" />
      </View>
      <Text style={styles.emptyTitle}>Your first bitácora awaits</Text>
      <Text style={styles.emptyDesc}>
        Capture any session — conference panel, lecture, meeting, or podcast —
        and let AI transform it into structured memory.
      </Text>
      <TouchableOpacity
        style={styles.emptyBtn}
        onPress={onCreate}
        activeOpacity={0.85}
      >
        <Plus size={16} color="#ffffff" />
        <Text style={styles.emptyBtnText}>Create your first Bitácora</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#faf8ff",
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  logoIconBox: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: "rgba(124,58,237,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#7C3AED",
    letterSpacing: -0.3,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(124,58,237,0.1)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "rgba(124,58,237,0.2)",
  },
  avatarText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#7C3AED",
  },
  statsGrid: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 14,
    alignItems: "center",
    gap: 4,
    shadowColor: "rgba(100,80,140,1)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 1,
    borderColor: "rgba(45,37,64,0.05)",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#7C3AED",
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "500",
    color: "#9ca3af",
    letterSpacing: 0.3,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2d2540",
  },
  newBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: "rgba(124,58,237,0.08)",
    borderWidth: 1,
    borderColor: "rgba(124,58,237,0.2)",
  },
  newBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#7C3AED",
  },
  sessionCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    shadowColor: "rgba(100,80,140,1)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 4,
    borderWidth: 1,
    borderColor: "rgba(45,37,64,0.06)",
  },
  sessionCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  sessionName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2d2540",
    flex: 1,
    marginRight: 10,
  },
  sessionMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 10,
  },
  sessionDate: {
    fontSize: 12,
    color: "#9ca3af",
    fontWeight: "500",
  },
  sessionDot: {
    color: "#d1d5db",
    fontSize: 12,
  },
  sessionSnippet: {
    fontSize: 13,
    color: "#6b7280",
    lineHeight: 20,
    marginBottom: 10,
  },
  sessionTerms: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    alignItems: "center",
  },
  termChip: {
    backgroundColor: "rgba(124,58,237,0.07)",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
  },
  termChipText: {
    fontSize: 11,
    color: "#7C3AED",
    fontWeight: "500",
  },
  termMore: {
    fontSize: 11,
    color: "#9ca3af",
    fontWeight: "500",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(124,58,237,0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#2d2540",
    marginBottom: 10,
    textAlign: "center",
  },
  emptyDesc: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 28,
  },
  emptyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#7C3AED",
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 12,
  },
  emptyBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#ffffff",
  },
  fab: {
    position: "absolute",
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#7C3AED",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
});
