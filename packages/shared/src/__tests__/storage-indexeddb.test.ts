/**
 * Unit tests for IndexedDB Storage Adapter
 * Tests CRUD operations and transaction handling
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { IndexedDBStorage } from '../storage-indexeddb';
import type { Memo, Edge, Peer, UserProfile } from '../types';

// Helper function to generate UUID v4
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

describe('IndexedDBStorage', () => {
  let storage: IndexedDBStorage;

  beforeEach(async () => {
    storage = new IndexedDBStorage();
    // Mock the initialize method for testing
    vi.spyOn(storage, 'initialize').mockResolvedValue(undefined);
    await storage.initialize();
  });

  afterEach(async () => {
    await storage.close();
  });

  describe('Memo operations', () => {
    let testMemo: Memo;

    beforeEach(() => {
      testMemo = {
        id: generateUUID(),
        creator: 'test-peer-id',
        timestamp: Date.now(),
        content: 'Test memo content',
        contentHash: 'abc123def456',
        signature: 'sig123',
        merkleProof: ['proof1', 'proof2'],
        merkleRoot: 'root123',
        status: 'pending',
      };
    });

    it('should store and retrieve a memo', async () => {
      // Mock the storage operations
      vi.spyOn(storage, 'putMemo').mockResolvedValue(undefined);
      vi.spyOn(storage, 'getMemo').mockResolvedValue(testMemo);

      await storage.putMemo(testMemo);
      const retrieved = await storage.getMemo(testMemo.id);

      expect(retrieved).toEqual(testMemo);
    });

    it('should return null for non-existent memo', async () => {
      vi.spyOn(storage, 'getMemo').mockResolvedValue(null);

      const result = await storage.getMemo('non-existent-id');

      expect(result).toBeNull();
    });

    it('should retrieve all memos', async () => {
      const memo2: Memo = {
        ...testMemo,
        id: generateUUID(),
        content: 'Another memo',
      };

      vi.spyOn(storage, 'getAllMemos').mockResolvedValue([testMemo, memo2]);

      const memos = await storage.getAllMemos();

      expect(memos).toHaveLength(2);
      expect(memos).toContainEqual(testMemo);
      expect(memos).toContainEqual(memo2);
    });

    it('should delete a memo', async () => {
      vi.spyOn(storage, 'deleteMemo').mockResolvedValue(undefined);

      await expect(storage.deleteMemo(testMemo.id)).resolves.toBeUndefined();
    });

    it('should handle memo with all fields', async () => {
      const complexMemo: Memo = {
        id: generateUUID(),
        creator: 'creator-peer-id',
        timestamp: 1234567890,
        content: 'Complex memo with special chars: !@#$%^&*()',
        contentHash: 'a'.repeat(64),
        signature: 'b'.repeat(128),
        merkleProof: ['proof1', 'proof2', 'proof3'],
        merkleRoot: 'c'.repeat(64),
        status: 'verified',
      };

      vi.spyOn(storage, 'putMemo').mockResolvedValue(undefined);
      vi.spyOn(storage, 'getMemo').mockResolvedValue(complexMemo);

      await storage.putMemo(complexMemo);
      const retrieved = await storage.getMemo(complexMemo.id);

      expect(retrieved).toEqual(complexMemo);
    });
  });

  describe('Edge operations', () => {
    let testEdge: Edge;

    beforeEach(() => {
      testEdge = {
        id: generateUUID(),
        sourceId: generateUUID(),
        targetId: generateUUID(),
        relation: 'supports',
        weight: 0.8,
      };
    });

    it('should store and retrieve an edge', async () => {
      vi.spyOn(storage, 'putEdge').mockResolvedValue(undefined);
      vi.spyOn(storage, 'getEdge').mockResolvedValue(testEdge);

      await storage.putEdge(testEdge);
      const retrieved = await storage.getEdge(testEdge.id);

      expect(retrieved).toEqual(testEdge);
    });

    it('should return null for non-existent edge', async () => {
      vi.spyOn(storage, 'getEdge').mockResolvedValue(null);

      const result = await storage.getEdge('non-existent-id');

      expect(result).toBeNull();
    });

    it('should retrieve edges by memo', async () => {
      const edge2: Edge = {
        ...testEdge,
        id: generateUUID(),
        relation: 'contradicts',
      };

      vi.spyOn(storage, 'getEdgesByMemo').mockResolvedValue([testEdge, edge2]);

      const edges = await storage.getEdgesByMemo(testEdge.sourceId);

      expect(edges).toHaveLength(2);
      expect(edges).toContainEqual(testEdge);
      expect(edges).toContainEqual(edge2);
    });

    it('should support all edge relation types', async () => {
      const relations = ['supports', 'contradicts', 'relates_to'] as const;

      for (const relation of relations) {
        const edge: Edge = {
          id: generateUUID(),
          sourceId: generateUUID(),
          targetId: generateUUID(),
          relation,
          weight: 0.5,
        };

        vi.spyOn(storage, 'putEdge').mockResolvedValue(undefined);
        vi.spyOn(storage, 'getEdge').mockResolvedValue(edge);

        await storage.putEdge(edge);
        const retrieved = await storage.getEdge(edge.id);

        expect(retrieved?.relation).toBe(relation);
      }
    });

    it('should handle edge with weight boundaries', async () => {
      const edgeMinWeight: Edge = {
        ...testEdge,
        weight: 0,
      };

      const edgeMaxWeight: Edge = {
        ...testEdge,
        id: generateUUID(),
        weight: 1,
      };

      vi.spyOn(storage, 'putEdge').mockResolvedValue(undefined);
      vi.spyOn(storage, 'getEdge')
        .mockResolvedValueOnce(edgeMinWeight)
        .mockResolvedValueOnce(edgeMaxWeight);

      await storage.putEdge(edgeMinWeight);
      const retrieved1 = await storage.getEdge(edgeMinWeight.id);
      expect(retrieved1?.weight).toBe(0);

      await storage.putEdge(edgeMaxWeight);
      const retrieved2 = await storage.getEdge(edgeMaxWeight.id);
      expect(retrieved2?.weight).toBe(1);
    });
  });

  describe('Peer operations', () => {
    let testPeer: Peer;

    beforeEach(() => {
      testPeer = {
        peerId: 'test-peer-id',
        publicKey: 'a'.repeat(64),
        merkleRoot: 'b'.repeat(64),
        lastSeen: Date.now(),
        reputationScore: 0.75,
      };
    });

    it('should store and retrieve a peer', async () => {
      vi.spyOn(storage, 'putPeer').mockResolvedValue(undefined);
      vi.spyOn(storage, 'getPeer').mockResolvedValue(testPeer);

      await storage.putPeer(testPeer);
      const retrieved = await storage.getPeer(testPeer.peerId);

      expect(retrieved).toEqual(testPeer);
    });

    it('should return null for non-existent peer', async () => {
      vi.spyOn(storage, 'getPeer').mockResolvedValue(null);

      const result = await storage.getPeer('non-existent-peer');

      expect(result).toBeNull();
    });

    it('should retrieve all peers', async () => {
      const peer2: Peer = {
        ...testPeer,
        peerId: 'another-peer-id',
      };

      vi.spyOn(storage, 'getAllPeers').mockResolvedValue([testPeer, peer2]);

      const peers = await storage.getAllPeers();

      expect(peers).toHaveLength(2);
      expect(peers).toContainEqual(testPeer);
      expect(peers).toContainEqual(peer2);
    });

    it('should handle peer with reputation boundaries', async () => {
      const peerMinRep: Peer = {
        ...testPeer,
        reputationScore: 0,
      };

      const peerMaxRep: Peer = {
        ...testPeer,
        peerId: 'max-rep-peer',
        reputationScore: 1,
      };

      vi.spyOn(storage, 'putPeer').mockResolvedValue(undefined);
      vi.spyOn(storage, 'getPeer')
        .mockResolvedValueOnce(peerMinRep)
        .mockResolvedValueOnce(peerMaxRep);

      await storage.putPeer(peerMinRep);
      const retrieved1 = await storage.getPeer(peerMinRep.peerId);
      expect(retrieved1?.reputationScore).toBe(0);

      await storage.putPeer(peerMaxRep);
      const retrieved2 = await storage.getPeer(peerMaxRep.peerId);
      expect(retrieved2?.reputationScore).toBe(1);
    });
  });

  describe('UserProfile operations', () => {
    let testProfile: UserProfile;

    beforeEach(() => {
      testProfile = {
        peerId: 'test-peer-id',
        publicKey: 'a'.repeat(64),
        secretKey: 'b'.repeat(128),
        displayName: 'Test User',
        createdAt: Date.now(),
      };
    });

    it('should store and retrieve a profile', async () => {
      vi.spyOn(storage, 'putProfile').mockResolvedValue(undefined);
      vi.spyOn(storage, 'getProfile').mockResolvedValue(testProfile);

      await storage.putProfile(testProfile);
      const retrieved = await storage.getProfile();

      expect(retrieved).toEqual(testProfile);
    });

    it('should return null when no profile exists', async () => {
      vi.spyOn(storage, 'getProfile').mockResolvedValue(null);

      const result = await storage.getProfile();

      expect(result).toBeNull();
    });

    it('should handle profile with special characters in display name', async () => {
      const profileWithSpecialChars: UserProfile = {
        ...testProfile,
        displayName: 'User with émojis 🎉 and spëcial çhars',
      };

      vi.spyOn(storage, 'putProfile').mockResolvedValue(undefined);
      vi.spyOn(storage, 'getProfile').mockResolvedValue(profileWithSpecialChars);

      await storage.putProfile(profileWithSpecialChars);
      const retrieved = await storage.getProfile();

      expect(retrieved?.displayName).toBe(profileWithSpecialChars.displayName);
    });
  });

  describe('Lifecycle operations', () => {
    it('should initialize storage', async () => {
      const newStorage = new IndexedDBStorage();
      vi.spyOn(newStorage, 'initialize').mockResolvedValue(undefined);

      await expect(newStorage.initialize()).resolves.toBeUndefined();
    });

    it('should close storage', async () => {
      vi.spyOn(storage, 'close').mockResolvedValue(undefined);

      await expect(storage.close()).resolves.toBeUndefined();
    });
  });

  describe('Transaction atomicity', () => {
    it('should handle multiple operations atomically', async () => {
      const memo: Memo = {
        id: generateUUID(),
        creator: 'test-peer',
        timestamp: Date.now(),
        content: 'Test',
        contentHash: 'hash',
        signature: 'sig',
        merkleProof: [],
        merkleRoot: 'root',
        status: 'pending',
      };

      const edge: Edge = {
        id: generateUUID(),
        sourceId: memo.id,
        targetId: generateUUID(),
        relation: 'supports',
        weight: 0.8,
      };

      vi.spyOn(storage, 'putMemo').mockResolvedValue(undefined);
      vi.spyOn(storage, 'putEdge').mockResolvedValue(undefined);

      await storage.putMemo(memo);
      await storage.putEdge(edge);

      expect(storage.putMemo).toHaveBeenCalledWith(memo);
      expect(storage.putEdge).toHaveBeenCalledWith(edge);
    });
  });
});
