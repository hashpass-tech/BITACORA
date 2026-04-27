/**
 * Unit tests for Merkle Tree implementation
 * Tests specific behaviors and edge cases
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createMerkleTree } from '../merkle';

describe('Merkle Tree', () => {
  let tree: ReturnType<typeof createMerkleTree>;

  beforeEach(() => {
    tree = createMerkleTree();
  });

  describe('build()', () => {
    it('should build tree from empty array', async () => {
      await tree.build([]);
      expect(tree.root).toBe('');
    });

    it('should build tree from single hash', async () => {
      const hash = 'a'.repeat(64);
      await tree.build([hash]);
      expect(tree.root).toBe(hash);
    });

    it('should build tree from two hashes', async () => {
      const hash1 = 'a'.repeat(64);
      const hash2 = 'b'.repeat(64);
      await tree.build([hash1, hash2]);
      expect(tree.root).toHaveLength(64);
      expect(tree.root).not.toBe(hash1);
      expect(tree.root).not.toBe(hash2);
    });

    it('should pad with empty hash if odd number of leaves', async () => {
      const hash1 = 'a'.repeat(64);
      const hash2 = 'b'.repeat(64);
      const hash3 = 'c'.repeat(64);
      await tree.build([hash1, hash2, hash3]);
      expect(tree.root).toHaveLength(64);
    });

    it('should sort hashes for confluence property', async () => {
      const hashes = ['c'.repeat(64), 'a'.repeat(64), 'b'.repeat(64)];
      await tree.build(hashes);
      const root1 = tree.root;

      const tree2 = createMerkleTree();
      await tree2.build([...hashes].reverse());
      const root2 = tree2.root;

      expect(root1).toBe(root2);
    });
  });

  describe('addLeaf()', () => {
    it('should add leaf to empty tree', async () => {
      const hash = 'a'.repeat(64);
      await tree.addLeaf(hash);
      expect(tree.root).toBe(hash);
    });

    it('should add leaf to existing tree', async () => {
      const hash1 = 'a'.repeat(64);
      const hash2 = 'b'.repeat(64);
      await tree.addLeaf(hash1);
      const root1 = tree.root;
      await tree.addLeaf(hash2);
      const root2 = tree.root;
      expect(root1).not.toBe(root2);
    });

    it('should not add duplicate leaf', async () => {
      const hash = 'a'.repeat(64);
      await tree.addLeaf(hash);
      const root1 = tree.root;
      await tree.addLeaf(hash);
      const root2 = tree.root;
      expect(root1).toBe(root2);
    });

    it('should change root when adding new leaf', async () => {
      const hash1 = 'a'.repeat(64);
      const hash2 = 'b'.repeat(64);
      await tree.addLeaf(hash1);
      const root1 = tree.root;
      await tree.addLeaf(hash2);
      const root2 = tree.root;
      expect(root1).not.toBe(root2);
    });
  });

  describe('removeLeaf()', () => {
    it('should remove leaf from tree', async () => {
      const hash1 = 'a'.repeat(64);
      const hash2 = 'b'.repeat(64);
      await tree.addLeaf(hash1);
      await tree.addLeaf(hash2);
      const root1 = tree.root;
      await tree.removeLeaf(hash2);
      const root2 = tree.root;
      expect(root1).not.toBe(root2);
      expect(root2).toBe(hash1);
    });

    it('should handle removing non-existent leaf', async () => {
      const hash1 = 'a'.repeat(64);
      const hash2 = 'b'.repeat(64);
      await tree.addLeaf(hash1);
      const root1 = tree.root;
      await tree.removeLeaf(hash2);
      const root2 = tree.root;
      expect(root1).toBe(root2);
    });

    it('should change root when removing leaf', async () => {
      const hash1 = 'a'.repeat(64);
      await tree.addLeaf(hash1);
      const root1 = tree.root;
      await tree.removeLeaf(hash1);
      const root2 = tree.root;
      expect(root1).not.toBe(root2);
      expect(root2).toBe('');
    });
  });

  describe('getProof()', () => {
    it('should return empty proof for non-existent leaf', async () => {
      const hash1 = 'a'.repeat(64);
      const hash2 = 'b'.repeat(64);
      await tree.addLeaf(hash1);
      const proof = tree.getProof(hash2);
      expect(proof).toEqual([]);
    });

    it('should return empty proof for single leaf', async () => {
      const hash = 'a'.repeat(64);
      await tree.addLeaf(hash);
      const proof = tree.getProof(hash);
      expect(proof).toEqual([]);
    });

    it('should return proof for leaf in two-leaf tree', async () => {
      const hash1 = 'a'.repeat(64);
      const hash2 = 'b'.repeat(64);
      await tree.addLeaf(hash1);
      await tree.addLeaf(hash2);
      const proof = tree.getProof(hash1);
      expect(proof.length).toBeGreaterThan(0);
      expect(proof.some(p => p.hash === hash2)).toBe(true);
    });

    it('should return proof for leaf in larger tree', async () => {
      const hashes = [
        'a'.repeat(64),
        'b'.repeat(64),
        'c'.repeat(64),
        'd'.repeat(64),
      ];
      for (const hash of hashes) {
        await tree.addLeaf(hash);
      }
      const proof = tree.getProof(hashes[0]);
      expect(proof.length).toBeGreaterThan(0);
    });
  });

  describe('verifyProof()', () => {
    it('should verify proof for single leaf', async () => {
      const hash = 'a'.repeat(64);
      await tree.addLeaf(hash);
      const proof = tree.getProof(hash);
      const isValid = await tree.verifyProof(hash, proof, tree.root);
      expect(isValid).toBe(true);
    });

    it('should verify proof for leaf in two-leaf tree', async () => {
      const hash1 = 'a'.repeat(64);
      const hash2 = 'b'.repeat(64);
      await tree.addLeaf(hash1);
      await tree.addLeaf(hash2);
      const proof = tree.getProof(hash1);
      const isValid = await tree.verifyProof(hash1, proof, tree.root);
      expect(isValid).toBe(true);
    });

    it('should verify proof for all leaves in larger tree', async () => {
      const hashes = [
        'a'.repeat(64),
        'b'.repeat(64),
        'c'.repeat(64),
        'd'.repeat(64),
      ];
      for (const hash of hashes) {
        await tree.addLeaf(hash);
      }
      for (const hash of hashes) {
        const proof = tree.getProof(hash);
        const isValid = await tree.verifyProof(hash, proof, tree.root);
        expect(isValid).toBe(true);
      }
    });

    it('should reject invalid proof', async () => {
      const hash1 = 'a'.repeat(64);
      const hash2 = 'b'.repeat(64);
      await tree.addLeaf(hash1);
      await tree.addLeaf(hash2);
      const proof = tree.getProof(hash1);
      const isValid = await tree.verifyProof(hash1, proof, 'invalid'.repeat(8));
      expect(isValid).toBe(false);
    });

    it('should reject proof for wrong leaf', async () => {
      const hash1 = 'a'.repeat(64);
      const hash2 = 'b'.repeat(64);
      await tree.addLeaf(hash1);
      await tree.addLeaf(hash2);
      const proof = tree.getProof(hash1);
      const isValid = await tree.verifyProof(hash2, proof, tree.root);
      expect(isValid).toBe(false);
    });
  });

  describe('getNodeHashesAtLevel()', () => {
    it('should return root at level 0 for single leaf', async () => {
      const hash = 'a'.repeat(64);
      await tree.addLeaf(hash);
      const hashes = tree.getNodeHashesAtLevel(0);
      expect(hashes).toEqual([hash]);
    });

    it('should return two nodes at level 1 for two leaves', async () => {
      const hash1 = 'a'.repeat(64);
      const hash2 = 'b'.repeat(64);
      await tree.addLeaf(hash1);
      await tree.addLeaf(hash2);
      const hashes = tree.getNodeHashesAtLevel(1);
      expect(hashes.length).toBe(2);
      expect(hashes).toContain(hash1);
      expect(hashes).toContain(hash2);
    });

    it('should return empty array for non-existent level', async () => {
      const hash = 'a'.repeat(64);
      await tree.addLeaf(hash);
      const hashes = tree.getNodeHashesAtLevel(10);
      expect(hashes).toEqual([]);
    });

    it('should return correct hashes for larger tree', async () => {
      const hashes = [
        'a'.repeat(64),
        'b'.repeat(64),
        'c'.repeat(64),
        'd'.repeat(64),
      ];
      for (const hash of hashes) {
        await tree.addLeaf(hash);
      }
      // For 4 leaves, level 2 should have 4 leaf nodes (level 0 = root, level 1 = 2 intermediate nodes, level 2 = 4 leaves)
      const level2Hashes = tree.getNodeHashesAtLevel(2);
      expect(level2Hashes.length).toBe(4);
    });
  });

  describe('findDivergentSubtrees()', () => {
    it('should find no divergent subtrees when all match', async () => {
      const hash1 = 'a'.repeat(64);
      const hash2 = 'b'.repeat(64);
      await tree.addLeaf(hash1);
      await tree.addLeaf(hash2);
      const level1Hashes = tree.getNodeHashesAtLevel(1);
      const divergent = tree.findDivergentSubtrees(level1Hashes, 1);
      expect(divergent).toEqual([]);
    });

    it('should find divergent subtrees when hashes differ', async () => {
      const hash1 = 'a'.repeat(64);
      const hash2 = 'b'.repeat(64);
      await tree.addLeaf(hash1);
      await tree.addLeaf(hash2);
      const divergent = tree.findDivergentSubtrees(['x'.repeat(64), 'y'.repeat(64)], 1);
      expect(divergent.length).toBeGreaterThan(0);
    });

    it('should find partial divergence in larger tree', async () => {
      const hashes = [
        'a'.repeat(64),
        'b'.repeat(64),
        'c'.repeat(64),
        'd'.repeat(64),
      ];
      for (const hash of hashes) {
        await tree.addLeaf(hash);
      }
      const level1Hashes = tree.getNodeHashesAtLevel(1);
      // Replace one hash with a different one
      const remoteHashes = [...level1Hashes];
      remoteHashes[0] = 'x'.repeat(64);
      const divergent = tree.findDivergentSubtrees(remoteHashes, 1);
      expect(divergent.length).toBeGreaterThan(0);
    });
  });

  describe('confluence property', () => {
    it('should produce same root for different insertion orders', async () => {
      const hashes = [
        'a'.repeat(64),
        'b'.repeat(64),
        'c'.repeat(64),
        'd'.repeat(64),
      ];

      // Build tree in original order
      const tree1 = createMerkleTree();
      for (const hash of hashes) {
        await tree1.addLeaf(hash);
      }
      const root1 = tree1.root;

      // Build tree in reverse order
      const tree2 = createMerkleTree();
      for (const hash of [...hashes].reverse()) {
        await tree2.addLeaf(hash);
      }
      const root2 = tree2.root;

      expect(root1).toBe(root2);
    });

    it('should produce same root when built vs added incrementally', async () => {
      const hashes = [
        'a'.repeat(64),
        'b'.repeat(64),
        'c'.repeat(64),
        'd'.repeat(64),
      ];

      // Build tree all at once
      const tree1 = createMerkleTree();
      await tree1.build(hashes);
      const root1 = tree1.root;

      // Build tree incrementally
      const tree2 = createMerkleTree();
      for (const hash of hashes) {
        await tree2.addLeaf(hash);
      }
      const root2 = tree2.root;

      expect(root1).toBe(root2);
    });
  });

  describe('root property', () => {
    it('should return 64-character hex string for non-empty tree', async () => {
      const hash = 'a'.repeat(64);
      await tree.addLeaf(hash);
      expect(tree.root).toHaveLength(64);
      expect(/^[0-9a-f]{64}$/.test(tree.root)).toBe(true);
    });

    it('should return empty string for empty tree', async () => {
      expect(tree.root).toBe('');
    });

    it('should be consistent across multiple calls', async () => {
      const hash = 'a'.repeat(64);
      await tree.addLeaf(hash);
      const root1 = tree.root;
      const root2 = tree.root;
      expect(root1).toBe(root2);
    });
  });
});
