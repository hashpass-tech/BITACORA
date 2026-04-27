/**
 * SQLite Storage Adapter for Bitácora P2P
 * Implements StorageAdapter interface for React Native environments
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6
 */

import type { StorageAdapter } from './storage';
import type { Memo, Edge, Peer, UserProfile } from './types';
import { SQLITE_DB_FILE } from './constants';

// Import expo-sqlite - this will be available in React Native environment
let SQLite: any;
try {
  SQLite = require('expo-sqlite');
} catch {
  // SQLite not available in non-React Native environment
}

/**
 * SQLite Storage Adapter
 * Manages all CRUD operations with proper transaction handling for atomicity
 * Uses expo-sqlite for React Native
 */
export class SQLiteStorage implements StorageAdapter {
  private db: any = null;

  /**
   * Initialize the SQLite database and create tables
   * Requirement 6.1: Create database named "bitacora-p2p.db"
   * Requirement 6.2-6.4: Create tables with appropriate columns, types, indexes, and CHECK constraints
   */
  async initialize(): Promise<void> {
    if (!SQLite) {
      throw new Error('expo-sqlite not available');
    }

    this.db = await SQLite.openDatabaseAsync(SQLITE_DB_FILE);

    // Create memos table
    // Requirement 6.2: Columns matching Memo interface with appropriate SQL types
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS memos (
        id TEXT PRIMARY KEY,
        creator TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        content TEXT NOT NULL,
        contentHash TEXT NOT NULL,
        signature TEXT NOT NULL,
        merkleProof TEXT NOT NULL,
        merkleRoot TEXT NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('pending','verified','disputed'))
      );
      CREATE INDEX IF NOT EXISTS idx_memos_creator ON memos(creator);
      CREATE INDEX IF NOT EXISTS idx_memos_timestamp ON memos(timestamp);
      CREATE INDEX IF NOT EXISTS idx_memos_contentHash ON memos(contentHash);
    `);

    // Create edges table
    // Requirement 6.3: Columns matching Edge interface with appropriate SQL types
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS edges (
        id TEXT PRIMARY KEY,
        sourceId TEXT NOT NULL REFERENCES memos(id),
        targetId TEXT NOT NULL REFERENCES memos(id),
        relation TEXT NOT NULL CHECK(relation IN ('supports','contradicts','relates_to')),
        weight REAL NOT NULL CHECK(weight >= 0 AND weight <= 1)
      );
      CREATE INDEX IF NOT EXISTS idx_edges_sourceId ON edges(sourceId);
      CREATE INDEX IF NOT EXISTS idx_edges_targetId ON edges(targetId);
    `);

    // Create peers table
    // Requirement 6.4: Columns matching Peer interface with appropriate SQL types
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS peers (
        peerId TEXT PRIMARY KEY,
        publicKey TEXT NOT NULL,
        merkleRoot TEXT NOT NULL,
        lastSeen INTEGER NOT NULL,
        reputationScore REAL NOT NULL CHECK(reputationScore >= 0 AND reputationScore <= 1)
      );
      CREATE INDEX IF NOT EXISTS idx_peers_lastSeen ON peers(lastSeen);
    `);

    // Create userProfile table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS userProfile (
        peerId TEXT PRIMARY KEY,
        publicKey TEXT NOT NULL,
        secretKey TEXT NOT NULL,
        displayName TEXT NOT NULL,
        createdAt INTEGER NOT NULL
      );
    `);
  }

  /**
   * Close the database connection
   */
  async close(): Promise<void> {
    if (this.db) {
      await this.db.closeAsync();
      this.db = null;
    }
  }

  /**
   * Store a Memo in persistent storage
   * Requirement 6.5: Persist all Memo fields atomically within a single transaction
   * Serialize merkleProof array as JSON string for storage
   */
  async putMemo(memo: Memo): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const merkleProofJson = JSON.stringify(memo.merkleProof);

    await this.db.runAsync(
      `INSERT OR REPLACE INTO memos (id, creator, timestamp, content, contentHash, signature, merkleProof, merkleRoot, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        memo.id,
        memo.creator,
        memo.timestamp,
        memo.content,
        memo.contentHash,
        memo.signature,
        merkleProofJson,
        memo.merkleRoot,
        memo.status,
      ]
    );
  }

  /**
   * Retrieve a Memo by id
   * Requirement 6.6: Return complete Memo object or null if not found
   */
  async getMemo(id: string): Promise<Memo | null> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const result = await this.db.getFirstAsync(
      'SELECT * FROM memos WHERE id = ?',
      [id]
    );

    if (!result) {
      return null;
    }

    return this.rowToMemo(result);
  }

  /**
   * Retrieve all Memos from storage
   */
  async getAllMemos(): Promise<Memo[]> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const results = await this.db.getAllAsync(
      'SELECT * FROM memos'
    );

    return results.map((row: any) => this.rowToMemo(row));
  }

  /**
   * Delete a Memo by id
   */
  async deleteMemo(id: string): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    await this.db.runAsync('DELETE FROM memos WHERE id = ?', [id]);
  }

  /**
   * Store an Edge in persistent storage
   * Requirement 6.5: Persist all Edge fields atomically within a single transaction
   */
  async putEdge(edge: Edge): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    await this.db.runAsync(
      `INSERT OR REPLACE INTO edges (id, sourceId, targetId, relation, weight)
       VALUES (?, ?, ?, ?, ?)`,
      [edge.id, edge.sourceId, edge.targetId, edge.relation, edge.weight]
    );
  }

  /**
   * Retrieve an Edge by id
   * Requirement 6.6: Return complete Edge object or null if not found
   */
  async getEdge(id: string): Promise<Edge | null> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const result = await this.db.getFirstAsync(
      'SELECT * FROM edges WHERE id = ?',
      [id]
    );

    if (!result) {
      return null;
    }

    return this.rowToEdge(result);
  }

  /**
   * Retrieve all Edges connected to a specific Memo (either as source or target)
   */
  async getEdgesByMemo(memoId: string): Promise<Edge[]> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const results = await this.db.getAllAsync(
      'SELECT * FROM edges WHERE sourceId = ? OR targetId = ?',
      [memoId, memoId]
    );

    return results.map((row: any) => this.rowToEdge(row));
  }

  /**
   * Store a Peer record in persistent storage
   */
  async putPeer(peer: Peer): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    await this.db.runAsync(
      `INSERT OR REPLACE INTO peers (peerId, publicKey, merkleRoot, lastSeen, reputationScore)
       VALUES (?, ?, ?, ?, ?)`,
      [
        peer.peerId,
        peer.publicKey,
        peer.merkleRoot,
        peer.lastSeen,
        peer.reputationScore,
      ]
    );
  }

  /**
   * Retrieve a Peer by peerId
   */
  async getPeer(peerId: string): Promise<Peer | null> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const result = await this.db.getFirstAsync(
      'SELECT * FROM peers WHERE peerId = ?',
      [peerId]
    );

    if (!result) {
      return null;
    }

    return this.rowToPeer(result);
  }

  /**
   * Retrieve all known Peers
   */
  async getAllPeers(): Promise<Peer[]> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const results = await this.db.getAllAsync(
      'SELECT * FROM peers'
    );

    return results.map((row: any) => this.rowToPeer(row));
  }

  /**
   * Retrieve the local UserProfile
   */
  async getProfile(): Promise<UserProfile | null> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const result = await this.db.getFirstAsync(
      'SELECT * FROM userProfile LIMIT 1'
    );

    if (!result) {
      return null;
    }

    return this.rowToProfile(result);
  }

  /**
   * Store the local UserProfile
   */
  async putProfile(profile: UserProfile): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    await this.db.runAsync(
      `INSERT OR REPLACE INTO userProfile (peerId, publicKey, secretKey, displayName, createdAt)
       VALUES (?, ?, ?, ?, ?)`,
      [
        profile.peerId,
        profile.publicKey,
        profile.secretKey,
        profile.displayName,
        profile.createdAt,
      ]
    );
  }

  /**
   * Convert a database row to a Memo object
   * Deserialize merkleProof from JSON string
   */
  private rowToMemo(row: any): Memo {
    return {
      id: row.id,
      creator: row.creator,
      timestamp: row.timestamp,
      content: row.content,
      contentHash: row.contentHash,
      signature: row.signature,
      merkleProof: JSON.parse(row.merkleProof),
      merkleRoot: row.merkleRoot,
      status: row.status,
    };
  }

  /**
   * Convert a database row to an Edge object
   */
  private rowToEdge(row: any): Edge {
    return {
      id: row.id,
      sourceId: row.sourceId,
      targetId: row.targetId,
      relation: row.relation,
      weight: row.weight,
    };
  }

  /**
   * Convert a database row to a Peer object
   */
  private rowToPeer(row: any): Peer {
    return {
      peerId: row.peerId,
      publicKey: row.publicKey,
      merkleRoot: row.merkleRoot,
      lastSeen: row.lastSeen,
      reputationScore: row.reputationScore,
    };
  }

  /**
   * Convert a database row to a UserProfile object
   */
  private rowToProfile(row: any): UserProfile {
    return {
      peerId: row.peerId,
      publicKey: row.publicKey,
      secretKey: row.secretKey,
      displayName: row.displayName,
      createdAt: row.createdAt,
    };
  }
}
