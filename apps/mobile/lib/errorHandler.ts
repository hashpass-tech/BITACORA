/**
 * Error handling utilities for P2P operations
 * Handles storage failures, network errors, and invalid signatures
 * Requirements: 32.1, 32.2, 32.4, 32.5
 */

export interface ErrorContext {
  operation: string;
  peerId?: string;
  memoId?: string;
  details?: string;
}

/**
 * Log a warning for invalid signature
 * Silently discards the memo without crashing
 */
export function logInvalidSignature(context: ErrorContext): void {
  const message = `Invalid signature on memo ${context.memoId} from peer ${context.peerId}`;
  console.warn(`[P2P] ${message}`, context.details);
}

/**
 * Log a storage error
 */
export function logStorageError(context: ErrorContext, error: Error): void {
  const message = `Storage error during ${context.operation}`;
  console.error(`[Storage] ${message}:`, error.message, context);
}

/**
 * Log a network error
 */
export function logNetworkError(context: ErrorContext, error: Error): void {
  const message = `Network error during ${context.operation}`;
  console.error(`[Network] ${message}:`, error.message, context);
}

/**
 * Log a sync error
 */
export function logSyncError(context: ErrorContext, error: Error): void {
  const message = `Sync error with peer ${context.peerId}`;
  console.error(`[Sync] ${message}:`, error.message, context);
}

/**
 * Determine if an error is retryable
 */
export function isRetryableError(error: Error): boolean {
  const retryableMessages = [
    'ECONNREFUSED',
    'ENOTFOUND',
    'ETIMEDOUT',
    'EHOSTUNREACH',
    'network',
    'timeout',
    'connection',
  ];

  const errorStr = error.message.toLowerCase();
  return retryableMessages.some((msg) => errorStr.includes(msg));
}

/**
 * Format error message for user display
 */
export function formatErrorMessage(error: Error | string): string {
  if (typeof error === 'string') {
    return error;
  }

  const message = error.message || 'An unknown error occurred';

  // Simplify technical error messages for users
  if (message.includes('ECONNREFUSED')) {
    return 'Connection refused. Please check your network.';
  }
  if (message.includes('ENOTFOUND')) {
    return 'Host not found. Please check your network.';
  }
  if (message.includes('ETIMEDOUT')) {
    return 'Connection timed out. Please try again.';
  }
  if (message.includes('storage')) {
    return 'Failed to save data. Please try again.';
  }

  return message;
}
