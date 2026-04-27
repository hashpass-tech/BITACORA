import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckCircle, AlertCircle, RotateCw, Wifi } from 'lucide-react-native';
import {
  createStorage,
  p2pClient,
  type Memo,
} from '@bitacora/shared';
import { useNetworkStatus } from '../../lib/useNetworkStatus';
import { showErrorToast } from '../../lib/toast';

const DARK_BG = '#0A1628';
const TEXT_PRIMARY = '#E5E7EB'; // WCAG AA compliant (4.5:1 contrast)
const TEXT_SECONDARY = '#9CA3AF'; // WCAG AA compliant (4.5:1 contrast)
const SUCCESS_COLOR = '#10B981'; // Green
const ERROR_COLOR = '#EF4444'; // Red
const ACCENT = '#3B82F6'; // Blue accent

interface SyncSession {
  peerId: string;
  status: 'idle' | 'syncing' | 'synced' | 'error';
  startTime: number;
  endTime?: number;
  errorMessage?: string;
}

export default function SyncScreen() {
  const insets = useSafeAreaInsets();
  const networkStatus = useNetworkStatus();
  const [syncSessions, setSyncSessions] = useState<Map<string, SyncSession>>(new Map());
  const [totalMemosSynced, setTotalMemosSynced] = useState(0);
  const [memosSyncedThisSession, setMemosSyncedThisSession] = useState(0);
  const [loading, setLoading] = useState(true);
  const spinAnim = new Animated.Value(0);

  // Initialize storage
  useEffect(() => {
    const initialize = async () => {
      try {
        const storage = createStorage();
        await storage.initialize();

        // Load all memos to get total count
        const allMemos = await storage.getAllMemos();
        setTotalMemosSynced(allMemos.length);
      } catch (err) {
        console.error('Failed to initialize sync screen:', err);
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, []);

  // Setup P2P client event listeners
  useEffect(() => {
    const handleSyncStatusChanged = (peerId: string, status: string) => {
      setSyncSessions((prev) => {
        const updated = new Map(prev);
        const currentSession = updated.get(peerId) || {
          peerId,
          status: 'idle',
          startTime: Date.now(),
        };

        if (status === 'syncing') {
          updated.set(peerId, {
            ...currentSession,
            status: 'syncing',
            startTime: Date.now(),
          });
        } else if (status === 'synced') {
          updated.set(peerId, {
            ...currentSession,
            status: 'synced',
            endTime: Date.now(),
          });

          // Auto-hide synced status after 3 seconds
          setTimeout(() => {
            setSyncSessions((prev) => {
              const updated = new Map(prev);
              const session = updated.get(peerId);
              if (session && session.status === 'synced') {
                updated.delete(peerId);
              }
              return updated;
            });
          }, 3000);

          // Increment session counter
          setMemosSyncedThisSession((prev) => prev + 1);
        } else if (status === 'error') {
          updated.set(peerId, {
            ...currentSession,
            status: 'error',
            endTime: Date.now(),
            errorMessage: 'Sync failed',
          });
        }

        return updated;
      });
    };

    const handleMemoReceived = (memo: Memo) => {
      // Update total memos synced
      setTotalMemosSynced((prev) => prev + 1);
    };

    p2pClient.onSyncStatusChanged(handleSyncStatusChanged);
    p2pClient.onMemoReceived(handleMemoReceived);

    return () => {
      // Cleanup listeners (if needed)
    };
  }, []);

  // Spinning animation for syncing status
  useEffect(() => {
    const hasSyncing = Array.from(syncSessions.values()).some(
      (s) => s.status === 'syncing'
    );

    if (hasSyncing) {
      Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      ).start();
    } else {
      spinAnim.setValue(0);
    }
  }, [syncSessions, spinAnim]);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const syncSessionsList = Array.from(syncSessions.values());

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
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Sync Status</Text>
          {!networkStatus.isOnline && (
            <View style={styles.offlineBadge}>
              <Wifi size={12} color="#EF4444" />
              <Text style={styles.offlineBadgeText}>Offline</Text>
            </View>
          )}
        </View>
      </View>

      {/* Stats Section */}
      <View style={styles.statsSection}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Total Memos</Text>
          <Text style={styles.statValue}>{totalMemosSynced}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Synced This Session</Text>
          <Text style={styles.statValue}>{memosSyncedThisSession}</Text>
        </View>
      </View>

      {/* Sync Sessions List */}
      {syncSessionsList.length > 0 ? (
        <FlatList
          data={syncSessionsList}
          keyExtractor={(item) => item.peerId}
          renderItem={({ item }) => (
            <SyncSessionItem
              session={item}
              spinAnim={spin}
            />
          )}
          contentContainerStyle={styles.listContent}
          scrollEnabled={false}
        />
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            No active sync sessions
          </Text>
          <Text style={styles.emptyStateSubtext}>
            Sync will appear here when peers connect
          </Text>
        </View>
      )}
    </View>
  );
}

function SyncSessionItem({
  session,
  spinAnim,
}: {
  session: SyncSession;
  spinAnim: Animated.AnimatedInterpolation;
}) {
  const truncatedPeerId = session.peerId.substring(0, 8) + '...';
  const [retryCount, setRetryCount] = useState(0);

  const handleRetry = useCallback(() => {
    setRetryCount((prev) => prev + 1);
    // Attempt to reconnect
    p2pClient.connectToPeer(session.peerId).catch((err) => {
      console.error(`Failed to retry sync with ${session.peerId}:`, err);
    });
  }, [session.peerId]);

  return (
    <View style={styles.syncItem}>
      <View style={styles.syncHeader}>
        {session.status === 'syncing' && (
          <Animated.View style={{ transform: [{ rotate: spinAnim }] }}>
            <ActivityIndicator size="small" color={ACCENT} />
          </Animated.View>
        )}
        {session.status === 'synced' && (
          <CheckCircle size={20} color={SUCCESS_COLOR} />
        )}
        {session.status === 'error' && (
          <AlertCircle size={20} color={ERROR_COLOR} />
        )}

        <View style={styles.syncInfo}>
          <Text style={styles.syncPeerId}>{truncatedPeerId}</Text>
          <Text style={styles.syncStatus}>
            {session.status === 'syncing' && 'Syncing in progress...'}
            {session.status === 'synced' && 'Synced successfully'}
            {session.status === 'error' && 'Sync failed'}
          </Text>
        </View>
      </View>

      {/* Error message and retry button */}
      {session.status === 'error' && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorMessage}>
            {session.errorMessage || 'An error occurred during sync'}
          </Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={handleRetry}
            activeOpacity={0.7}
          >
            <RotateCw size={16} color={ACCENT} />
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Sync duration */}
      {session.endTime && (
        <View style={styles.syncDuration}>
          <Text style={styles.durationText}>
            Completed in {Math.round((session.endTime - session.startTime) / 1000)}s
          </Text>
        </View>
      )}
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
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: TEXT_PRIMARY,
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
  statsSection: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(229, 231, 235, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(229, 231, 235, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: TEXT_SECONDARY,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  syncItem: {
    backgroundColor: 'rgba(229, 231, 235, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(229, 231, 235, 0.1)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  syncHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  syncInfo: {
    flex: 1,
  },
  syncPeerId: {
    fontSize: 14,
    fontWeight: '600',
    color: TEXT_PRIMARY,
    fontFamily: 'monospace',
  },
  syncStatus: {
    fontSize: 12,
    color: TEXT_SECONDARY,
    marginTop: 2,
  },
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorMessage: {
    fontSize: 12,
    color: ERROR_COLOR,
    flex: 1,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 6,
  },
  retryBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: ACCENT,
  },
  syncDuration: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 6,
  },
  durationText: {
    fontSize: 12,
    color: SUCCESS_COLOR,
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: TEXT_PRIMARY,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: TEXT_SECONDARY,
    textAlign: 'center',
  },
});
