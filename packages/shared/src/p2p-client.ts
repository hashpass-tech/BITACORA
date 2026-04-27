/**
 * P2P Client for Bitácora P2P
 * Manages WebRTC peer connections, data channels, and event callbacks
 * Implements exponential backoff reconnection and JSON-encoded message protocol
 * 
 * Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 14.1, 14.2, 14.3, 14.4, 32.1
 */

import type { Memo, Edge } from './types';
import type { StorageAdapter } from './storage';
import type { CryptoModule } from './crypto';
import { DATA_CHANNEL_NAME, BACKOFF_CONFIG } from './constants';

/**
 * Data channel message types
 */
export type DataChannelMessageType =
  | 'sync-request'
  | 'sync-response'
  | 'tree-level'
  | 'tree-diff'
  | 'memos'
  | 'edges'
  | 'sync-complete'
  | 'memo'
  | 'edge';

/**
 * Generic data channel message with type field
 */
export interface DataChannelMessage {
  type: DataChannelMessageType;
  payload: unknown;
}

/**
 * P2P Client interface
 */
export interface P2PClient {
  initialize(storage: StorageAdapter, crypto: CryptoModule): Promise<void>;
  connectToPeer(peerId: string, offer?: RTCSessionDescriptionInit): Promise<void>;
  disconnectFromPeer(peerId: string): void;
  broadcastMemo(memo: Memo): void;
  broadcastEdge(edge: Edge): void;
  getConnectedPeers(): string[];
  onPeerConnected(callback: (peerId: string) => void): void;
  onPeerDisconnected(callback: (peerId: string) => void): void;
  onMemoReceived(callback: (memo: Memo) => void): void;
  onSyncStatusChanged(callback: (peerId: string, status: string) => void): void;
}

/**
 * Peer connection state tracking
 */
interface PeerConnectionState {
  connection: RTCPeerConnection;
  dataChannel?: RTCDataChannel;
  retryCount: number;
  retryTimeoutId?: NodeJS.Timeout;
  isConnecting: boolean;
}

/**
 * Create a P2P Client instance
 */
export function createP2PClient(): P2PClient {
  let storage: StorageAdapter;
  let crypto: CryptoModule;

  // Peer connection management
  const peerConnections = new Map<string, PeerConnectionState>();

  // Event callbacks
  const callbacks = {
    onPeerConnected: new Set<(peerId: string) => void>(),
    onPeerDisconnected: new Set<(peerId: string) => void>(),
    onMemoReceived: new Set<(memo: Memo) => void>(),
    onSyncStatusChanged: new Set<(peerId: string, status: string) => void>(),
  };

  /**
   * Calculate exponential backoff delay
   */
  function getBackoffDelay(retryCount: number): number {
    const delay = Math.min(
      BACKOFF_CONFIG.initialDelayMs * Math.pow(BACKOFF_CONFIG.factor, retryCount),
      BACKOFF_CONFIG.maxDelayMs
    );
    return delay;
  }

  /**
   * Create RTCPeerConnection with standard configuration
   */
  function createPeerConnection(): RTCPeerConnection {
    const config: RTCConfiguration = {
      iceServers: [
        { urls: ['stun:stun.l.google.com:19302'] },
        { urls: ['stun:stun1.l.google.com:19302'] },
      ],
    };
    return new RTCPeerConnection(config);
  }

  /**
   * Setup data channel event handlers
   */
  function setupDataChannel(dataChannel: RTCDataChannel, peerId: string): void {
    dataChannel.onopen = () => {
      console.log(`Data channel opened with peer ${peerId}`);
      callbacks.onSyncStatusChanged.forEach((cb) => cb(peerId, 'syncing'));
    };

    dataChannel.onclose = () => {
      console.log(`Data channel closed with peer ${peerId}`);
      const state = peerConnections.get(peerId);
      if (state) {
        state.dataChannel = undefined;
      }
    };

    dataChannel.onerror = (event) => {
      console.error(`Data channel error with peer ${peerId}:`, event);
    };

    dataChannel.onmessage = async (event) => {
      try {
        const message: DataChannelMessage = JSON.parse(event.data);
        await handleDataChannelMessage(message, peerId);
      } catch (error) {
        console.warn(`Failed to parse data channel message from ${peerId}:`, error);
      }
    };
  }

  /**
   * Handle incoming data channel messages
   */
  async function handleDataChannelMessage(
    message: DataChannelMessage,
    peerId: string
  ): Promise<void> {
    switch (message.type) {
      case 'memo': {
        const memo = message.payload as Memo;
        const peer = await storage.getPeer(peerId);
        if (!peer) {
          console.warn(`Received memo from unknown peer ${peerId}`);
          return;
        }

        const publicKeyHex = peer.publicKey;
        const publicKeyBytes = new Uint8Array(publicKeyHex.length / 2);
        for (let i = 0; i < publicKeyHex.length; i += 2) {
          publicKeyBytes[i / 2] = parseInt(publicKeyHex.substr(i, 2), 16);
        }

        const isValid = crypto.verifySignature(memo, publicKeyBytes);
        if (!isValid) {
          // Silently discard invalid memo with warning log (Requirement 32.5)
          console.warn(`[P2P] Invalid signature on memo ${memo.id} from peer ${peerId}. Memo discarded.`);
          return;
        }

        try {
          await storage.putMemo(memo);
          callbacks.onMemoReceived.forEach((cb) => cb(memo));
        } catch (error) {
          // Log storage error but don't crash (Requirement 32.2)
          console.error(`[P2P] Failed to store memo ${memo.id}:`, error);
        }
        break;
      }

      case 'edge': {
        const edge = message.payload as Edge;
        try {
          await storage.putEdge(edge);
        } catch (error) {
          // Log storage error but don't crash (Requirement 32.2)
          console.error(`[P2P] Failed to store edge ${edge.id}:`, error);
        }
        break;
      }

      case 'sync-request': {
        callbacks.onSyncStatusChanged.forEach((cb) => cb(peerId, 'syncing'));
        break;
      }

      case 'sync-complete': {
        callbacks.onSyncStatusChanged.forEach((cb) => cb(peerId, 'synced'));
        break;
      }

      default:
        console.warn(`Unknown message type: ${message.type}`);
    }
  }

  /**
   * Send a message on the data channel
   */
  function sendMessage(peerId: string, message: DataChannelMessage): void {
    const state = peerConnections.get(peerId);
    if (!state || !state.dataChannel || state.dataChannel.readyState !== 'open') {
      console.warn(`Data channel not ready for peer ${peerId}`);
      return;
    }

    try {
      state.dataChannel.send(JSON.stringify(message));
    } catch (error) {
      console.error(`Failed to send message to peer ${peerId}:`, error);
    }
  }

  /**
   * Attempt to reconnect to a peer with exponential backoff
   */
  function scheduleReconnect(peerId: string, client: P2PClient): void {
    const state = peerConnections.get(peerId);
    if (!state) return;

    if (state.retryCount >= BACKOFF_CONFIG.maxRetries) {
      console.log(`Max retries reached for peer ${peerId}, stopping reconnection attempts`);
      peerConnections.delete(peerId);
      callbacks.onPeerDisconnected.forEach((cb) => cb(peerId));
      return;
    }

    const delay = getBackoffDelay(state.retryCount);
    console.log(`Scheduling reconnect to peer ${peerId} in ${delay}ms (attempt ${state.retryCount + 1})`);

    state.retryTimeoutId = setTimeout(async () => {
      state.retryCount++;
      try {
        await client.connectToPeer(peerId);
      } catch (error) {
        console.error(`Reconnection attempt failed for peer ${peerId}:`, error);
      }
    }, delay);
  }

  /**
   * Setup RTCPeerConnection event handlers
   */
  function setupPeerConnection(connection: RTCPeerConnection, peerId: string, client: P2PClient): void {
    connection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log(`ICE candidate generated for peer ${peerId}`);
      }
    };

    connection.onconnectionstatechange = () => {
      console.log(`Connection state changed for peer ${peerId}: ${connection.connectionState}`);

      switch (connection.connectionState) {
        case 'connected': {
          const state = peerConnections.get(peerId);
          if (state) {
            state.retryCount = 0;
            state.isConnecting = false;
          }
          storage.getPeer(peerId).then((peer) => {
            if (peer) {
              peer.lastSeen = Date.now();
              storage.putPeer(peer).catch((error) => {
                console.error(`Failed to update peer ${peerId}:`, error);
              });
            }
          });
          callbacks.onPeerConnected.forEach((cb) => cb(peerId));
          break;
        }

        case 'disconnected':
        case 'failed':
        case 'closed': {
          const state = peerConnections.get(peerId);
          if (state) {
            state.isConnecting = false;
            if (connection.connectionState === 'failed') {
              scheduleReconnect(peerId, client);
            } else {
              callbacks.onPeerDisconnected.forEach((cb) => cb(peerId));
            }
          }
          break;
        }
      }
    };

    connection.ondatachannel = (event) => {
      const dataChannel = event.channel;
      if (dataChannel.label === DATA_CHANNEL_NAME) {
        const state = peerConnections.get(peerId);
        if (state) {
          state.dataChannel = dataChannel;
          setupDataChannel(dataChannel, peerId);
        }
      }
    };
  }

  const client: P2PClient = {
    async initialize(storageAdapter: StorageAdapter, cryptoModule: CryptoModule): Promise<void> {
      storage = storageAdapter;
      crypto = cryptoModule;
      console.log('P2P Client initialized');
    },

    async connectToPeer(peerId: string, offer?: RTCSessionDescriptionInit): Promise<void> {
      let state = peerConnections.get(peerId);
      if (state) {
        if (state.isConnecting) {
          console.log(`Already connecting to peer ${peerId}`);
          return;
        }
        if (state.connection.connectionState === 'connected') {
          console.log(`Already connected to peer ${peerId}`);
          return;
        }
      }

      const connection = createPeerConnection();
      state = {
        connection,
        retryCount: 0,
        isConnecting: true,
      };
      peerConnections.set(peerId, state);

      setupPeerConnection(connection, peerId, client);

      try {
        if (offer) {
          await connection.setRemoteDescription(new RTCSessionDescription(offer));
          const answer = await connection.createAnswer();
          await connection.setLocalDescription(answer);
          console.log(`Created answer for peer ${peerId}`);
        } else {
          const dataChannel = connection.createDataChannel(DATA_CHANNEL_NAME, {
            ordered: true,
          });
          state.dataChannel = dataChannel;
          setupDataChannel(dataChannel, peerId);

          const offer = await connection.createOffer();
          await connection.setLocalDescription(offer);
          console.log(`Created offer for peer ${peerId}`);
        }
      } catch (error) {
        console.error(`Failed to establish connection with peer ${peerId}:`, error);
        state.isConnecting = false;
        scheduleReconnect(peerId, client);
      }
    },

    disconnectFromPeer(peerId: string): void {
      const state = peerConnections.get(peerId);
      if (!state) return;

      if (state.retryTimeoutId) {
        clearTimeout(state.retryTimeoutId);
      }

      if (state.dataChannel) {
        state.dataChannel.close();
      }

      state.connection.close();

      peerConnections.delete(peerId);
      callbacks.onPeerDisconnected.forEach((cb) => cb(peerId));
    },

    broadcastMemo(memo: Memo): void {
      const message: DataChannelMessage = {
        type: 'memo',
        payload: memo,
      };

      peerConnections.forEach((_, peerId) => {
        sendMessage(peerId, message);
      });
    },

    broadcastEdge(edge: Edge): void {
      const message: DataChannelMessage = {
        type: 'edge',
        payload: edge,
      };

      peerConnections.forEach((_, peerId) => {
        sendMessage(peerId, message);
      });
    },

    getConnectedPeers(): string[] {
      const connected: string[] = [];
      peerConnections.forEach((state, peerId) => {
        if (state.connection.connectionState === 'connected') {
          connected.push(peerId);
        }
      });
      return connected;
    },

    onPeerConnected(callback: (peerId: string) => void): void {
      callbacks.onPeerConnected.add(callback);
    },

    onPeerDisconnected(callback: (peerId: string) => void): void {
      callbacks.onPeerDisconnected.add(callback);
    },

    onMemoReceived(callback: (memo: Memo) => void): void {
      callbacks.onMemoReceived.add(callback);
    },

    onSyncStatusChanged(callback: (peerId: string, status: string) => void): void {
      callbacks.onSyncStatusChanged.add(callback);
    },
  };

  return client;
}

// Export singleton instance
export const p2pClient = createP2PClient();
