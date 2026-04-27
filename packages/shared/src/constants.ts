/**
 * Shared constants for Bitácora P2P
 */

// Database configuration
export const DB_NAME = 'bitacora-p2p';
export const DB_VERSION = 1;

// Data channel configuration
export const DATA_CHANNEL_NAME = 'bitacora-sync';

// Backoff configuration for reconnection
export const BACKOFF_CONFIG = {
  initialDelayMs: 1000,      // 1 second
  maxDelayMs: 30000,         // 30 seconds
  factor: 2,                 // exponential backoff factor
  maxRetries: 5,             // maximum retry attempts
};

// IndexedDB object stores
export const INDEXEDDB_STORES = {
  MEMOS: 'memos',
  EDGES: 'edges',
  PEERS: 'peers',
  USER_PROFILE: 'userProfile',
};

// IndexedDB indexes
export const INDEXEDDB_INDEXES = {
  MEMOS_CREATOR: 'creator',
  MEMOS_TIMESTAMP: 'timestamp',
  MEMOS_CONTENT_HASH: 'contentHash',
  EDGES_SOURCE_ID: 'sourceId',
  EDGES_TARGET_ID: 'targetId',
  PEERS_LAST_SEEN: 'lastSeen',
};

// SQLite database file
export const SQLITE_DB_FILE = 'bitacora-p2p.db';

// Default reputation score for new peers
export const DEFAULT_PEER_REPUTATION = 0.5;

// QR code payload size limit (alphanumeric characters)
export const QR_PAYLOAD_MAX_SIZE = 4296;
