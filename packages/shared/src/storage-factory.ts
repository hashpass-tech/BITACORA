/**
 * Storage Factory with Platform Detection
 * Requirement 7.2: Platform-agnostic storage factory that detects runtime environment
 * 
 * Detects the runtime platform and instantiates the appropriate storage adapter:
 * - Browser (window + indexedDB exist) → IndexedDB
 * - React Native (no window or no indexedDB) → SQLite
 */

import type { StorageAdapter } from './storage';
import { IndexedDBStorage } from './storage-indexeddb';
import { SQLiteStorage } from './storage-sqlite';

/**
 * Create a storage adapter based on the runtime platform
 * 
 * Platform detection logic:
 * - If `window` object exists AND `indexedDB` is available → use IndexedDB (browser)
 * - Otherwise → use SQLite (React Native or other environments)
 * 
 * Requirement 7.2: Detect platform and instantiate appropriate backend
 * 
 * @returns StorageAdapter instance appropriate for the current platform
 */
export function createStorage(): StorageAdapter {
  // Check if we're in a browser environment with IndexedDB support
  if (typeof window !== 'undefined' && 'indexedDB' in window) {
    return new IndexedDBStorage();
  }

  // Default to SQLite for React Native and other environments
  return new SQLiteStorage();
}
