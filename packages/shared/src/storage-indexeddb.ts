/**
 * IndexedDB Storage Adapter for Bitácora P2P
 * Implements StorageAdapter interface for browser environments
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6
 */

import type { StorageAdapter } from './storage';
import type { Memo, Edge, Peer, UserProfile } from './types';
import {
  DB_NAME,
  DB_VERSION,
  INDEXEDDB_STORES,
  INDEXEDDB_INDEXES,
} from './constants';

/**
 * IndexedDB Storage Adapter
 * Manages all CRUD operations with proper transaction handling for atomicity
 */
export class IndexedDBStorage implements StorageAdapter {
  private db: IDBDatabase | null = null;

  /**
   * Initialize the IndexedDB database and create object stores
   * Requirement 5.1: Create database named "bitacora-p2p" with version 1
   * Requirement 5.2-5.4: Create object stores with appropriate keyPaths and indexes
   */
  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(new Error(`Failed to open IndexedDB: ${request.error}`));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create memos object store
        // Requirement 5.2: keyPath: id, indexes: creator, timestamp, contentHash
        if (!db.objectStoreNames.contains(INDEXEDDB_STORES.MEMOS)) {
          const memosStore = db.createObjectStore(INDEXEDDB_STORES.MEMOS, {
            keyPath: 'id',
          });
          memosStore.createIndex(
            INDEXEDDB_INDEXES.MEMOS_CREATOR,
            INDEXEDDB_INDEXES.MEMOS_CREATOR
          );
          memosStore.createIndex(
            INDEXEDDB_INDEXES.MEMOS_TIMESTAMP,
            INDEXEDDB_INDEXES.MEMOS_TIMESTAMP
          );
          memosStore.createIndex(
            INDEXEDDB_INDEXES.MEMOS_CONTENT_HASH,
            INDEXEDDB_INDEXES.MEMOS_CONTENT_HASH
          );
        }

        // Create edges object store
        // Requirement 5.3: keyPath: id, indexes: sourceId, targetId
        if (!db.objectStoreNames.contains(INDEXEDDB_STORES.EDGES)) {
          const edgesStore = db.createObjectStore(INDEXEDDB_STORES.EDGES, {
            keyPath: 'id',
          });
          edgesStore.createIndex(
            INDEXEDDB_INDEXES.EDGES_SOURCE_ID,
            INDEXEDDB_INDEXES.EDGES_SOURCE_ID
          );
          edgesStore.createIndex(
            INDEXEDDB_INDEXES.EDGES_TARGET_ID,
            INDEXEDDB_INDEXES.EDGES_TARGET_ID
          );
        }

        // Create peers object store
        // Requirement 5.4: keyPath: peerId, index: lastSeen
        if (!db.objectStoreNames.contains(INDEXEDDB_STORES.PEERS)) {
          const peersStore = db.createObjectStore(INDEXEDDB_STORES.PEERS, {
            keyPath: 'peerId',
          });
          peersStore.createIndex(
            INDEXEDDB_INDEXES.PEERS_LAST_SEEN,
            INDEXEDDB_INDEXES.PEERS_LAST_SEEN
          );
        }

        // Create userProfile object store
        if (!db.objectStoreNames.contains(INDEXEDDB_STORES.USER_PROFILE)) {
          db.createObjectStore(INDEXEDDB_STORES.USER_PROFILE, {
            keyPath: 'peerId',
          });
        }
      };
    });
  }

  /**
   * Close the database connection
   */
  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  /**
   * Store a Memo in persistent storage
   * Requirement 5.5: Persist all Memo fields atomically within a single transaction
   */
  async putMemo(memo: Memo): Promise<void> {
    await this.executeTransaction(
      INDEXEDDB_STORES.MEMOS,
      'readwrite',
      (store) => {
        return store.put(memo);
      }
    );
  }

  /**
   * Retrieve a Memo by id
   * Requirement 5.6: Return complete Memo object or null if not found
   */
  async getMemo(id: string): Promise<Memo | null> {
    return this.executeTransaction(
      INDEXEDDB_STORES.MEMOS,
      'readonly',
      (store) => {
        return store.get(id);
      }
    );
  }

  /**
   * Retrieve all Memos from storage
   */
  async getAllMemos(): Promise<Memo[]> {
    return this.executeTransaction(
      INDEXEDDB_STORES.MEMOS,
      'readonly',
      (store) => {
        return store.getAll();
      }
    );
  }

  /**
   * Delete a Memo by id
   */
  async deleteMemo(id: string): Promise<void> {
    await this.executeTransaction(
      INDEXEDDB_STORES.MEMOS,
      'readwrite',
      (store) => {
        return store.delete(id);
      }
    );
  }

  /**
   * Store an Edge in persistent storage
   * Requirement 5.5: Persist all Edge fields atomically within a single transaction
   */
  async putEdge(edge: Edge): Promise<void> {
    await this.executeTransaction(
      INDEXEDDB_STORES.EDGES,
      'readwrite',
      (store) => {
        return store.put(edge);
      }
    );
  }

  /**
   * Retrieve an Edge by id
   * Requirement 5.6: Return complete Edge object or null if not found
   */
  async getEdge(id: string): Promise<Edge | null> {
    return this.executeTransaction(
      INDEXEDDB_STORES.EDGES,
      'readonly',
      (store) => {
        return store.get(id);
      }
    );
  }

  /**
   * Retrieve all Edges connected to a specific Memo (either as source or target)
   */
  async getEdgesByMemo(memoId: string): Promise<Edge[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction(
        [INDEXEDDB_STORES.EDGES],
        'readonly'
      );
      const store = transaction.objectStore(INDEXEDDB_STORES.EDGES);
      const sourceIndex = store.index(INDEXEDDB_INDEXES.EDGES_SOURCE_ID);
      const targetIndex = store.index(INDEXEDDB_INDEXES.EDGES_TARGET_ID);

      const edges: Edge[] = [];
      let completed = 0;

      // Query edges where sourceId matches
      const sourceRequest = sourceIndex.getAll(memoId);
      sourceRequest.onsuccess = () => {
        edges.push(...(sourceRequest.result as Edge[]));
        completed++;
        if (completed === 2) {
          resolve(edges);
        }
      };
      sourceRequest.onerror = () => {
        reject(new Error(`Failed to query edges by sourceId: ${sourceRequest.error}`));
      };

      // Query edges where targetId matches
      const targetRequest = targetIndex.getAll(memoId);
      targetRequest.onsuccess = () => {
        edges.push(...(targetRequest.result as Edge[]));
        completed++;
        if (completed === 2) {
          resolve(edges);
        }
      };
      targetRequest.onerror = () => {
        reject(new Error(`Failed to query edges by targetId: ${targetRequest.error}`));
      };

      transaction.onerror = () => {
        reject(new Error(`Transaction failed: ${transaction.error}`));
      };
    });
  }

  /**
   * Store a Peer record in persistent storage
   */
  async putPeer(peer: Peer): Promise<void> {
    await this.executeTransaction(
      INDEXEDDB_STORES.PEERS,
      'readwrite',
      (store) => {
        return store.put(peer);
      }
    );
  }

  /**
   * Retrieve a Peer by peerId
   */
  async getPeer(peerId: string): Promise<Peer | null> {
    return this.executeTransaction(
      INDEXEDDB_STORES.PEERS,
      'readonly',
      (store) => {
        return store.get(peerId);
      }
    );
  }

  /**
   * Retrieve all known Peers
   */
  async getAllPeers(): Promise<Peer[]> {
    return this.executeTransaction(
      INDEXEDDB_STORES.PEERS,
      'readonly',
      (store) => {
        return store.getAll();
      }
    );
  }

  /**
   * Retrieve the local UserProfile
   */
  async getProfile(): Promise<UserProfile | null> {
    return this.executeTransaction(
      INDEXEDDB_STORES.USER_PROFILE,
      'readonly',
      (store) => {
        return store.getAll();
      }
    ).then((profiles) => {
      return profiles.length > 0 ? profiles[0] : null;
    });
  }

  /**
   * Store the local UserProfile
   */
  async putProfile(profile: UserProfile): Promise<void> {
    await this.executeTransaction(
      INDEXEDDB_STORES.USER_PROFILE,
      'readwrite',
      (store) => {
        return store.put(profile);
      }
    );
  }

  /**
   * Execute a transaction on a single object store
   * Requirement: All writes use single transactions for atomicity
   */
  private executeTransaction<T>(
    storeName: string,
    mode: IDBTransactionMode,
    operation: (store: IDBObjectStore) => IDBRequest<T>
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([storeName], mode);
      const store = transaction.objectStore(storeName);
      const request = operation(store);

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(new Error(`Operation failed: ${request.error}`));
      };

      transaction.onerror = () => {
        reject(new Error(`Transaction failed: ${transaction.error}`));
      };

      transaction.onabort = () => {
        reject(new Error('Transaction aborted'));
      };
    });
  }
}
