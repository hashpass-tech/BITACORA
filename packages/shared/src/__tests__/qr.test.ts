/**
 * Unit tests for QR codec
 * Tests encodeQRPayload and decodeQRPayload functions
 */

import { describe, it, expect } from 'vitest';
import { encodeQRPayload, decodeQRPayload } from '../qr-codec';

describe('qr-codec', () => {
  describe('encodeQRPayload', () => {
    it('should encode valid peer connection information', () => {
      const peerId = 'peer123';
      const publicKey = 'abcd1234';
      const sdpOffer = 'v=0\r\no=- 123 456 IN IP4 127.0.0.1\r\n';

      const payload = encodeQRPayload(peerId, publicKey, sdpOffer);

      expect(payload).toBeDefined();
      expect(typeof payload).toBe('string');
      expect(payload.length).toBeGreaterThan(0);
    });

    it('should produce base64-encoded output', () => {
      const peerId = 'peer123';
      const publicKey = 'abcd1234';
      const sdpOffer = 'v=0\r\no=- 123 456 IN IP4 127.0.0.1\r\n';

      const payload = encodeQRPayload(peerId, publicKey, sdpOffer);

      // Base64 should only contain alphanumeric, +, /, and = characters
      expect(/^[A-Za-z0-9+/]*={0,2}$/.test(payload)).toBe(true);
    });

    it('should respect QR code size limit', () => {
      const peerId = 'peer123';
      const publicKey = 'abcd1234';
      const sdpOffer = 'v=0\r\no=- 123 456 IN IP4 127.0.0.1\r\n';

      const payload = encodeQRPayload(peerId, publicKey, sdpOffer);

      expect(payload.length).toBeLessThanOrEqual(4296);
    });

    it('should throw error if payload exceeds QR code limit', () => {
      const peerId = 'peer123';
      const publicKey = 'abcd1234';
      // Create a very large SDP offer that will exceed the limit
      const sdpOffer = 'v=0\r\n' + 'a='.repeat(10000);

      expect(() => encodeQRPayload(peerId, publicKey, sdpOffer)).toThrow(
        /QR payload exceeds maximum size/
      );
    });

    it('should handle special characters in inputs', () => {
      const peerId = 'peer-123_456';
      const publicKey = 'abcd1234!@#$%';
      const sdpOffer = 'v=0\r\no=- 123 456 IN IP4 127.0.0.1\r\ns=Test Session\r\n';

      const payload = encodeQRPayload(peerId, publicKey, sdpOffer);

      expect(payload).toBeDefined();
      expect(payload.length).toBeGreaterThan(0);
    });

    it('should handle empty strings', () => {
      const peerId = '';
      const publicKey = '';
      const sdpOffer = '';

      const payload = encodeQRPayload(peerId, publicKey, sdpOffer);

      expect(payload).toBeDefined();
      expect(payload.length).toBeGreaterThan(0);
    });

    it('should handle long inputs within size limit', () => {
      const peerId = 'peer' + 'x'.repeat(100);
      const publicKey = 'key' + 'y'.repeat(100);
      const sdpOffer = 'v=0\r\n' + 'a='.repeat(500);

      const payload = encodeQRPayload(peerId, publicKey, sdpOffer);

      expect(payload.length).toBeLessThanOrEqual(4296);
    });
  });

  describe('decodeQRPayload', () => {
    it('should decode valid QR payload', () => {
      const peerId = 'peer123';
      const publicKey = 'abcd1234';
      const sdpOffer = 'v=0\r\no=- 123 456 IN IP4 127.0.0.1\r\n';

      const encoded = encodeQRPayload(peerId, publicKey, sdpOffer);
      const decoded = decodeQRPayload(encoded);

      expect(decoded.peerId).toBe(peerId);
      expect(decoded.publicKey).toBe(publicKey);
      expect(decoded.sdpOffer).toBe(sdpOffer);
    });

    it('should throw error on invalid base64', () => {
      const invalidPayload = '!!!invalid base64!!!';

      expect(() => decodeQRPayload(invalidPayload)).toThrow(/Failed to decode QR payload/);
    });

    it('should throw error on invalid JSON', () => {
      const invalidJson = btoa('not valid json');

      expect(() => decodeQRPayload(invalidJson)).toThrow(/Failed to decode QR payload/);
    });

    it('should throw error on missing required fields', () => {
      const incompletePayload = btoa(JSON.stringify({ p: 'peer123' }));

      expect(() => decodeQRPayload(incompletePayload)).toThrow(/missing required fields/);
    });

    it('should throw error on null required fields', () => {
      const nullFieldPayload = btoa(JSON.stringify({ p: 'peer123', k: null, s: 'offer' }));

      expect(() => decodeQRPayload(nullFieldPayload)).toThrow(/missing required fields/);
    });

    it('should throw error on undefined required fields', () => {
      const undefinedFieldPayload = btoa(JSON.stringify({ p: 'peer123', k: undefined, s: 'offer' }));

      expect(() => decodeQRPayload(undefinedFieldPayload)).toThrow(/missing required fields/);
    });

    it('should handle special characters in decoded output', () => {
      const peerId = 'peer-123_456';
      const publicKey = 'abcd1234!@#$%';
      const sdpOffer = 'v=0\r\no=- 123 456 IN IP4 127.0.0.1\r\ns=Test Session\r\n';

      const encoded = encodeQRPayload(peerId, publicKey, sdpOffer);
      const decoded = decodeQRPayload(encoded);

      expect(decoded.peerId).toBe(peerId);
      expect(decoded.publicKey).toBe(publicKey);
      expect(decoded.sdpOffer).toBe(sdpOffer);
    });

    it('should handle empty strings in decoded output', () => {
      const peerId = '';
      const publicKey = '';
      const sdpOffer = '';

      const encoded = encodeQRPayload(peerId, publicKey, sdpOffer);
      const decoded = decodeQRPayload(encoded);

      expect(decoded.peerId).toBe(peerId);
      expect(decoded.publicKey).toBe(publicKey);
      expect(decoded.sdpOffer).toBe(sdpOffer);
    });

    it('should handle multiline SDP offers', () => {
      const peerId = 'peer123';
      const publicKey = 'abcd1234';
      const sdpOffer = `v=0
o=- 123 456 IN IP4 127.0.0.1
s=Test Session
t=0 0
a=group:BUNDLE 0
a=extmap-allow-mixed
a=msid-semantic: WMS stream
m=application 9 UDP/TLS/RTP/SAVPF 120
c=IN IP4 127.0.0.1
a=rtcp:9 IN IP4 127.0.0.1
a=ice-ufrag:abcd
a=ice-pwd:1234567890abcdef`;

      const encoded = encodeQRPayload(peerId, publicKey, sdpOffer);
      const decoded = decodeQRPayload(encoded);

      expect(decoded.peerId).toBe(peerId);
      expect(decoded.publicKey).toBe(publicKey);
      expect(decoded.sdpOffer).toBe(sdpOffer);
    });
  });

  describe('round-trip encoding/decoding', () => {
    it('should preserve data through encode-decode cycle', () => {
      const peerId = 'peer123';
      const publicKey = 'abcd1234';
      const sdpOffer = 'v=0\r\no=- 123 456 IN IP4 127.0.0.1\r\n';

      const encoded = encodeQRPayload(peerId, publicKey, sdpOffer);
      const decoded = decodeQRPayload(encoded);

      expect(decoded.peerId).toBe(peerId);
      expect(decoded.publicKey).toBe(publicKey);
      expect(decoded.sdpOffer).toBe(sdpOffer);
    });

    it('should handle multiple round-trips', () => {
      const peerId = 'peer123';
      const publicKey = 'abcd1234';
      const sdpOffer = 'v=0\r\no=- 123 456 IN IP4 127.0.0.1\r\n';

      let encoded = encodeQRPayload(peerId, publicKey, sdpOffer);
      let decoded = decodeQRPayload(encoded);

      // Second round-trip
      encoded = encodeQRPayload(decoded.peerId, decoded.publicKey, decoded.sdpOffer);
      decoded = decodeQRPayload(encoded);

      expect(decoded.peerId).toBe(peerId);
      expect(decoded.publicKey).toBe(publicKey);
      expect(decoded.sdpOffer).toBe(sdpOffer);
    });
  });
});
