/**
 * Sync Protocol for Bitácora P2P
 * Implements Merkle tree-based differential synchronization
 * - Exchange Merkle roots (O(1) comparison)
 * - Level-by-level hash exchange to find divergent subtrees (O(log n))
 * - Request only missing memos from divergent leaves
 * - Verify signatures on received memos before storing
 * - Update Merkle tree with new leaves after storing
 * - Track sync status: idle, syncing, complete, error
 *
 * Requirements: 18.1, 18.2, 18.3, 18.4, 19.1, 19.2, 19.3, 19.4, 19.5, 20.1, 20.2, 20.3
 */

import type { Memo } from './types';
import type { StorageAdapter } from './storage';
import type { CryptoModule } from './crypto';
import type { MerkleTree } from './merkle';

/**
 * Sync message types and payloads
 */
export interface SyncRequestPayload {
  merkleRoot: string;
}

export interface SyncResponsePayload {
  status: 'in-sync' | 'diff';
  nodeHashes?: string[];
}

export interface TreeLevelPayload {
  level: number;
  hashes: string[];
}

export interface TreeDiffPayload {
  missingHashes: string[];
}

export interface MemosPayload {
  memos: Memo[];
}

export interface SyncCompletePayload {
  newRoot: string;
}

export type SyncMessagePayload =
  | SyncRequestPayload
  | SyncResponsePayload
  | TreeLevelPayload
  | TreeDiffPayload
  | MemosPayload
  | SyncCompletePayload;

export interface SyncMessage {
  type: 'sync-request' | 'sync-response' | 'tree-level' | 'tree-diff' | 'memos' | 'sync-complete';
  payload: SyncMessagePayload;
}

export type SyncStatus = 'idle' | 'syncing' | 'complete' | 'error';

/**
 * Sync Protocol interface
 */
export interface SyncProtocol {
  initSync(remotePeerId: string): Promise<void>;
  handleMessage(message: SyncMessage, fromPeerId: string): Promise<SyncMessage | null>;
  getStatus(): SyncStatus;
}

/**
 * Internal sync state for tracking ongoing syncs
 */
interface SyncState {
  status: SyncStatus;
  remotePeerId: string;
  remoteMerkleRoot: string;
  currentLevel: number;
  maxLevel: number;
  divergentHashes: Set<string>;
  receivedMemos: Map<string, Memo>;
  pendingMemos: Set<string>;
}

/**
 * Create a SyncProtocol instance
 */
export function createSyncProtocol(
  storage: StorageAdapter,
  crypto: CryptoModule,
  merkleTree: MerkleTree,
  sendMessage: (peerId: string, message: SyncMessage) => void
): SyncProtocol {
  // Track sync state per peer
  const syncStates = new Map<string, SyncState>();
  let currentStatus: SyncStatus = 'idle';

  /**
   * Resolve conflict between two memos with same id
   * Returns the memo that should be kept
   */
  function resolveConflict(memo1: Memo, memo2: Memo): Memo {
    // Earlier timestamp wins
    if (memo1.timestamp !== memo2.timestamp) {
      return memo1.timestamp < memo2.timestamp ? memo1 : memo2;
    }
    // If timestamps equal, lexicographically smaller contentHash wins
    return memo1.contentHash < memo2.contentHash ? memo1 : memo2;
  }

  /**
   * Get all content hashes from local storage
   */
  async function getLocalContentHashes(): Promise<string[]> {
    const memos = await storage.getAllMemos();
    return memos.map((m) => m.contentHash).sort();
  }

  /**
   * Get memos by their content hashes
   */
  async function getMemosByContentHashes(hashes: string[]): Promise<Memo[]> {
    const allMemos = await storage.getAllMemos();
    const hashSet = new Set(hashes);
    return allMemos.filter((m) => hashSet.has(m.contentHash));
  }

  /**
   * Verify and store a memo
   */
  async function verifyAndStoreMemo(memo: Memo, remotePeerId: string): Promise<boolean> {
    try {
      // Get the peer's public key
      const peer = await storage.getPeer(remotePeerId);
      if (!peer) {
        console.warn(`Cannot verify memo: peer ${remotePeerId} not found`);
        return false;
      }

      // Convert hex public key to Uint8Array
      const publicKeyHex = peer.publicKey;
      const publicKeyBytes = new Uint8Array(publicKeyHex.length / 2);
      for (let i = 0; i < publicKeyHex.length; i += 2) {
        publicKeyBytes[i / 2] = parseInt(publicKeyHex.substring(i, i + 2), 16);
      }

      // Verify signature
      const isValid = crypto.verifySignature(memo, publicKeyBytes);
      if (!isValid) {
        console.warn(`Invalid signature on memo ${memo.id} from peer ${remotePeerId}`);
        return false;
      }

      // Check for conflicts with existing memo
      const existingMemo = await storage.getMemo(memo.id);
      if (existingMemo && existingMemo.contentHash !== memo.contentHash) {
        // Conflict: resolve deterministically
        const resolved = resolveConflict(existingMemo, memo);
        if (resolved.id === memo.id && resolved.contentHash === memo.contentHash) {
          // New memo wins, store it
          await storage.putMemo(memo);
        }
        // Otherwise keep existing memo
        return true;
      }

      // Store the memo
      await storage.putMemo(memo);
      return true;
    } catch (error) {
      console.error(`Error verifying memo ${memo.id}:`, error);
      return false;
    }
  }

  /**
   * Update merkle tree with new memos
   */
  async function updateMerkleTree(): Promise<void> {
    const contentHashes = await getLocalContentHashes();
    await merkleTree.build(contentHashes);
  }

  const protocol: SyncProtocol = {
    async initSync(remotePeerId: string): Promise<void> {
      // Initialize sync state
      const state: SyncState = {
        status: 'syncing',
        remotePeerId,
        remoteMerkleRoot: '',
        currentLevel: 0,
        maxLevel: 0,
        divergentHashes: new Set(),
        receivedMemos: new Map(),
        pendingMemos: new Set(),
      };
      syncStates.set(remotePeerId, state);
      currentStatus = 'syncing';

      // Send sync-request with local merkle root
      const message: SyncMessage = {
        type: 'sync-request',
        payload: {
          merkleRoot: merkleTree.root,
        },
      };
      sendMessage(remotePeerId, message);
    },

    async handleMessage(message: SyncMessage, fromPeerId: string): Promise<SyncMessage | null> {
      try {
        switch (message.type) {
          case 'sync-request': {
            const payload = message.payload as SyncRequestPayload;
            const localRoot = merkleTree.root;

            // Compare roots
            if (payload.merkleRoot === localRoot) {
              // Roots match, no sync needed
              currentStatus = 'complete';
              const response: SyncMessage = {
                type: 'sync-response',
                payload: {
                  status: 'in-sync',
                },
              };
              return response;
            }

            // Roots differ, initiate level-by-level exchange
            const state: SyncState = {
              status: 'syncing',
              remotePeerId: fromPeerId,
              remoteMerkleRoot: payload.merkleRoot,
              currentLevel: 0,
              maxLevel: 10,
              divergentHashes: new Set(),
              receivedMemos: new Map(),
              pendingMemos: new Set(),
            };
            syncStates.set(fromPeerId, state);
            currentStatus = 'syncing';

            // Get local hashes at level 0 (root)
            const localHashes = merkleTree.getNodeHashesAtLevel(0);

            const response: SyncMessage = {
              type: 'sync-response',
              payload: {
                status: 'diff',
                nodeHashes: localHashes,
              },
            };
            return response;
          }

          case 'sync-response': {
            const payload = message.payload as SyncResponsePayload;
            let state = syncStates.get(fromPeerId);

            if (!state) {
              // Create state if it doesn't exist (responder side)
              state = {
                status: 'syncing',
                remotePeerId: fromPeerId,
                remoteMerkleRoot: '',
                currentLevel: 0,
                maxLevel: 10,
                divergentHashes: new Set(),
                receivedMemos: new Map(),
                pendingMemos: new Set(),
              };
              syncStates.set(fromPeerId, state);
            }

            if (payload.status === 'in-sync') {
              // Remote is in sync, complete
              state.status = 'complete';
              currentStatus = 'complete';

              const response: SyncMessage = {
                type: 'sync-complete',
                payload: {
                  newRoot: merkleTree.root,
                },
              };
              return response;
            }

            // Status is 'diff', start level-by-level exchange
            state.currentLevel = 0;

            // Send first tree-level message
            const localHashes = merkleTree.getNodeHashesAtLevel(0);
            const response: SyncMessage = {
              type: 'tree-level',
              payload: {
                level: 0,
                hashes: localHashes,
              },
            };
            return response;
          }

          case 'tree-level': {
            const payload = message.payload as TreeLevelPayload;
            let state = syncStates.get(fromPeerId);

            if (!state) {
              // Create state if it doesn't exist
              state = {
                status: 'syncing',
                remotePeerId: fromPeerId,
                remoteMerkleRoot: '',
                currentLevel: 0,
                maxLevel: 10,
                divergentHashes: new Set(),
                receivedMemos: new Map(),
                pendingMemos: new Set(),
              };
              syncStates.set(fromPeerId, state);
            }

            // Find divergent subtrees at this level
            const divergent = merkleTree.findDivergentSubtrees(payload.hashes, payload.level);

            const response: SyncMessage = {
              type: 'tree-diff',
              payload: {
                missingHashes: divergent,
              },
            };
            return response;
          }

          case 'tree-diff': {
            const payload = message.payload as TreeDiffPayload;
            let state = syncStates.get(fromPeerId);

            if (!state) {
              // Create state if it doesn't exist
              state = {
                status: 'syncing',
                remotePeerId: fromPeerId,
                remoteMerkleRoot: '',
                currentLevel: 0,
                maxLevel: 10,
                divergentHashes: new Set(),
                receivedMemos: new Map(),
                pendingMemos: new Set(),
              };
              syncStates.set(fromPeerId, state);
            }

            // Add divergent hashes to our set
            payload.missingHashes.forEach((h) => state.divergentHashes.add(h));

            // Move to next level or request memos
            state.currentLevel++;

            if (state.currentLevel < state.maxLevel && payload.missingHashes.length > 0) {
              // Continue level-by-level traversal
              const localHashes = merkleTree.getNodeHashesAtLevel(state.currentLevel);
              const response: SyncMessage = {
                type: 'tree-level',
                payload: {
                  level: state.currentLevel,
                  hashes: localHashes,
                },
              };
              return response;
            }

            // Reached leaf level or no more divergence, request missing memos
            const missingMemos = await getMemosByContentHashes(Array.from(state.divergentHashes));

            if (missingMemos.length === 0) {
              // No memos to transfer, complete sync
              state.status = 'complete';
              currentStatus = 'complete';

              const response: SyncMessage = {
                type: 'sync-complete',
                payload: {
                  newRoot: merkleTree.root,
                },
              };
              return response;
            }

            const response: SyncMessage = {
              type: 'memos',
              payload: {
                memos: missingMemos,
              },
            };
            return response;
          }

          case 'memos': {
            const payload = message.payload as MemosPayload;
            let state = syncStates.get(fromPeerId);

            if (!state) {
              // Create state if it doesn't exist
              state = {
                status: 'syncing',
                remotePeerId: fromPeerId,
                remoteMerkleRoot: '',
                currentLevel: 0,
                maxLevel: 10,
                divergentHashes: new Set(),
                receivedMemos: new Map(),
                pendingMemos: new Set(),
              };
              syncStates.set(fromPeerId, state);
            }

            // Verify and store each memo
            let storedCount = 0;
            for (const memo of payload.memos) {
              const stored = await verifyAndStoreMemo(memo, fromPeerId);
              if (stored) {
                storedCount++;
              }
            }

            console.log(`Stored ${storedCount} memos from peer ${fromPeerId}`);

            // Update merkle tree with new memos
            await updateMerkleTree();

            // Complete sync
            state.status = 'complete';
            currentStatus = 'complete';

            const response: SyncMessage = {
              type: 'sync-complete',
              payload: {
                newRoot: merkleTree.root,
              },
            };
            return response;
          }

          case 'sync-complete': {
            const state = syncStates.get(fromPeerId);
            if (state) {
              state.status = 'complete';
            }
            currentStatus = 'complete';
            return null;
          }

          default:
            console.warn(`Unknown sync message type: ${message.type}`);
            return null;
        }
      } catch (error) {
        console.error(`Error handling sync message from ${fromPeerId}:`, error);
        const state = syncStates.get(fromPeerId);
        if (state) {
          state.status = 'error';
        }
        currentStatus = 'error';
        return null;
      }
    },

    getStatus(): SyncStatus {
      return currentStatus;
    },
  };

  return protocol;
}
