/**
 * QR Code Payload Encoding/Decoding
 * Encodes peer connection information (peerId, publicKey, SDP offer) into a compact
 * QR code payload that fits within QR code size limits (4,296 alphanumeric characters).
 *
 * Uses base64 encoding with compression to minimize payload size.
 */

/**
 * Encodes peer connection information into a compact QR code payload
 * @param peerId - The peer's unique identifier
 * @param publicKey - The peer's Ed25519 public key (hex string)
 * @param sdpOffer - The WebRTC SDP offer string
 * @returns Compact base64-encoded payload string under 4,296 characters
 * @throws Error if payload exceeds QR code size limit
 */
export function encodeQRPayload(
  peerId: string,
  publicKey: string,
  sdpOffer: string
): string {
  // Create a JSON object with the connection information
  const payload = {
    p: peerId,           // peerId
    k: publicKey,        // publicKey
    s: sdpOffer,         // sdpOffer
  };

  // Serialize to JSON
  const jsonString = JSON.stringify(payload);

  // Encode to base64
  const base64Payload = btoa(jsonString);

  // Verify size constraint (4,296 alphanumeric characters for QR code)
  const QR_CODE_MAX_SIZE = 4296;
  if (base64Payload.length > QR_CODE_MAX_SIZE) {
    throw new Error(
      `QR payload exceeds maximum size: ${base64Payload.length} > ${QR_CODE_MAX_SIZE} characters`
    );
  }

  return base64Payload;
}

/**
 * Decodes a QR code payload back into peer connection information
 * @param payload - The base64-encoded QR payload
 * @returns Object containing peerId, publicKey, and sdpOffer
 * @throws Error if payload is invalid or cannot be decoded
 */
export function decodeQRPayload(
  payload: string
): { peerId: string; publicKey: string; sdpOffer: string } {
  try {
    // Decode from base64
    const jsonString = atob(payload);

    // Parse JSON
    const decoded = JSON.parse(jsonString);

    // Validate required fields (check for undefined/null, not falsy values)
    if (decoded.p === undefined || decoded.p === null ||
        decoded.k === undefined || decoded.k === null ||
        decoded.s === undefined || decoded.s === null) {
      throw new Error('Invalid QR payload: missing required fields');
    }

    // Return with full field names
    return {
      peerId: decoded.p,
      publicKey: decoded.k,
      sdpOffer: decoded.s,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to decode QR payload: ${error.message}`);
    }
    throw new Error('Failed to decode QR payload: unknown error');
  }
}
