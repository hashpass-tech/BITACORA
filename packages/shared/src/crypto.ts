/**
 * Crypto Module for Bitácora P2P
 * Implements cryptographic operations using TweetNaCl.js
 * - Ed25519 keypair generation and signing
 * - SHA-256 content hashing
 * - Curve25519 encryption (optional peer-to-peer)
 */

import * as nacl from 'tweetnacl';
import type { Memo } from './types';

/**
 * Convert hex string to Uint8Array
 */
function decodeHex(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

/**
 * Convert Uint8Array to hex string
 */
function encodeHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Convert string to Uint8Array using UTF-8 encoding
 */
function encodeUTF8(str: string): Uint8Array {
  const encoder = new TextEncoder();
  return encoder.encode(str);
}

export interface CryptoModule {
  generateKeypair(): { publicKey: Uint8Array; secretKey: Uint8Array };
  derivePeerId(publicKey: Uint8Array): string;
  computeContentHash(content: string): Promise<string>;
  signMemo(
    memo: Pick<Memo, 'id' | 'creator' | 'timestamp' | 'contentHash'>,
    secretKey: Uint8Array
  ): string;
  verifySignature(
    memo: Pick<Memo, 'id' | 'creator' | 'timestamp' | 'contentHash' | 'signature'>,
    publicKey: Uint8Array
  ): boolean;
  deriveSharedSecret(localSecretKey: Uint8Array, remotePublicKey: Uint8Array): Uint8Array;
  encrypt(message: Uint8Array, sharedSecret: Uint8Array): Uint8Array;
  decrypt(ciphertext: Uint8Array, sharedSecret: Uint8Array): Uint8Array;
}

/**
 * Create a CryptoModule instance
 */
export function createCryptoModule(): CryptoModule {
  return {
    /**
     * Generate an Ed25519 keypair
     * Returns: { publicKey: 32 bytes, secretKey: 64 bytes }
     */
    generateKeypair(): { publicKey: Uint8Array; secretKey: Uint8Array } {
      const keypair = nacl.sign.keyPair();
      return {
        publicKey: keypair.publicKey,
        secretKey: keypair.secretKey,
      };
    },

    /**
     * Derive peerId from public key
     * peerId = hex encoding of first 16 bytes of public key
     */
    derivePeerId(publicKey: Uint8Array): string {
      const first16Bytes = publicKey.slice(0, 16);
      return encodeHex(first16Bytes);
    },

    /**
     * Compute SHA-256 hash of content
     * Returns: hex-encoded SHA-256 digest
     */
    async computeContentHash(content: string): Promise<string> {
      const encoder = new TextEncoder();
      const data = encoder.encode(content);
      const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    },

    /**
     * Sign a memo using Ed25519 detached signature
     * Signs: id || creator || timestamp || contentHash
     * Returns: hex-encoded signature
     */
    signMemo(
      memo: Pick<Memo, 'id' | 'creator' | 'timestamp' | 'contentHash'>,
      secretKey: Uint8Array
    ): string {
      const message = `${memo.id}${memo.creator}${memo.timestamp}${memo.contentHash}`;
      const messageBytes = encodeUTF8(message);
      const signature = nacl.sign.detached(messageBytes, secretKey);
      return encodeHex(signature);
    },

    /**
     * Verify a memo signature using Ed25519
     * Returns: true if signature is valid, false otherwise
     */
    verifySignature(
      memo: Pick<Memo, 'id' | 'creator' | 'timestamp' | 'contentHash' | 'signature'>,
      publicKey: Uint8Array
    ): boolean {
      try {
        const message = `${memo.id}${memo.creator}${memo.timestamp}${memo.contentHash}`;
        const messageBytes = encodeUTF8(message);
        const signatureBytes = decodeHex(memo.signature);
        return nacl.sign.detached.verify(messageBytes, signatureBytes, publicKey);
      } catch {
        return false;
      }
    },

    /**
     * Derive a shared secret using Curve25519 key exchange
     * Uses: tweetnacl.box.before(remotePublicKey, localSecretKey)
     */
    deriveSharedSecret(localSecretKey: Uint8Array, remotePublicKey: Uint8Array): Uint8Array {
      return nacl.box.before(remotePublicKey, localSecretKey);
    },

    /**
     * Encrypt a message using secretbox with a shared secret
     * Returns: ciphertext (nonce + encrypted data)
     */
    encrypt(message: Uint8Array, sharedSecret: Uint8Array): Uint8Array {
      const nonce = nacl.randomBytes(nacl.secretbox.nonceLength);
      const ciphertext = nacl.secretbox(message, nonce, sharedSecret);
      if (!ciphertext) {
        throw new Error('Encryption failed');
      }
      // Prepend nonce to ciphertext
      const result = new Uint8Array(nonce.length + ciphertext.length);
      result.set(nonce);
      result.set(ciphertext, nonce.length);
      return result;
    },

    /**
     * Decrypt a message using secretbox with a shared secret
     * Expects: ciphertext with nonce prepended
     * Returns: original message or throws on failure
     */
    decrypt(ciphertext: Uint8Array, sharedSecret: Uint8Array): Uint8Array {
      const nonceLength = nacl.secretbox.nonceLength;
      if (ciphertext.length < nonceLength) {
        throw new Error('Ciphertext too short');
      }
      const nonce = ciphertext.slice(0, nonceLength);
      const encrypted = ciphertext.slice(nonceLength);
      const message = nacl.secretbox.open(encrypted, nonce, sharedSecret);
      if (!message) {
        throw new Error('Decryption failed');
      }
      return message;
    },
  };
}

// Export singleton instance
export const crypto = createCryptoModule();
