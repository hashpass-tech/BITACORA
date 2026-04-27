/**
 * Unit tests for entity-helpers
 * Tests createMemo and createEdge functions
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createMemo, createEdge } from '../entity-helpers';
import { crypto } from '../crypto';
import type { Memo, UserProfile } from '../types';
import type { StorageAdapter } from '../storage';

describe('entity-helpers', () => {
  let userProfile: UserProfile;

  beforeEach(async () => {
    // Create a test user profile
    const keypair = crypto.generateKeypair();
    const peerId = crypto.derivePeerId(keypair.publicKey);
    const publicKeyHex = Array.from(keypair.publicKey)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    const secretKeyHex = Array.from(keypair.secretKey)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    userProfile = {
      peerId,
      publicKey: publicKeyHex,
      secretKey: secretKeyHex,
      displayName: 'Test User',
      createdAt: Date.now(),
    };
  });

  describe('createMemo', () => {
    it('should create a memo with all required fields', async () => {
      const content = 'Test memo content';
      const memo = await createMemo(content, userProfile, crypto);

      expect(memo).toBeDefined();
      expect(memo.id).toBeDefined();
      expect(memo.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
      expect(memo.creator).toBe(userProfile.peerId);
      expect(memo.content).toBe(content);
      expect(memo.timestamp).toBeGreaterThan(0);
      expect(memo.contentHash).toBeDefined();
      expect(memo.contentHash).toMatch(/^[0-9a-f]{64}$/);
      expect(memo.signature).toBeDefined();
      expect(memo.signature).toMatch(/^[0-9a-f]+$/);
      expect(memo.status).toBe('pending');
      expect(memo.merkleProof).toEqual([]);
      expect(memo.merkleRoot).toBe('');
    });

    it('should generate unique IDs for different memos', async () => {
      const memo1 = await createMemo('Content 1', userProfile, crypto);
      const memo2 = await createMemo('Content 2', userProfile, crypto);

      expect(memo1.id).not.toBe(memo2.id);
    });

    it('should compute correct content hash', async () => {
      const content = 'Test content';
      const memo = await createMemo(content, userProfile, crypto);
      const expectedHash = await crypto.computeContentHash(content);

      expect(memo.contentHash).toBe(expectedHash);
    });

    it('should set timestamp to current time', async () => {
      const beforeTime = Date.now();
      const memo = await createMemo('Test', userProfile, crypto);
      const afterTime = Date.now();

      expect(memo.timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(memo.timestamp).toBeLessThanOrEqual(afterTime);
    });

    it('should create a valid signature', async () => {
      const memo = await createMemo('Test content', userProfile, crypto);
      const publicKeyBytes = new Uint8Array(
        userProfile.publicKey.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
      );

      const isValid = crypto.verifySignature(memo, publicKeyBytes);
      expect(isValid).toBe(true);
    });
  });

  describe('createEdge', () => {
    let memo1: Memo;
    let memo2: Memo;
    let mockStorage: StorageAdapter;

    beforeEach(async () => {
      memo1 = await createMemo('Memo 1', userProfile, crypto);
      memo2 = await createMemo('Memo 2', userProfile, crypto);

      mockStorage = {
        getMemo: async (id: string) => {
          if (id === memo1.id) return memo1;
          if (id === memo2.id) return memo2;
          return null;
        },
        putMemo: async () => {},
        getAllMemos: async () => [memo1, memo2],
        deleteMemo: async () => {},
        putEdge: async () => {},
        getEdge: async () => null,
        getEdgesByMemo: async () => [],
        putPeer: async () => {},
        getPeer: async () => null,
        getAllPeers: async () => [],
        getProfile: async () => null,
        putProfile: async () => {},
        initialize: async () => {},
        close: async () => {},
      };
    });

    it('should create an edge with valid memo references', async () => {
      const edge = await createEdge(memo1.id, memo2.id, 'supports', 0.8, mockStorage);

      expect(edge).toBeDefined();
      expect(edge.id).toBeDefined();
      expect(edge.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
      expect(edge.sourceId).toBe(memo1.id);
      expect(edge.targetId).toBe(memo2.id);
      expect(edge.relation).toBe('supports');
      expect(edge.weight).toBe(0.8);
    });

    it('should reject edge with non-existent source memo', async () => {
      const invalidId = '00000000-0000-4000-8000-000000000000';

      await expect(createEdge(invalidId, memo2.id, 'supports', 0.8, mockStorage)).rejects.toThrow(
        `Source Memo with id "${invalidId}" does not exist in storage`
      );
    });

    it('should reject edge with non-existent target memo', async () => {
      const invalidId = '00000000-0000-4000-8000-000000000000';

      await expect(createEdge(memo1.id, invalidId, 'supports', 0.8, mockStorage)).rejects.toThrow(
        `Target Memo with id "${invalidId}" does not exist in storage`
      );
    });

    it('should generate unique IDs for different edges', async () => {
      const edge1 = await createEdge(memo1.id, memo2.id, 'supports', 0.8, mockStorage);
      const edge2 = await createEdge(memo1.id, memo2.id, 'contradicts', 0.5, mockStorage);

      expect(edge1.id).not.toBe(edge2.id);
    });

    it('should support all relation types', async () => {
      const relations = ['supports', 'contradicts', 'relates_to'] as const;

      for (const relation of relations) {
        const edge = await createEdge(memo1.id, memo2.id, relation, 0.5, mockStorage);
        expect(edge.relation).toBe(relation);
      }
    });
  });
});
