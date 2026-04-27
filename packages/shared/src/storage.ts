/**
 * Platform-agnostic storage abstraction layer
 * Defines the interface that all storage implementations (IndexedDB, SQLite) must follow
 * Requirement 7.1: Platform-agnostic storage interface
 */

import type { Memo, Edge, Peer, UserProfile } from './types';

/**
 * StorageAdapter: Platform-agnostic interface for persisting Bitácora data
 * Implementations: IndexedDB (browser), SQLite (React Native)
 * 
 * All methods are async to support both synchronous (IndexedDB) and asynchronous (SQLite) backends
 */
export interface StorageAdapter {
  /**
   * Memo operations
   */

  /**
   * Store a Memo in persistent storage
   * Requirement 5.5, 6.5: Persist all Memo fields atomically within a single transaction
   */
  putMemo(memo: Memo): Promise<void>;

  /**
   * Retrieve a Memo by id
   * Requirement 5.6, 6.6: Return complete Memo object or null if not found
   */
  getMemo(id: string): Promise<Memo | null>;

  /**
   * Retrieve all Memos from storage
   */
  getAllMemos(): Promise<Memo[]>;

  /**
   * Delete a Memo by id
   */
  deleteMemo(id: string): Promise<void>;

  /**
   * Edge operations
   */

  /**
   * Store an Edge in persistent storage
   * Requirement 5.5, 6.5: Persist all Edge fields atomically within a single transaction
   */
  putEdge(edge: Edge): Promise<void>;

  /**
   * Retrieve an Edge by id
   * Requirement 5.6, 6.6: Return complete Edge object or null if not found
   */
  getEdge(id: string): Promise<Edge | null>;

  /**
   * Retrieve all Edges connected to a specific Memo (either as source or target)
   */
  getEdgesByMemo(memoId: string): Promise<Edge[]>;

  /**
   * Peer operations
   */

  /**
   * Store a Peer record in persistent storage
   */
  putPeer(peer: Peer): Promise<void>;

  /**
   * Retrieve a Peer by peerId
   */
  getPeer(peerId: string): Promise<Peer | null>;

  /**
   * Retrieve all known Peers
   */
  getAllPeers(): Promise<Peer[]>;

  /**
   * UserProfile operations
   */

  /**
   * Retrieve the local UserProfile
   */
  getProfile(): Promise<UserProfile | null>;

  /**
   * Store the local UserProfile
   */
  putProfile(profile: UserProfile): Promise<void>;

  /**
   * Lifecycle operations
   */

  /**
   * Initialize the storage backend
   * For IndexedDB: open database, create object stores
   * For SQLite: open database, create tables
   * Requirement 5.1, 6.1: Create database and object stores/tables
   */
  initialize(): Promise<void>;

  /**
   * Close the storage backend and release resources
   */
  close(): Promise<void>;
}
