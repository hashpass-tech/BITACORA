import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  createStorage,
  createAIAgent,
  type Memo,
  type Edge,
  type ConsensusSynthesis,
  type Contradiction,
  type GraphInsights,
} from '@bitacora/shared';
import { AlertCircle, RefreshCw, Brain, Wifi } from 'lucide-react-native';
import { useNetworkStatus } from '../../lib/useNetworkStatus';
import { showErrorToast } from '../../lib/toast';

const DARK_BG = '#0A1628';
const TEXT_PRIMARY = '#E5E7EB';
const TEXT_SECONDARY = '#9CA3AF';
const ACCENT = '#3B82F6';
const ACCENT_HOVER = '#2563EB';
const ERROR_COLOR = '#EF4444';
const SUCCESS_COLOR = '#10B981';

type AnalysisType = 'consensus' | 'contradictions' | 'graph' | null;

interface AnalysisResult {
  type: AnalysisType;
  data: ConsensusSynthesis | Contradiction[] | GraphInsights | null;
  error: string | null;
}

export default function AIScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const networkStatus = useNetworkStatus();
  const [memos, setMemos] = useState<Memo[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [topic, setTopic] = useState('');
  const [result, setResult] = useState<AnalysisResult>({
    type: null,
    data: null,
    error: null,
  });

  // Load memos and edges from storage
  useEffect(() => {
    const loadData = async () => {
      try {
        const storage = createStorage();
        await storage.initialize();

        const allMemos = await storage.getAllMemos();
        
        // Collect all edges by iterating through memos
        const edgeSet = new Set<string>();
        const allEdgesArray: Edge[] = [];
        
        for (const memo of allMemos) {
          const memoEdges = await storage.getEdgesByMemo(memo.id);
          for (const edge of memoEdges) {
            if (!edgeSet.has(edge.id)) {
              edgeSet.add(edge.id);
              allEdgesArray.push(edge);
            }
          }
        }

        setMemos(allMemos);
        setEdges(allEdgesArray);
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : 'Failed to load data';
        setResult({
          type: null,
          data: null,
          error: errorMsg,
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleSynthesizeConsensus = async () => {
    if (!apiKey.trim()) {
      setShowApiKeyInput(true);
      return;
    }

    if (!topic.trim()) {
      Alert.alert('Error', 'Please enter a topic');
      return;
    }

    if (memos.length < 2) {
      setResult({
        type: 'consensus',
        data: null,
        error: 'Insufficient data: Need at least 2 memos',
      });
      return;
    }

    setAnalyzing(true);
    setResult({ type: null, data: null, error: null });

    try {
      const agent = createAIAgent(apiKey);
      const synthesis = await agent.synthesizeConsensus(topic, memos, edges);

      if (synthesis.statement === 'Insufficient data') {
        setResult({
          type: 'consensus',
          data: null,
          error: 'Insufficient data for this topic',
        });
      } else {
        setResult({
          type: 'consensus',
          data: synthesis,
          error: null,
        });
      }
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : 'Failed to synthesize consensus';
      setResult({
        type: 'consensus',
        data: null,
        error: errorMsg,
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleDetectContradictions = async () => {
    if (!apiKey.trim()) {
      setShowApiKeyInput(true);
      return;
    }

    if (memos.length < 2) {
      setResult({
        type: 'contradictions',
        data: null,
        error: 'Insufficient data: Need at least 2 memos',
      });
      return;
    }

    setAnalyzing(true);
    setResult({ type: null, data: null, error: null });

    try {
      const agent = createAIAgent(apiKey);
      const contradictions = await agent.detectContradictions(memos, edges);

      if (contradictions.length === 0) {
        setResult({
          type: 'contradictions',
          data: null,
          error: 'No contradictions detected',
        });
      } else {
        setResult({
          type: 'contradictions',
          data: contradictions,
          error: null,
        });
      }
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : 'Failed to detect contradictions';
      setResult({
        type: 'contradictions',
        data: null,
        error: errorMsg,
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleAnalyzeGraph = async () => {
    if (!apiKey.trim()) {
      setShowApiKeyInput(true);
      return;
    }

    if (memos.length === 0) {
      setResult({
        type: 'graph',
        data: null,
        error: 'Insufficient data: No memos to analyze',
      });
      return;
    }

    setAnalyzing(true);
    setResult({ type: null, data: null, error: null });

    try {
      const agent = createAIAgent(apiKey);
      const insights = await agent.analyzeGraph(memos, edges);

      setResult({
        type: 'graph',
        data: insights,
        error: null,
      });
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : 'Failed to analyze graph';
      setResult({
        type: 'graph',
        data: null,
        error: errorMsg,
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleMemoPress = (memoId: string) => {
    router.push(`/memo/${memoId}`);
  };

  const handleRetry = () => {
    if (result.type === 'consensus') {
      handleSynthesizeConsensus();
    } else if (result.type === 'contradictions') {
      handleDetectContradictions();
    } else if (result.type === 'graph') {
      handleAnalyzeGraph();
    }
  };

  if (loading) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={ACCENT} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>AI Agent</Text>
            <Text style={styles.headerSubtitle}>
              {memos.length} memos, {edges.length} relations
            </Text>
          </View>
          {!networkStatus.isOnline && (
            <View style={styles.offlineBadge}>
              <Wifi size={12} color="#EF4444" />
              <Text style={styles.offlineBadgeText}>Offline</Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* API Key Input */}
        {showApiKeyInput && (
          <View style={styles.apiKeySection}>
            <Text style={styles.sectionTitle}>Claude API Key</Text>
            <TextInput
              style={styles.apiKeyInput}
              placeholder="Enter your Claude API key..."
              placeholderTextColor={TEXT_SECONDARY}
              value={apiKey}
              onChangeText={setApiKey}
              secureTextEntry
              editable={!analyzing}
            />
            <TouchableOpacity
              style={styles.closeApiKeyBtn}
              onPress={() => setShowApiKeyInput(false)}
            >
              <Text style={styles.closeApiKeyBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Analysis Options */}
        <View style={styles.optionsSection}>
          <Text style={styles.sectionTitle}>Analysis Options</Text>

          {/* Consensus Synthesis */}
          <View style={styles.optionCard}>
            <View style={styles.optionHeader}>
              <Brain size={20} color={ACCENT} />
              <Text style={styles.optionTitle}>Consensus Synthesis</Text>
            </View>
            <Text style={styles.optionDescription}>
              Synthesize consensus from memos on a specific topic
            </Text>
            <TextInput
              style={styles.topicInput}
              placeholder="Enter topic..."
              placeholderTextColor={TEXT_SECONDARY}
              value={topic}
              onChangeText={setTopic}
              editable={!analyzing}
            />
            <TouchableOpacity
              style={[
                styles.actionBtn,
                analyzing && styles.actionBtnDisabled,
              ]}
              onPress={handleSynthesizeConsensus}
              disabled={analyzing}
            >
              {analyzing && result.type === 'consensus' ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.actionBtnText}>Synthesize</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Contradiction Detection */}
          <View style={styles.optionCard}>
            <View style={styles.optionHeader}>
              <AlertCircle size={20} color={ERROR_COLOR} />
              <Text style={styles.optionTitle}>Contradiction Detection</Text>
            </View>
            <Text style={styles.optionDescription}>
              Detect contradictions in the knowledge graph
            </Text>
            <TouchableOpacity
              style={[
                styles.actionBtn,
                analyzing && styles.actionBtnDisabled,
              ]}
              onPress={handleDetectContradictions}
              disabled={analyzing}
            >
              {analyzing && result.type === 'contradictions' ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.actionBtnText}>Detect</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Graph Reasoning */}
          <View style={styles.optionCard}>
            <View style={styles.optionHeader}>
              <Brain size={20} color={SUCCESS_COLOR} />
              <Text style={styles.optionTitle}>Graph Reasoning</Text>
            </View>
            <Text style={styles.optionDescription}>
              Analyze graph structure and discover insights
            </Text>
            <TouchableOpacity
              style={[
                styles.actionBtn,
                analyzing && styles.actionBtnDisabled,
              ]}
              onPress={handleAnalyzeGraph}
              disabled={analyzing}
            >
              {analyzing && result.type === 'graph' ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.actionBtnText}>Analyze</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Results */}
        {result.error && (
          <View style={styles.resultSection}>
            <View style={styles.errorBox}>
              <AlertCircle size={20} color={ERROR_COLOR} />
              <Text style={styles.errorBoxText}>{result.error}</Text>
            </View>
            <TouchableOpacity
              style={styles.retryBtn}
              onPress={handleRetry}
            >
              <RefreshCw size={16} color="#ffffff" />
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {result.type === 'consensus' && result.data && !result.error && (
          <View style={styles.resultSection}>
            <Text style={styles.resultTitle}>Consensus Synthesis</Text>
            <View style={styles.resultBox}>
              <Text style={styles.resultStatement}>
                {(result.data as ConsensusSynthesis).statement}
              </Text>
              <View style={styles.confidenceRow}>
                <Text style={styles.confidenceLabel}>Confidence:</Text>
                <Text
                  style={[
                    styles.confidenceValue,
                    {
                      color:
                        (result.data as ConsensusSynthesis).confidenceLevel ===
                        'high'
                          ? SUCCESS_COLOR
                          : (result.data as ConsensusSynthesis)
                              .confidenceLevel === 'medium'
                            ? '#F59E0B'
                            : ERROR_COLOR,
                    },
                  ]}
                >
                  {(result.data as ConsensusSynthesis).confidenceLevel}
                </Text>
              </View>
              {(result.data as ConsensusSynthesis).supportingMemoIds.length >
                0 && (
                <View style={styles.memoReferencesSection}>
                  <Text style={styles.referencesTitle}>Supporting Memos:</Text>
                  {(result.data as ConsensusSynthesis).supportingMemoIds.map(
                    (memoId) => {
                      const memo = memos.find((m) => m.id === memoId);
                      return (
                        <TouchableOpacity
                          key={memoId}
                          style={styles.memoReference}
                          onPress={() => handleMemoPress(memoId)}
                        >
                          <Text style={styles.memoReferenceText}>
                            {memo?.content.substring(0, 50)}...
                          </Text>
                        </TouchableOpacity>
                      );
                    }
                  )}
                </View>
              )}
            </View>
          </View>
        )}

        {result.type === 'contradictions' &&
          result.data &&
          !result.error && (
            <View style={styles.resultSection}>
              <Text style={styles.resultTitle}>Contradictions Detected</Text>
              {(result.data as Contradiction[]).map((contradiction, idx) => {
                const memoA = memos.find((m) => m.id === contradiction.memoA);
                const memoB = memos.find((m) => m.id === contradiction.memoB);
                return (
                  <View key={idx} style={styles.contradictionBox}>
                    <Text style={styles.contradictionExplanation}>
                      {contradiction.explanation}
                    </Text>
                    <View style={styles.contradictionMemos}>
                      <TouchableOpacity
                        style={styles.contradictionMemo}
                        onPress={() =>
                          handleMemoPress(contradiction.memoA)
                        }
                      >
                        <Text style={styles.contradictionMemoText}>
                          {memoA?.content.substring(0, 40)}...
                        </Text>
                      </TouchableOpacity>
                      <Text style={styles.contradictionVs}>vs</Text>
                      <TouchableOpacity
                        style={styles.contradictionMemo}
                        onPress={() =>
                          handleMemoPress(contradiction.memoB)
                        }
                      >
                        <Text style={styles.contradictionMemoText}>
                          {memoB?.content.substring(0, 40)}...
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

        {result.type === 'graph' && result.data && !result.error && (
          <View style={styles.resultSection}>
            <Text style={styles.resultTitle}>Graph Insights</Text>
            <View style={styles.resultBox}>
              {(result.data as GraphInsights).mostConnected.length > 0 && (
                <View style={styles.insightSection}>
                  <Text style={styles.insightTitle}>Most Connected Memos:</Text>
                  {(result.data as GraphInsights).mostConnected.map(
                    (memoId) => {
                      const memo = memos.find((m) => m.id === memoId);
                      return (
                        <TouchableOpacity
                          key={memoId}
                          style={styles.memoReference}
                          onPress={() => handleMemoPress(memoId)}
                        >
                          <Text style={styles.memoReferenceText}>
                            {memo?.content.substring(0, 50)}...
                          </Text>
                        </TouchableOpacity>
                      );
                    }
                  )}
                </View>
              )}

              {(result.data as GraphInsights).strongestChains.length > 0 && (
                <View style={styles.insightSection}>
                  <Text style={styles.insightTitle}>Strongest Chains:</Text>
                  {(result.data as GraphInsights).strongestChains.map(
                    (chain, idx) => (
                      <Text key={idx} style={styles.chainText}>
                        {chain.join(' → ')}
                      </Text>
                    )
                  )}
                </View>
              )}

              {(result.data as GraphInsights).suggestedEdges.length > 0 && (
                <View style={styles.insightSection}>
                  <Text style={styles.insightTitle}>Suggested Edges:</Text>
                  {(result.data as GraphInsights).suggestedEdges.map(
                    (edge, idx) => (
                      <Text key={idx} style={styles.suggestedEdgeText}>
                        {edge.relation}: {edge.sourceId.substring(0, 8)}... →{' '}
                        {edge.targetId.substring(0, 8)}...
                      </Text>
                    )
                  )}
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: DARK_BG,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(229, 231, 235, 0.1)',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  headerSubtitle: {
    fontSize: 12,
    color: TEXT_SECONDARY,
    marginTop: 4,
  },
  offlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 6,
  },
  offlineBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#EF4444',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  apiKeySection: {
    backgroundColor: 'rgba(229, 231, 235, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(229, 231, 235, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: TEXT_PRIMARY,
    marginBottom: 12,
  },
  apiKeyInput: {
    backgroundColor: 'rgba(229, 231, 235, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(229, 231, 235, 0.2)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: TEXT_PRIMARY,
    fontSize: 14,
    marginBottom: 12,
  },
  closeApiKeyBtn: {
    backgroundColor: ACCENT,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeApiKeyBtnText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  optionsSection: {
    marginBottom: 24,
  },
  optionCard: {
    backgroundColor: 'rgba(229, 231, 235, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(229, 231, 235, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: TEXT_PRIMARY,
  },
  optionDescription: {
    fontSize: 13,
    color: TEXT_SECONDARY,
    marginBottom: 12,
  },
  topicInput: {
    backgroundColor: 'rgba(229, 231, 235, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(229, 231, 235, 0.2)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: TEXT_PRIMARY,
    fontSize: 14,
    marginBottom: 12,
  },
  actionBtn: {
    backgroundColor: ACCENT,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  actionBtnDisabled: {
    backgroundColor: 'rgba(59, 130, 246, 0.4)',
    opacity: 0.6,
  },
  actionBtnText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  resultSection: {
    marginBottom: 24,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginBottom: 12,
  },
  resultBox: {
    backgroundColor: 'rgba(229, 231, 235, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(229, 231, 235, 0.1)',
    borderRadius: 12,
    padding: 16,
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  errorBoxText: {
    fontSize: 14,
    color: ERROR_COLOR,
    flex: 1,
  },
  retryBtn: {
    backgroundColor: ACCENT,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  retryBtnText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  resultStatement: {
    fontSize: 16,
    color: TEXT_PRIMARY,
    lineHeight: 24,
    marginBottom: 12,
  },
  confidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  confidenceLabel: {
    fontSize: 14,
    color: TEXT_SECONDARY,
  },
  confidenceValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  memoReferencesSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(229, 231, 235, 0.1)',
  },
  referencesTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: TEXT_SECONDARY,
    marginBottom: 8,
  },
  memoReference: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
  },
  memoReferenceText: {
    fontSize: 13,
    color: ACCENT,
  },
  contradictionBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  contradictionExplanation: {
    fontSize: 14,
    color: TEXT_PRIMARY,
    marginBottom: 12,
    lineHeight: 20,
  },
  contradictionMemos: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contradictionMemo: {
    flex: 1,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  contradictionMemoText: {
    fontSize: 12,
    color: ERROR_COLOR,
  },
  contradictionVs: {
    fontSize: 12,
    color: TEXT_SECONDARY,
    fontWeight: '600',
  },
  insightSection: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(229, 231, 235, 0.1)',
  },
  insightTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: TEXT_SECONDARY,
    marginBottom: 8,
  },
  chainText: {
    fontSize: 12,
    color: TEXT_PRIMARY,
    marginBottom: 6,
    fontFamily: 'monospace',
  },
  suggestedEdgeText: {
    fontSize: 12,
    color: TEXT_PRIMARY,
    marginBottom: 6,
    fontFamily: 'monospace',
  },
});
