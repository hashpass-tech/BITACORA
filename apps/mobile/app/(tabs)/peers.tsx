import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Circle, RotateCw, Wifi } from 'lucide-react-native';
import {
  createStorage,
  p2pClient,
  type Peer,
} from '@bitacora/shared';
import { useNetworkStatus } from '../../lib/useNetworkStatus';
import { showErrorToast } from '../../lib/toast';

const DARK_BG = '#0A1628';
const TEXT_PRIMARY = '#E5E7EB'; // WCAG AA compliant (4.5:1 contrast)
const TEXT_SECONDARY = '#9CA3AF'; // WCAG AA compliant (4.5:1 contrast)
const ONLINE_COLOR = '#10B981'; // Green
const OFFLINE_COLOR = '#6B7280'; // Gray
const ACCENT = '#3B82F6'; // Blue accent

export default function PeersScreen() {
  const insets = useSafeAreaInsets();
  const networkStatus = useNetworkStatus();
  const [peers, setPeers] = useState<Peer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [connectedPeerIds, setConnectedPeerIds] = useState<Set<string>>(new Set());
  const [syncStatus, setSyncStatus] = useState<Map<string, string>>(new Map());

  // Initialize storage and load peers
  useEffect(() => {
    const initialize = async () => {
      try {
        const storage = createStorage();
        await storage.initialize();

        // Load all peers
        const allPeers = await storage.getAllPeers();
        setPeers(allPeers);

        // Get currently connected peers
        const connected = p2pClient.getConnectedPeers();
        setConnectedPeerIds(new Set(connected));
      } catch (err) {
        console.error('Failed to initialize peers screen:', err);
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, []);

  // Setup P2P client event listeners
  useEffect(() => {
    const handlePeerConnected = (peerId: string) => {
      setConnectedPeerIds((prev) => new Set([...prev, peerId]));
    };

    const handlePeerDisconnected = (peerId: string) => {
      setConnectedPeerIds((prev) => {
        const updated = new Set(prev);
        updated.delete(peerId);
        return updated;
      });
    };

    const handleSyncStatusChanged = (peerId: string, status: string) => {
      setSyncStatus((prev) => new Map(prev).set(peerId, status));
    };

    p2pClient.onPeerConnected(handlePeerConnected);
    p2pClient.onPeerDisconnected(handlePeerDisconnected);
    p2pClient.onSyncStatusChanged(handleSyncStatusChanged);

    return () => {
      // Cleanup listeners (if needed)
    };
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const storage = createStorage();
      const allPeers = await storage.getAllPeers();
      setPeers(allPeers);

      // Update connected peers
      const connected = p2pClient.getConnectedPeers();
      setConnectedPeerIds(new Set(connected));
    } catch (err) {
      console.error('Failed to refresh peers:', err);
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Auto-reconnect to known peers when network is restored
  useEffect(() => {
    if (networkStatus.isOnline && peers.length > 0) {
      // Attempt to reconnect to all known peers
      peers.forEach((peer) => {
        if (!connectedPeerIds.has(peer.peerId)) {
          p2pClient.connectToPeer(peer.peerId).catch((err) => {
            console.warn(`Auto-reconnect failed for peer ${peer.peerId}:`, err);
          });
        }
      });
    }
  }, [networkStatus.isOnline, peers, connectedPeerIds]);

  const handleReconnect = useCallback(async (peerId: string) => {
    try {
      await p2pClient.connectToPeer(peerId);
    } catch (err) {
      console.error(`Failed to reconnect to peer ${peerId}:`, err);
      showErrorToast(`Failed to reconnect to peer ${peerId.substring(0, 8)}...`);
    }
  }, []);

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
          <Text style={styles.headerTitle}>Peers</Text>
          {!networkStatus.isOnline && (
            <View style={styles.offlineBadge}>
              <Wifi size={12} color="#EF4444" />
              <Text style={styles.offlineBadgeText}>Offline</Text>
            </View>
          )}
        </View>
        <Text style={styles.headerSubtitle}>
          {connectedPeerIds.size} online
        </Text>
      </View>

      {/* Peers List */}
      <FlatList
        data={peers}
        keyExtractor={(item) => item.peerId}
        renderItem={({ item }) => (
          <PeerItem
            peer={item}
            isOnline={connectedPeerIds.has(item.peerId)}
            syncStatus={syncStatus.get(item.peerId)}
            onReconnect={() => handleReconnect(item.peerId)}
          />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={ACCENT}
            colors={[ACCENT]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              No peers discovered yet
            </Text>
          </View>
        }
      />
    </View>
  );
}

function PeerItem({
  peer,
  isOnline,
  syncStatus,
  onReconnect,
}: {
  peer: Peer;
  isOnline: boolean;
  syncStatus?: string;
  onReconnect: () => void;
}) {
  const truncatedPeerId = peer.peerId.substring(0, 8) + '...';
  const relativeTime = getRelativeTime(peer.lastSeen);
  const reputationPercent = Math.round(peer.reputationScore * 100);

  return (
    <View style={styles.peerItem}>
      {/* Status indicator and peer info */}
      <View style={styles.peerHeader}>
        <View style={styles.peerInfo}>
          {/* Online/Offline indicator */}
          <View style={styles.statusIndicatorContainer}>
            <Circle
              size={12}
              color={isOnline ? ONLINE_COLOR : OFFLINE_COLOR}
              fill={isOnline ? ONLINE_COLOR : OFFLINE_COLOR}
              strokeWidth={0}
            />
          </View>

          {/* Peer ID and status */}
          <View style={styles.peerDetails}>
            <Text style={styles.peerId}>{truncatedPeerId}</Text>
            <Text style={styles.peerStatus}>
              {isOnline ? 'Online' : 'Offline'}
            </Text>
          </View>
        </View>

        {/* Reconnect button for offline peers */}
        {!isOnline && (
          <TouchableOpacity
            style={styles.reconnectBtn}
            onPress={onReconnect}
            activeOpacity={0.7}
          >
            <RotateCw size={16} color={ACCENT} />
          </TouchableOpacity>
        )}
      </View>

      {/* Last seen and reputation */}
      <View style={styles.peerFooter}>
        <View style={styles.peerMetric}>
          <Text style={styles.metricLabel}>Last seen</Text>
          <Text style={styles.metricValue}>{relativeTime}</Text>
        </View>

        <View style={styles.peerMetric}>
          <Text style={styles.metricLabel}>Reputation</Text>
          <View style={styles.reputationBar}>
            <View
              style={[
                styles.reputationFill,
                { width: `${reputationPercent}%` },
              ]}
            />
          </View>
          <Text style={styles.metricValue}>{reputationPercent}%</Text>
        </View>
      </View>

      {/* Sync status indicator */}
      {syncStatus && (
        <View style={styles.syncStatusContainer}>
          <Text style={styles.syncStatusText}>
            {syncStatus === 'syncing' && '⟳ Syncing...'}
            {syncStatus === 'synced' && '✓ Synced'}
            {syncStatus === 'error' && '✕ Sync failed'}
          </Text>
        </View>
      )}
    </View>
  );
}

function getRelativeTime(timestamp: number): string {
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
    marginBottom: 4,
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
  headerSubtitle: {
    fontSize: 14,
    color: TEXT_SECONDARY,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  peerItem: {
    backgroundColor: 'rgba(229, 231, 235, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(229, 231, 235, 0.1)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  peerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  peerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  statusIndicatorContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  peerDetails: {
    flex: 1,
  },
  peerId: {
    fontSize: 14,
    fontWeight: '600',
    color: TEXT_PRIMARY,
    fontFamily: 'monospace',
  },
  peerStatus: {
    fontSize: 12,
    color: TEXT_SECONDARY,
    marginTop: 2,
  },
  reconnectBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  peerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 8,
  },
  peerMetric: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 11,
    color: TEXT_SECONDARY,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 13,
    fontWeight: '600',
    color: TEXT_PRIMARY,
  },
  reputationBar: {
    height: 6,
    backgroundColor: 'rgba(229, 231, 235, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  reputationFill: {
    height: '100%',
    backgroundColor: ACCENT,
  },
  syncStatusContainer: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 6,
  },
  syncStatusText: {
    fontSize: 12,
    fontWeight: '500',
    color: ACCENT,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: TEXT_SECONDARY,
    textAlign: 'center',
  },
});
