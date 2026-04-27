import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Copy, Check } from 'lucide-react-native';
import { createStorage, type Memo } from '@bitacora/shared';

const DARK_BG = '#0A1628';
const TEXT_PRIMARY = '#E5E7EB';
const TEXT_SECONDARY = '#9CA3AF';
const ACCENT = '#3B82F6';
const BORDER_COLOR = 'rgba(229, 231, 235, 0.1)';

export default function MemoDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [memo, setMemo] = useState<Memo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    const loadMemo = async () => {
      if (!id) {
        setError('No memo ID provided');
        setLoading(false);
        return;
      }

      try {
        const storage = createStorage();
        await storage.initialize();
        const loadedMemo = await storage.getMemo(id);

        if (!loadedMemo) {
          setError('Memo not found');
        } else {
          setMemo(loadedMemo);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to load memo'
        );
      } finally {
        setLoading(false);
      }
    };

    loadMemo();
  }, [id]);

  const handleCopy = (text: string, field: string) => {
    // Copy functionality would require react-native-clipboard or similar
    // For now, we'll just show a visual feedback
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const getRelativeTime = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;

    const date = new Date(timestamp);
    return date.toLocaleDateString();
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

  if (error || !memo) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <ChevronLeft size={24} color={TEXT_PRIMARY} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Memo</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error || 'Memo not found'}</Text>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
          >
            <Text style={styles.backBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ChevronLeft size={24} color={TEXT_PRIMARY} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Memo</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Badge */}
        <View style={styles.statusSection}>
          <View
            style={[
              styles.statusBadge,
              memo.status === 'pending' && styles.statusPending,
              memo.status === 'verified' && styles.statusVerified,
              memo.status === 'disputed' && styles.statusDisputed,
            ]}
          >
            <Text style={styles.statusText}>{memo.status}</Text>
          </View>
          <Text style={styles.relativeTime}>
            {getRelativeTime(memo.timestamp)}
          </Text>
        </View>

        {/* Content Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Content</Text>
          <View style={styles.contentBox}>
            <Text style={styles.contentText}>{memo.content}</Text>
          </View>
        </View>

        {/* Metadata Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Metadata</Text>

          {/* Creator */}
          <FieldDisplay
            label="Creator"
            value={memo.creator}
            onCopy={() => handleCopy(memo.creator, 'creator')}
            isCopied={copiedField === 'creator'}
          />

          {/* Timestamp */}
          <FieldDisplay
            label="Timestamp"
            value={new Date(memo.timestamp).toISOString()}
            onCopy={() =>
              handleCopy(new Date(memo.timestamp).toISOString(), 'timestamp')
            }
            isCopied={copiedField === 'timestamp'}
          />

          {/* Content Hash */}
          <FieldDisplay
            label="Content Hash"
            value={memo.contentHash}
            onCopy={() => handleCopy(memo.contentHash, 'contentHash')}
            isCopied={copiedField === 'contentHash'}
            monospace
          />

          {/* Memo ID */}
          <FieldDisplay
            label="Memo ID"
            value={memo.id}
            onCopy={() => handleCopy(memo.id, 'id')}
            isCopied={copiedField === 'id'}
            monospace
          />
        </View>

        {/* Signature Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Signature</Text>
          <FieldDisplay
            label="Signature"
            value={memo.signature}
            onCopy={() => handleCopy(memo.signature, 'signature')}
            isCopied={copiedField === 'signature'}
            monospace
          />
        </View>

        {/* Merkle Proof Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Merkle Proof</Text>

          {/* Merkle Root */}
          <FieldDisplay
            label="Merkle Root"
            value={memo.merkleRoot}
            onCopy={() => handleCopy(memo.merkleRoot, 'merkleRoot')}
            isCopied={copiedField === 'merkleRoot'}
            monospace
          />

          {/* Merkle Proof Path */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Proof Path</Text>
            <View style={styles.proofContainer}>
              {memo.merkleProof.length === 0 ? (
                <Text style={styles.emptyProofText}>No proof path</Text>
              ) : (
                memo.merkleProof.map((hash, index) => (
                  <View key={index} style={styles.proofItem}>
                    <Text style={styles.proofIndex}>[{index}]</Text>
                    <Text style={styles.proofHash}>{hash}</Text>
                  </View>
                ))
              )}
            </View>
          </View>
        </View>

        {/* Bottom Padding */}
        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

interface FieldDisplayProps {
  label: string;
  value: string;
  onCopy: () => void;
  isCopied: boolean;
  monospace?: boolean;
}

function FieldDisplay({
  label,
  value,
  onCopy,
  isCopied,
  monospace = false,
}: FieldDisplayProps) {
  return (
    <View style={styles.field}>
      <View style={styles.fieldHeader}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <TouchableOpacity onPress={onCopy} style={styles.copyBtn}>
          {isCopied ? (
            <Check size={16} color="#10B981" />
          ) : (
            <Copy size={16} color={ACCENT} />
          )}
        </TouchableOpacity>
      </View>
      <View style={styles.fieldValue}>
        <Text
          style={[
            styles.fieldValueText,
            monospace && styles.fieldValueMonospace,
          ]}
          numberOfLines={3}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: DARK_BG,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDER_COLOR,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: TEXT_PRIMARY,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    color: TEXT_PRIMARY,
    textAlign: 'center',
    marginBottom: 20,
  },
  backBtn: {
    backgroundColor: ACCENT,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  statusSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusPending: {
    backgroundColor: 'rgba(234, 179, 8, 0.2)',
  },
  statusVerified: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  statusDisputed: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: TEXT_PRIMARY,
  },
  relativeTime: {
    fontSize: 12,
    color: TEXT_SECONDARY,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  contentBox: {
    backgroundColor: 'rgba(229, 231, 235, 0.05)',
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: 12,
    padding: 16,
  },
  contentText: {
    fontSize: 16,
    color: TEXT_PRIMARY,
    lineHeight: 24,
  },
  field: {
    marginBottom: 16,
  },
  fieldHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: TEXT_SECONDARY,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  copyBtn: {
    padding: 4,
  },
  fieldValue: {
    backgroundColor: 'rgba(229, 231, 235, 0.05)',
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  fieldValueText: {
    fontSize: 13,
    color: TEXT_PRIMARY,
    lineHeight: 18,
  },
  fieldValueMonospace: {
    fontFamily: 'monospace',
    fontSize: 11,
  },
  proofContainer: {
    backgroundColor: 'rgba(229, 231, 235, 0.05)',
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: 8,
    padding: 12,
  },
  proofItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  proofIndex: {
    fontSize: 11,
    color: TEXT_SECONDARY,
    fontFamily: 'monospace',
    marginRight: 8,
    minWidth: 30,
  },
  proofHash: {
    fontSize: 11,
    color: TEXT_PRIMARY,
    fontFamily: 'monospace',
    flex: 1,
  },
  emptyProofText: {
    fontSize: 13,
    color: TEXT_SECONDARY,
    fontStyle: 'italic',
  },
});
