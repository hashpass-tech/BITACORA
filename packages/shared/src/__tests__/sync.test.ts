/**
 * Unit tests for Sync Protocol implementation
 * Tests specific behaviors and edge cases
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createSyncProtocol, type SyncMessage, type SyncProtocol } from '../sync';
import { createMerkleTree, type MerkleTree } from '../merkle';
import { createCryptoModule, type CryptoModule } from '../crypto';
import type { StorageAdapter } from '../storage';
import type { Memo, Peer } from '../types';

/**
 * Mock storage adapter for testing
 */
function createMockStorage(): StorageAdapter {
  const memos = new Map<string, Memo>();
  const edges = new Map<string, any>();
  const peers = new Map<string, Peer>();
  let profile: any = null;

  return {
    async putMemo(memo: Memo): Promise<void> {
      memos.set(memo.id, memo);
    },
    async getMemo(id: string): Promise<Memo | null> {
      return memos.get(id) || null;
    },
    async getAllMemos(): Promise<Memo[]> {
      return Array.from(memos.values());
    },
    async deleteMemo(id: string): Promise<void> {
      memos.delete(id);
    },
    async putEdge(edge: any): Promise<void> {
      edges.set(edge.id, edge);
    },
    async getEdge(id: string): Promise<any | null> {
      return edges.get(id) || null;
    },
    async getEdgesByMemo(memoId: string): Promise<any[]> {
      return Array.from(edges.values()).filter(
        (e) => e.sourceId === memoId || e.targetId === memoId
      );
    },
    async putPeer(peer: Peer): Promise<void> {
      peers.set(peer.peerId, peer);
    },
    async getPeer(peerId: string): Promise<Peer | null> {
      return peers.get(peerId) || null;
    },
    async getAllPeers(): Promise<Peer[]> {
      return Array.from(peers.values());
    },
    async getProfile(): Promise<any | null> {
      return profile;
    },
    async putProfile(p: any): Promise<void> {
      profile = p;
    },
    async initialize(): Promise<void> {},
    async close(): Promise<void> {},
  };
}

describe('Sync Protocol', () => {
  let protocol: SyncProtocol;
  let storage: StorageAdapter;
  let crypto: CryptoModule;
  let merkleTree: MerkleTree;
  let sentMessages: Array<{ peerId: string; message: SyncMessage }>;

  beforeEach(async () => {
    storage = createMockStorage();
    crypto = createCryptoModule();
    merkleTree = createMerkleTree();
    sentMessages = [];

    const sendMessage = (peerId: string, message: SyncMessage) => {
      sentMessages.push({ peerId, message });
    };

    protocol = createSyncProtocol(storage, crypto, merkleTree, sendMessage);
  });

  describe('initSync()', () => {
    it('should send sync-request with local merkle root', async () => {
      const hash = 'a'.repeat(64);
      await merkleTree.addLeaf(hash);

      await protocol.initSync('peer1');

      expect(sentMessages).toHaveLength(1);
      expect(sentMessages[0].message.type).toBe('sync-request');
      expect(sentMessages[0].message.payload).toEqual({
        merkleRoot: merkleTree.root,
      });
    });

    it('should set status to syncing', async () => {
      await protocol.initSync('peer1');
      expect(protocol.getStatus()).toBe('syncing');
    });

    it('should send sync-request with empty root for empty tree', async () => {
      await protocol.initSync('peer1');

      expect(sentMessages).toHaveLength(1);
      expect(sentMessages[0].message.payload).toEqual({
        merkleRoot: '',
      });
    });
  });

  describe('handleMessage() - sync-request', () => {
    it('should respond with in-sync when roots match', async () => {
      const hash = 'a'.repeat(64);
      await merkleTree.addLeaf(hash);

      const message: SyncMessage = {
        type: 'sync-request',
        payload: {
          merkleRoot: merkleTree.root,
        },
      };

      const response = await protocol.handleMessage(message, 'peer1');

      expect(response).not.toBeNull();
      expect(response?.type).toBe('sync-response');
      expect(response?.payload).toEqual({ status: 'in-sync' });
    });

    it('should respond with diff when roots differ', async () => {
      const hash = 'a'.repeat(64);
      await merkleTree.addLeaf(hash);

      const message: SyncMessage = {
        type: 'sync-request',
        payload: {
          merkleRoot: 'different'.repeat(8),
        },
      };

      const response = await protocol.handleMessage(message, 'peer1');

      expect(response).not.toBeNull();
      expect(response?.type).toBe('sync-response');
      expect((response?.payload as any).status).toBe('diff');
      expect((response?.payload as any).nodeHashes).toBeDefined();
    });

    it('should handle empty tree', async () => {
      const message: SyncMessage = {
        type: 'sync-request',
        payload: {
          merkleRoot: 'different'.repeat(8),
        },
      };

      const response = await protocol.handleMessage(message, 'peer1');

      expect(response).not.toBeNull();
      expect(response?.type).toBe('sync-response');
    });
  });

  describe('handleMessage() - sync-response', () => {
    it('should handle in-sync response', async () => {
      await protocol.initSync('peer1');
      sentMessages = [];

      const message: SyncMessage = {
        type: 'sync-response',
        payload: {
          status: 'in-sync',
        },
      };

      const response = await protocol.handleMessage(message, 'peer1');

      expect(response?.type).toBe('sync-complete');
      expect(protocol.getStatus()).toBe('complete');
    });

    it('should handle diff response and start level-by-level exchange', async () => {
      await protocol.initSync('peer1');
      sentMessages = [];

      const message: SyncMessage = {
        type: 'sync-response',
        payload: {
          status: 'diff',
          nodeHashes: ['x'.repeat(64)],
        },
      };

      const response = await protocol.handleMessage(message, 'peer1');

      expect(response?.type).toBe('tree-level');
      expect((response?.payload as any).level).toBe(0);
    });
  });

  describe('handleMessage() - tree-level', () => {
    it('should respond with tree-diff containing divergent hashes', async () => {
      const hash1 = 'a'.repeat(64);
      const hash2 = 'b'.repeat(64);
      await merkleTree.addLeaf(hash1);
      await merkleTree.addLeaf(hash2);

      const message: SyncMessage = {
        type: 'tree-level',
        payload: {
          level: 1,
          hashes: ['x'.repeat(64), 'y'.repeat(64)],
        },
      };

      const response = await protocol.handleMessage(message, 'peer1');

      expect(response?.type).toBe('tree-diff');
      expect((response?.payload as any).missingHashes).toBeDefined();
    });

    it('should respond with tree-diff containing no divergent hashes when all match', async () => {
      const hash1 = 'a'.repeat(64);
      const hash2 = 'b'.repeat(64);
      await merkleTree.addLeaf(hash1);
      await merkleTree.addLeaf(hash2);

      const localHashes = merkleTree.getNodeHashesAtLevel(1);

      const message: SyncMessage = {
        type: 'tree-level',
        payload: {
          level: 1,
          hashes: localHashes,
        },
      };

      const response = await protocol.handleMessage(message, 'peer1');

      expect(response?.type).toBe('tree-diff');
      expect((response?.payload as any).missingHashes).toEqual([]);
    });
  });

  describe('handleMessage() - tree-diff', () => {
    it('should continue level-by-level traversal when divergent hashes exist', async () => {
      const hash1 = 'a'.repeat(64);
      const hash2 = 'b'.repeat(64);
      const hash3 = 'c'.repeat(64);
      const hash4 = 'd'.repeat(64);
      await merkleTree.addLeaf(hash1);
      await merkleTree.addLeaf(hash2);
      await merkleTree.addLeaf(hash3);
      await merkleTree.addLeaf(hash4);

      const message: SyncMessage = {
        type: 'tree-diff',
        payload: {
          missingHashes: ['x'.repeat(64)],
        },
      };

      const response = await protocol.handleMessage(message, 'peer1');

      expect(response?.type).toBe('tree-level');
      expect((response?.payload as any).level).toBeGreaterThan(0);
    });

    it('should request memos when no more divergence', async () => {
      const hash1 = 'a'.repeat(64);
      await merkleTree.addLeaf(hash1);

      // Create a memo with this hash
      const memo: Memo = {
        id: 'memo1',
        creator: 'peer1',
        timestamp: Date.now(),
        content: 'test',
        contentHash: hash1,
        signature: 'sig',
        merkleProof: [],
        merkleRoot: merkleTree.root,
        status: 'pending',
      };
      await storage.putMemo(memo);

      // Simulate reaching leaf level (currentLevel = maxLevel - 1)
      // by sending multiple tree-diff messages
      let response: SyncMessage | null = null;
      
      // Send tree-diff with divergent hashes multiple times to reach leaf level
      for (let i = 0; i < 10; i++) {
        const message: SyncMessage = {
          type: 'tree-diff',
          payload: {
            missingHashes: [hash1],
          },
        };
        response = await protocol.handleMessage(message, 'peer1');
        
        // If we get memos or sync-complete, we're done
        if (response?.type === 'memos' || response?.type === 'sync-complete') {
          break;
        }
      }

      // Should eventually request memos or complete
      expect(response?.type === 'memos' || response?.type === 'sync-complete').toBe(true);
    });

    it('should complete sync when no divergent hashes', async () => {
      const message: SyncMessage = {
        type: 'tree-diff',
        payload: {
          missingHashes: [],
        },
      };

      const response = await protocol.handleMessage(message, 'peer1');

      expect(response?.type).toBe('sync-complete');
      expect(protocol.getStatus()).toBe('complete');
    });
  });

  describe('handleMessage() - memos', () => {
    it('should verify and store memos', async () => {
      // Setup peer
      const keypair = crypto.generateKeypair();
      const peerId = crypto.derivePeerId(keypair.publicKey);
      const peer: Peer = {
        peerId,
        publicKey: Array.from(keypair.publicKey)
          .map((b) => b.toString(16).padStart(2, '0'))
          .join(''),
        merkleRoot: '',
        lastSeen: Date.now(),
        reputationScore: 0.5,
      };
      await storage.putPeer(peer);

      // Create a valid memo
      const content = 'test content';
      const contentHash = await crypto.computeContentHash(content);
      const memoData = {
        id: 'memo1',
        creator: peerId,
        timestamp: Date.now(),
        contentHash,
      };
      const signature = crypto.signMemo(memoData, keypair.secretKey);

      const memo: Memo = {
        ...memoData,
        content,
        signature,
        merkleProof: [],
        merkleRoot: '',
        status: 'pending',
      };

      const message: SyncMessage = {
        type: 'memos',
        payload: {
          memos: [memo],
        },
      };

      await protocol.handleMessage(message, peerId);

      // Verify memo was stored
      const stored = await storage.getMemo(memo.id);
      expect(stored).not.toBeNull();
      expect(stored?.id).toBe(memo.id);
    });

    it('should reject memos with invalid signatures', async () => {
      // Setup peer
      const keypair = crypto.generateKeypair();
      const peerId = crypto.derivePeerId(keypair.publicKey);
      const peer: Peer = {
        peerId,
        publicKey: Array.from(keypair.publicKey)
          .map((b) => b.toString(16).padStart(2, '0'))
          .join(''),
        merkleRoot: '',
        lastSeen: Date.now(),
        reputationScore: 0.5,
      };
      await storage.putPeer(peer);

      // Create a memo with invalid signature
      const memo: Memo = {
        id: 'memo1',
        creator: peerId,
        timestamp: Date.now(),
        content: 'test',
        contentHash: 'a'.repeat(64),
        signature: 'invalid'.repeat(8),
        merkleProof: [],
        merkleRoot: '',
        status: 'pending',
      };

      const message: SyncMessage = {
        type: 'memos',
        payload: {
          memos: [memo],
        },
      };

      await protocol.handleMessage(message, peerId);

      // Verify memo was NOT stored
      const stored = await storage.getMemo(memo.id);
      expect(stored).toBeNull();
    });

    it('should resolve conflicts deterministically', async () => {
      // Setup peer
      const keypair = crypto.generateKeypair();
      const peerId = crypto.derivePeerId(keypair.publicKey);
      const peer: Peer = {
        peerId,
        publicKey: Array.from(keypair.publicKey)
          .map((b) => b.toString(16).padStart(2, '0'))
          .join(''),
        merkleRoot: '',
        lastSeen: Date.now(),
        reputationScore: 0.5,
      };
      await storage.putPeer(peer);

      // Create first memo
      const content1 = 'content1';
      const contentHash1 = await crypto.computeContentHash(content1);
      const memoData1 = {
        id: 'memo1',
        creator: peerId,
        timestamp: 1000,
        contentHash: contentHash1,
      };
      const signature1 = crypto.signMemo(memoData1, keypair.secretKey);
      const memo1: Memo = {
        ...memoData1,
        content: content1,
        signature: signature1,
        merkleProof: [],
        merkleRoot: '',
        status: 'pending',
      };
      await storage.putMemo(memo1);

      // Create conflicting memo with later timestamp (should lose)
      const content2 = 'content2';
      const contentHash2 = await crypto.computeContentHash(content2);
      const memoData2 = {
        id: 'memo1',
        creator: peerId,
        timestamp: 2000,
        contentHash: contentHash2,
      };
      const signature2 = crypto.signMemo(memoData2, keypair.secretKey);
      const memo2: Memo = {
        ...memoData2,
        content: content2,
        signature: signature2,
        merkleProof: [],
        merkleRoot: '',
        status: 'pending',
      };

      const message: SyncMessage = {
        type: 'memos',
        payload: {
          memos: [memo2],
        },
      };

      await protocol.handleMessage(message, peerId);

      // Verify first memo is still stored (earlier timestamp wins)
      const stored = await storage.getMemo('memo1');
      expect(stored?.contentHash).toBe(contentHash1);
    });

    it('should update merkle tree after storing memos', async () => {
      // Setup peer
      const keypair = crypto.generateKeypair();
      const peerId = crypto.derivePeerId(keypair.publicKey);
      const peer: Peer = {
        peerId,
        publicKey: Array.from(keypair.publicKey)
          .map((b) => b.toString(16).padStart(2, '0'))
          .join(''),
        merkleRoot: '',
        lastSeen: Date.now(),
        reputationScore: 0.5,
      };
      await storage.putPeer(peer);

      const oldRoot = merkleTree.root;

      // Create a valid memo
      const content = 'test content';
      const contentHash = await crypto.computeContentHash(content);
      const memoData = {
        id: 'memo1',
        creator: peerId,
        timestamp: Date.now(),
        contentHash,
      };
      const signature = crypto.signMemo(memoData, keypair.secretKey);

      const memo: Memo = {
        ...memoData,
        content,
        signature,
        merkleProof: [],
        merkleRoot: '',
        status: 'pending',
      };

      const message: SyncMessage = {
        type: 'memos',
        payload: {
          memos: [memo],
        },
      };

      await protocol.handleMessage(message, peerId);

      // Verify merkle tree was updated
      const newRoot = merkleTree.root;
      expect(newRoot).not.toBe(oldRoot);
      expect(newRoot).toBe(contentHash); // Single memo, root is the hash
    });

    it('should complete sync after storing memos', async () => {
      // Setup peer
      const keypair = crypto.generateKeypair();
      const peerId = crypto.derivePeerId(keypair.publicKey);
      const peer: Peer = {
        peerId,
        publicKey: Array.from(keypair.publicKey)
          .map((b) => b.toString(16).padStart(2, '0'))
          .join(''),
        merkleRoot: '',
        lastSeen: Date.now(),
        reputationScore: 0.5,
      };
      await storage.putPeer(peer);

      // Create a valid memo
      const content = 'test content';
      const contentHash = await crypto.computeContentHash(content);
      const memoData = {
        id: 'memo1',
        creator: peerId,
        timestamp: Date.now(),
        contentHash,
      };
      const signature = crypto.signMemo(memoData, keypair.secretKey);

      const memo: Memo = {
        ...memoData,
        content,
        signature,
        merkleProof: [],
        merkleRoot: '',
        status: 'pending',
      };

      const message: SyncMessage = {
        type: 'memos',
        payload: {
          memos: [memo],
        },
      };

      const response = await protocol.handleMessage(message, peerId);

      expect(response?.type).toBe('sync-complete');
      expect(protocol.getStatus()).toBe('complete');
    });
  });

  describe('handleMessage() - sync-complete', () => {
    it('should set status to complete', async () => {
      const message: SyncMessage = {
        type: 'sync-complete',
        payload: {
          newRoot: 'a'.repeat(64),
        },
      };

      await protocol.handleMessage(message, 'peer1');

      expect(protocol.getStatus()).toBe('complete');
    });
  });

  describe('getStatus()', () => {
    it('should return idle initially', () => {
      expect(protocol.getStatus()).toBe('idle');
    });

    it('should return syncing after initSync', async () => {
      await protocol.initSync('peer1');
      expect(protocol.getStatus()).toBe('syncing');
    });

    it('should return complete after sync completes', async () => {
      const message: SyncMessage = {
        type: 'sync-request',
        payload: {
          merkleRoot: merkleTree.root,
        },
      };

      await protocol.handleMessage(message, 'peer1');
      expect(protocol.getStatus()).toBe('complete');
    });
  });

  describe('error handling', () => {
    it('should handle unknown peer gracefully', async () => {
      const message: SyncMessage = {
        type: 'memos',
        payload: {
          memos: [],
        },
      };

      // Unknown peer will have state created, but with no memos to store
      // This is acceptable behavior - we create state on demand
      const response = await protocol.handleMessage(message, 'unknown-peer');
      expect(response?.type).toBe('sync-complete');
    });

    it('should handle malformed messages gracefully', async () => {
      const message: SyncMessage = {
        type: 'tree-level',
        payload: {
          level: 0,
          hashes: [],
        },
      };

      const response = await protocol.handleMessage(message, 'peer1');
      expect(response).toBeDefined();
    });
  });
});
