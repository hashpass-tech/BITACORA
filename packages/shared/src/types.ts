/**
 * Core type definitions for Bitácora P2P
 * Defines all data structures used throughout the application
 */

export type MemoStatus = 'pending' | 'verified' | 'disputed';
export type EdgeRelation = 'supports' | 'contradicts' | 'relates_to';

/**
 * Memo: A unit of knowledge in the Bitácora graph
 * Contains content, cryptographic signature, and Merkle proof metadata
 */
export interface Memo {
  id: string;              // UUID v4
  creator: string;         // peerId of creator
  timestamp: number;       // Unix epoch ms
  content: string;
  contentHash: string;     // SHA-256 hex of content
  signature: string;       // Ed25519 detached signature hex
  merkleProof: string[];   // Proof path hashes
  merkleRoot: string;      // Root at time of creation
  status: MemoStatus;
}

/**
 * Edge: A directed, weighted relationship between two Memos
 */
export interface Edge {
  id: string;              // UUID v4
  sourceId: string;        // Memo id
  targetId: string;        // Memo id
  relation: EdgeRelation;
  weight: number;          // 0..1
}

/**
 * Peer: A participant in the P2P network
 */
export interface Peer {
  peerId: string;
  publicKey: string;       // Ed25519 public key hex
  merkleRoot: string;
  lastSeen: number;        // Unix epoch ms
  reputationScore: number; // 0..1
}

/**
 * UserProfile: Local identity record
 */
export interface UserProfile {
  peerId: string;
  publicKey: string;       // Ed25519 public key hex
  secretKey: string;       // Ed25519 secret key hex
  displayName: string;
  createdAt: number;       // Unix epoch ms
}
