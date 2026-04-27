/**
 * Entity creation helpers for Bitácora P2P
 * Provides factory functions for creating Memos and Edges with validation
 */

import type { Memo, Edge, UserProfile, MemoStatus, EdgeRelation } from './types';
import type { CryptoModule } from './crypto';
import type { StorageAdapter } from './storage';

/**
 * Generate a UUID v4 string
 * Uses crypto.getRandomValues for random bytes
 */
function generateUUIDv4(): string {
  const bytes = new Uint8Array(16);
  globalThis.crypto.getRandomValues(bytes);

  // Set version to 4 (random)
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  // Set variant to RFC 4122
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/**
 * Create a new Memo with all required fields
 *
 * @param content - The memo content string
 * @param profile - The user profile containing peerId and secretKey
 * @param crypto - The crypto module for hashing and signing
 * @returns A complete Memo object ready to be stored
 *
 * Validates: Requirements 1.2, 1.3, 1.4
 */
export async function createMemo(
  content: string,
  profile: UserProfile,
  crypto: CryptoModule
): Promise<Memo> {
  // 1. Generate UUID v4 for memo id
  const id = generateUUIDv4();

  // 2. Compute contentHash using crypto module
  const contentHash = await crypto.computeContentHash(content);

  // 3. Set timestamp to current Unix epoch in milliseconds
  const timestamp = Date.now();

  // 4. Create memo object for signing (without signature yet)
  const memoForSigning = {
    id,
    creator: profile.peerId,
    timestamp,
    contentHash,
  };

  // 5. Sign the memo using profile's secretKey
  const secretKeyBytes = new Uint8Array(
    profile.secretKey.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
  );
  const signature = crypto.signMemo(memoForSigning, secretKeyBytes);

  // 6. Create and return the complete Memo
  const memo: Memo = {
    id,
    creator: profile.peerId,
    timestamp,
    content,
    contentHash,
    signature,
    merkleProof: [],
    merkleRoot: '',
    status: 'pending' as MemoStatus,
  };

  return memo;
}

/**
 * Create a new Edge with validation
 *
 * @param sourceId - The id of the source Memo
 * @param targetId - The id of the target Memo
 * @param relation - The type of relationship
 * @param weight - The weight of the relationship (0-1)
 * @param storage - The storage adapter for validating Memo references
 * @returns A complete Edge object if validation passes
 * @throws Error if sourceId or targetId don't reference existing Memos
 *
 * Validates: Requirements 2.2, 2.3
 */
export async function createEdge(
  sourceId: string,
  targetId: string,
  relation: EdgeRelation,
  weight: number,
  storage: StorageAdapter
): Promise<Edge> {
  // 1. Validate that both sourceId and targetId reference existing Memos
  const sourceMemo = await storage.getMemo(sourceId);
  if (!sourceMemo) {
    throw new Error(`Source Memo with id "${sourceId}" does not exist in storage`);
  }

  const targetMemo = await storage.getMemo(targetId);
  if (!targetMemo) {
    throw new Error(`Target Memo with id "${targetId}" does not exist in storage`);
  }

  // 2. Generate UUID v4 for edge id
  const id = generateUUIDv4();

  // 3. Create and return the Edge
  const edge: Edge = {
    id,
    sourceId,
    targetId,
    relation,
    weight,
  };

  return edge;
}
