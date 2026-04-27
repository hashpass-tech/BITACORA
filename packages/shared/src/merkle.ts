/**
 * Merkle Tree Implementation for Bitácora P2P
 * Implements a balanced binary tree for efficient sync protocol
 * - Leaves: sorted contentHash values
 * - Internal nodes: SHA-256(left.hash + right.hash)
 * - Padded with empty hash if odd number of leaves
 * - Root: 64-character hex string
 */

/**
 * Internal node representation
 */
interface MerkleNode {
  hash: string;
  left?: MerkleNode;
  right?: MerkleNode;
}

/**
 * Public interface for Merkle tree operations
 */
export interface MerkleTree {
  root: string;
  build(contentHashes: string[]): Promise<void>;
  addLeaf(contentHash: string): Promise<void>;
  removeLeaf(contentHash: string): Promise<void>;
  getProof(contentHash: string): Array<{hash: string; isLeft: boolean}>;
  verifyProof(contentHash: string, proof: Array<{hash: string; isLeft: boolean}>, root: string): Promise<boolean>;
  getNodeHashesAtLevel(level: number): string[];
  findDivergentSubtrees(remoteHashes: string[], level: number): string[];
}

/**
 * Empty hash constant (SHA-256 of empty string)
 */
const EMPTY_HASH = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

/**
 * Convert Uint8Array to hex string
 */
function encodeHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Compute SHA-256 hash of concatenated hex strings
 */
async function hashPair(left: string, right: string): Promise<string> {
  const combined = left + right;
  const encoder = new TextEncoder();
  const data = encoder.encode(combined);
  const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', data);
  return encodeHex(new Uint8Array(hashBuffer));
}

/**
 * Create a Merkle tree instance
 */
export function createMerkleTree(): MerkleTree {
  let root: MerkleNode | null = null;
  let leaves: string[] = [];

  /**
   * Build tree from sorted content hashes
   * Ensures balanced tree and confluence property
   */
  async function buildTree(hashes: string[]): Promise<MerkleNode | null> {
    if (hashes.length === 0) {
      return null;
    }

    // Single leaf case: return it directly without padding
    if (hashes.length === 1) {
      return {
        hash: hashes[0],
        left: undefined,
        right: undefined,
      };
    }

    // Pad with empty hash if odd number of leaves
    const paddedHashes = [...hashes];
    if (paddedHashes.length % 2 !== 0) {
      paddedHashes.push(EMPTY_HASH);
    }

    // Build tree bottom-up
    let currentLevel: MerkleNode[] = paddedHashes.map((hash) => ({
      hash,
      left: undefined,
      right: undefined,
    }));

    while (currentLevel.length > 1) {
      const nextLevel: MerkleNode[] = [];
      for (let i = 0; i < currentLevel.length; i += 2) {
        const left = currentLevel[i];
        const right = currentLevel[i + 1];
        const parentHash = await hashPair(left.hash, right.hash);
        nextLevel.push({
          hash: parentHash,
          left,
          right,
        });
      }
      currentLevel = nextLevel;
    }

    return currentLevel[0];
  }

  /**
   * Get proof path for a leaf, including direction information
   */
  function getProofPath(node: MerkleNode | null | undefined, hash: string, proof: Array<{hash: string; isLeft: boolean}> = []): Array<{hash: string; isLeft: boolean}> | null {
    if (!node) return null;

    // Found the leaf
    if (node.hash === hash && !node.left && !node.right) {
      return proof;
    }

    // Search left - sibling is on the right
    if (node.left) {
      const leftProof = getProofPath(node.left, hash, [...proof, {hash: node.right?.hash || EMPTY_HASH, isLeft: false}]);
      if (leftProof) return leftProof;
    }

    // Search right - sibling is on the left
    if (node.right) {
      const rightProof = getProofPath(node.right, hash, [...proof, {hash: node.left?.hash || EMPTY_HASH, isLeft: true}]);
      if (rightProof) return rightProof;
    }

    return null;
  }

  /**
   * Verify proof by reconstructing hash up the tree
   */
  async function verifyProofPath(contentHash: string, proof: Array<{hash: string; isLeft: boolean}>, expectedRoot: string): Promise<boolean> {
    let currentHash = contentHash;

    for (const {hash: sibling, isLeft} of proof) {
      if (isLeft) {
        // Sibling is on the left
        currentHash = await hashPair(sibling, currentHash);
      } else {
        // Sibling is on the right
        currentHash = await hashPair(currentHash, sibling);
      }
    }

    return currentHash === expectedRoot;
  }

  /**
   * Get all hashes at a specific level
   */
  function getHashesAtLevel(node: MerkleNode | null | undefined, targetLevel: number, currentLevel: number = 0): string[] {
    if (!node) return [];

    if (currentLevel === targetLevel) {
      return [node.hash];
    }

    const hashes: string[] = [];
    if (node.left) {
      hashes.push(...getHashesAtLevel(node.left, targetLevel, currentLevel + 1));
    }
    if (node.right) {
      hashes.push(...getHashesAtLevel(node.right, targetLevel, currentLevel + 1));
    }

    return hashes;
  }

  /**
   * Find divergent subtrees by comparing hashes at a level
   */
  function findDivergent(
    node: MerkleNode | null | undefined,
    remoteHashes: Set<string>,
    targetLevel: number,
    currentLevel: number = 0
  ): string[] {
    if (!node) return [];

    if (currentLevel === targetLevel) {
      // At target level, return hashes that don't match remote
      return remoteHashes.has(node.hash) ? [] : [node.hash];
    }

    const divergent: string[] = [];
    if (node.left) {
      divergent.push(...findDivergent(node.left, remoteHashes, targetLevel, currentLevel + 1));
    }
    if (node.right) {
      divergent.push(...findDivergent(node.right, remoteHashes, targetLevel, currentLevel + 1));
    }

    return divergent;
  }

  return {
    get root(): string {
      return root?.hash || '';
    },

    async build(contentHashes: string[]): Promise<void> {
      // Sort hashes to ensure confluence property
      const sorted = [...contentHashes].sort();
      leaves = sorted;
      root = await buildTree(sorted);
    },

    async addLeaf(contentHash: string): Promise<void> {
      if (!leaves.includes(contentHash)) {
        leaves.push(contentHash);
        await this.build(leaves);
      }
    },

    async removeLeaf(contentHash: string): Promise<void> {
      const index = leaves.indexOf(contentHash);
      if (index !== -1) {
        leaves.splice(index, 1);
        await this.build(leaves);
      }
    },

    getProof(contentHash: string): Array<{hash: string; isLeft: boolean}> {
      const proof = getProofPath(root, contentHash);
      return proof ? proof.reverse() : [];
    },

    async verifyProof(contentHash: string, proof: Array<{hash: string; isLeft: boolean}>, root: string): Promise<boolean> {
      return verifyProofPath(contentHash, proof, root);
    },

    getNodeHashesAtLevel(level: number): string[] {
      return getHashesAtLevel(root, level);
    },

    findDivergentSubtrees(remoteHashes: string[], level: number): string[] {
      const remoteSet = new Set(remoteHashes);
      return findDivergent(root, remoteSet, level);
    },
  };
}
