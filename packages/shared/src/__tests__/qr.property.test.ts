/**
 * Property-based tests for QR codec
 * Tests universal properties that should hold for all valid inputs
 *
 * **Validates: Requirements 16.1, 16.2**
 */

import { describe, it } from 'vitest';
import fc from 'fast-check';
import { encodeQRPayload, decodeQRPayload } from '../qr-codec';

describe('qr-codec properties', () => {
  /**
   * Property 11: QR code payload round-trip
   *
   * For any valid peerId, publicKey, and SDP offer string, encoding them into a QR code
   * payload and then decoding SHALL recover the original peerId, publicKey, and SDP offer.
   *
   * **Validates: Requirements 16.1, 16.2**
   */
  it('Property 11: QR code payload round-trip', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 100 }), // peerId
        fc.string({ minLength: 0, maxLength: 100 }), // publicKey
        fc.string({ minLength: 0, maxLength: 2000 }), // sdpOffer (keep reasonable size)
        (peerId, publicKey, sdpOffer) => {
          // Skip if the combined payload would exceed QR code limit
          // (this is tested separately in unit tests)
          const testPayload = {
            p: peerId,
            k: publicKey,
            s: sdpOffer,
          };
          const jsonSize = JSON.stringify(testPayload).length;
          const estimatedBase64Size = Math.ceil((jsonSize * 4) / 3);

          if (estimatedBase64Size > 4296) {
            // Skip this case - it's expected to fail
            return true;
          }

          // Encode the payload
          const encoded = encodeQRPayload(peerId, publicKey, sdpOffer);

          // Verify encoded payload is within QR code size limit
          if (encoded.length > 4296) {
            return false;
          }

          // Decode the payload
          const decoded = decodeQRPayload(encoded);

          // Verify all fields are recovered exactly
          return (
            decoded.peerId === peerId &&
            decoded.publicKey === publicKey &&
            decoded.sdpOffer === sdpOffer
          );
        }
      )
    );
  });

  /**
   * Additional property: Encoded payload is always valid base64
   *
   * For any valid inputs that don't exceed the size limit, the encoded payload
   * should always be valid base64 (only alphanumeric, +, /, and = characters).
   */
  it('Encoded payload is always valid base64', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 50 }), // peerId
        fc.string({ minLength: 0, maxLength: 50 }), // publicKey
        fc.string({ minLength: 0, maxLength: 1000 }), // sdpOffer
        (peerId, publicKey, sdpOffer) => {
          // Skip if the combined payload would exceed QR code limit
          const testPayload = {
            p: peerId,
            k: publicKey,
            s: sdpOffer,
          };
          const jsonSize = JSON.stringify(testPayload).length;
          const estimatedBase64Size = Math.ceil((jsonSize * 4) / 3);

          if (estimatedBase64Size > 4296) {
            return true; // Skip
          }

          const encoded = encodeQRPayload(peerId, publicKey, sdpOffer);

          // Base64 should only contain alphanumeric, +, /, and = characters
          return /^[A-Za-z0-9+/]*={0,2}$/.test(encoded);
        }
      )
    );
  });

  /**
   * Additional property: Encoded payload is always decodable
   *
   * For any valid inputs that don't exceed the size limit, the encoded payload
   * should always be decodable without throwing an error.
   */
  it('Encoded payload is always decodable', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 50 }), // peerId
        fc.string({ minLength: 0, maxLength: 50 }), // publicKey
        fc.string({ minLength: 0, maxLength: 1000 }), // sdpOffer
        (peerId, publicKey, sdpOffer) => {
          // Skip if the combined payload would exceed QR code limit
          const testPayload = {
            p: peerId,
            k: publicKey,
            s: sdpOffer,
          };
          const jsonSize = JSON.stringify(testPayload).length;
          const estimatedBase64Size = Math.ceil((jsonSize * 4) / 3);

          if (estimatedBase64Size > 4296) {
            return true; // Skip
          }

          const encoded = encodeQRPayload(peerId, publicKey, sdpOffer);

          // Should not throw
          try {
            decodeQRPayload(encoded);
            return true;
          } catch {
            return false;
          }
        }
      )
    );
  });

  /**
   * Additional property: Encoding is deterministic
   *
   * For any given inputs, encoding the same data twice should produce identical results.
   */
  it('Encoding is deterministic', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 50 }), // peerId
        fc.string({ minLength: 0, maxLength: 50 }), // publicKey
        fc.string({ minLength: 0, maxLength: 1000 }), // sdpOffer
        (peerId, publicKey, sdpOffer) => {
          // Skip if the combined payload would exceed QR code limit
          const testPayload = {
            p: peerId,
            k: publicKey,
            s: sdpOffer,
          };
          const jsonSize = JSON.stringify(testPayload).length;
          const estimatedBase64Size = Math.ceil((jsonSize * 4) / 3);

          if (estimatedBase64Size > 4296) {
            return true; // Skip
          }

          const encoded1 = encodeQRPayload(peerId, publicKey, sdpOffer);
          const encoded2 = encodeQRPayload(peerId, publicKey, sdpOffer);

          return encoded1 === encoded2;
        }
      )
    );
  });
});
