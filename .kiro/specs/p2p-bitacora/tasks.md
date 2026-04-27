# Implementation Plan: Bitácora P2P

## Overview

Transform the existing Bitácora app into a fully client-side, peer-to-peer architecture. Implementation is organized into three phases matching the requirements: core data & crypto, P2P networking & sync, and React Native UI & AI agent. All P2P logic lives in `packages/shared/src/` as platform-agnostic TypeScript, with platform-specific storage adapters and React Native UI in `apps/mobile/`.

## Tasks

- [x] 1. Set up project infrastructure and dependencies
  - [x] 1.1 Install shared package dependencies
    - Add `tweetnacl`, `tweetnacl-util`, `uuid`, and `fast-check` (dev) to `packages/shared/package.json`
    - Add `vitest` as the test runner in `packages/shared`
    - Configure `vitest` in `packages/shared` with a `vitest.config.ts`
    - Add a `"test"` script to `packages/shared/package.json`
    - _Requirements: 8.1, 31.2_

  - [x] 1.2 Create core type definitions
    - Create `packages/shared/src/types.ts` with `Memo`, `Edge`, `Peer`, `UserProfile`, `MemoStatus`, `EdgeRelation` interfaces and types exactly as specified in the design
    - Create `packages/shared/src/constants.ts` with shared constants (DB name, data channel name, backoff config)
    - Export all types from `packages/shared/src/index.ts`
    - _Requirements: 1.1, 2.1, 3.1, 4.1_

- [-] 2. Implement Crypto Module
  - [x] 2.1 Implement crypto functions
    - Create `packages/shared/src/crypto.ts` implementing the `CryptoModule` interface
    - Implement `generateKeypair()` using `tweetnacl.sign.keyPair()`
    - Implement `derivePeerId(publicKey)` as hex of first 16 bytes of public key
    - Implement `computeContentHash(content)` using Web Crypto API `crypto.subtle.digest('SHA-256', ...)`
    - Implement `signMemo()` using `tweetnacl.sign.detached()` over concatenation of id, creator, timestamp, contentHash
    - Implement `verifySignature()` using `tweetnacl.sign.detached.verify()`
    - Implement `deriveSharedSecret()` using `tweetnacl.box.before()`
    - Implement `encrypt()` / `decrypt()` using `tweetnacl.secretbox` / `tweetnacl.secretbox.open`
    - _Requirements: 8.1, 8.2, 8.4, 9.1, 9.2, 9.3, 10.1, 10.4, 21.1, 21.2, 21.3, 21.4_

  - [ ]* 2.2 Write property test: Content hash integrity
    - **Property 1: Content hash integrity**
    - Create `packages/shared/src/__tests__/crypto.property.test.ts`
    - For any content string, creating a Memo produces a contentHash equal to SHA-256 hex of that content
    - Use `fc.string()` to generate arbitrary content
    - **Validates: Requirements 1.2**

  - [ ]* 2.3 Write property test: Keypair generation invariants
    - **Property 6: Keypair generation invariants**
    - For any generated keypair, public key is 32 bytes, secret key is 64 bytes, peerId equals hex of first 16 bytes of public key
    - Use `fc.nat()` as seed to generate multiple keypairs
    - **Validates: Requirements 8.2, 8.4**

  - [ ]* 2.4 Write property test: Sign/verify round-trip
    - **Property 7: Sign/verify round-trip**
    - For any valid Memo fields and keypair, signing then verifying returns true
    - Use `fc.record()` to generate arbitrary Memo field values
    - **Validates: Requirements 9.1, 10.1, 10.4**

  - [ ]* 2.5 Write property test: Tampered signature rejection
    - **Property 8: Tampered signature rejection**
    - For any signed Memo, modifying signature, content, or creator after signing causes verification to return false
    - Use `fc.oneof()` to choose which field to tamper
    - **Validates: Requirements 10.2**

  - [ ]* 2.6 Write property test: Encrypt/decrypt round-trip
    - **Property 15: Encrypt/decrypt round-trip**
    - For any message bytes and two keypairs, encrypt then decrypt produces original message; shared secret from (A.secret, B.public) equals (B.secret, A.public)
    - Use `fc.uint8Array()` to generate arbitrary messages
    - **Validates: Requirements 21.1, 21.4**

- [x] 3. Checkpoint — Core crypto tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement Storage Layer
  - [x] 4.1 Create StorageAdapter interface
    - Create `packages/shared/src/storage.ts` defining the `StorageAdapter` interface with all methods: putMemo, getMemo, getAllMemos, deleteMemo, putEdge, getEdge, getEdgesByMemo, putPeer, getPeer, getAllPeers, getProfile, putProfile, initialize, close
    - _Requirements: 7.1_

  - [x] 4.2 Implement IndexedDB storage adapter
    - Create `packages/shared/src/storage-indexeddb.ts` implementing `StorageAdapter`
    - Database name: `"bitacora-p2p"`, version 1
    - Object stores: `memos` (keyPath: `id`, indexes: `creator`, `timestamp`, `contentHash`), `edges` (keyPath: `id`, indexes: `sourceId`, `targetId`), `peers` (keyPath: `peerId`, index: `lastSeen`), `userProfile` (keyPath: `peerId`)
    - All writes use single transactions for atomicity
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

  - [x] 4.3 Implement SQLite storage adapter
    - Create `packages/shared/src/storage-sqlite.ts` implementing `StorageAdapter`
    - Database file: `"bitacora-p2p.db"`, uses `expo-sqlite`
    - Create tables with columns matching interfaces, appropriate SQL types, indexes, and CHECK constraints
    - All writes use `BEGIN/COMMIT` transactions
    - Serialize `merkleProof` array as JSON string for storage
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

  - [x] 4.4 Implement storage factory with platform detection
    - Create `packages/shared/src/storage-factory.ts`
    - Detect platform: if `window` and `indexedDB` exist → IndexedDB, otherwise → SQLite
    - Export `createStorage(): StorageAdapter`
    - _Requirements: 7.2_

  - [ ]* 4.5 Write property test: Memo storage round-trip
    - **Property 4: Memo storage round-trip**
    - Create `packages/shared/src/__tests__/storage.property.test.ts`
    - For any valid Memo, putMemo then getMemo returns deeply equal object
    - Use an in-memory storage adapter or mock for testing
    - **Validates: Requirements 5.5, 6.5, 7.3**

  - [ ]* 4.6 Write property test: Edge storage round-trip
    - **Property 5: Edge storage round-trip**
    - For any valid Edge with valid Memo references, putEdge then getEdge returns deeply equal object
    - **Validates: Requirements 7.4**

- [-] 5. Implement Type Validation and Entity Creation
  - [x] 5.1 Implement Memo and Edge creation helpers
    - Create `packages/shared/src/entity-helpers.ts`
    - Implement `createMemo(content, profile, crypto)` that generates UUID, computes contentHash, signs, sets timestamp
    - Implement `createEdge(sourceId, targetId, relation, weight, storage)` that validates Memo references exist before creating
    - _Requirements: 1.2, 1.3, 1.4, 2.2, 2.3_

  - [ ]* 5.2 Write property test: Entity ID uniqueness
    - **Property 2: Entity ID uniqueness**
    - Create `packages/shared/src/__tests__/types.property.test.ts`
    - For any collection of generated Memos and Edges, all ids are valid UUID v4 and unique
    - **Validates: Requirements 1.4, 2.3**

  - [ ]* 5.3 Write property test: Edge reference validation
    - **Property 3: Edge reference validation**
    - For any Edge where sourceId or targetId doesn't reference an existing Memo, creation is rejected; for valid references, creation succeeds
    - **Validates: Requirements 2.2**

- [x] 6. Implement Merkle Tree
  - [x] 6.1 Implement Merkle tree data structure
    - Create `packages/shared/src/merkle.ts` implementing the `MerkleTree` interface
    - Build balanced binary tree from sorted contentHash values
    - Internal nodes: `SHA-256(left.hash + right.hash)`
    - Pad with empty hash if odd number of leaves
    - Implement `build()`, `addLeaf()`, `removeLeaf()`, `getProof()`, `verifyProof()`, `getNodeHashesAtLevel()`, `findDivergentSubtrees()`
    - Root is a 64-character hex string
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

  - [ ]* 6.2 Write property test: Merkle tree root changes on mutation
    - **Property 9: Merkle tree root changes on mutation**
    - Create `packages/shared/src/__tests__/merkle.property.test.ts`
    - For any non-empty tree and any hash not in the tree, adding it changes the root; for any hash in the tree, removing it changes the root
    - **Validates: Requirements 11.3**

  - [ ]* 6.3 Write property test: Merkle tree confluence
    - **Property 10: Merkle tree confluence**
    - For any set of content hashes and any two permutations, constructing the tree from each produces the same root
    - Use `fc.array(fc.hexaString())` and `fc.shuffledSubarray()` to generate permutations
    - **Validates: Requirements 11.5**

- [x] 7. Checkpoint — Phase 1 complete, all core data structures and crypto tested
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Implement Signal Server
  - [x] 8.1 Create signal server
    - Create `signal-server/` directory with `package.json`, `tsconfig.json`, and `index.ts`
    - Implement ~100 line Express server with POST `/offer`, `/answer`, `/icecandidate` endpoints
    - In-memory `Map<string, PeerSignalData>` for peer data, no persistence
    - Validate required fields, return 400 for missing fields, 200 for success
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7_

  - [ ]* 8.2 Write integration tests for signal server
    - Create `signal-server/__tests__/server.test.ts`
    - Test POST /offer, /answer, /icecandidate with valid and invalid payloads
    - Test 400 responses for missing fields
    - _Requirements: 12.4, 12.5, 12.6, 12.7_

- [x] 9. Implement P2P Client and WebRTC
  - [x] 9.1 Implement P2P client
    - Create `packages/shared/src/p2p-client.ts` implementing the `P2PClient` interface
    - Manage RTCPeerConnection instances per peer
    - Create data channel `"bitacora-sync"` with ordered delivery
    - Handle SDP offer/answer creation and ICE candidate relay
    - Implement event callbacks: onPeerConnected, onPeerDisconnected, onMemoReceived, onSyncStatusChanged
    - Implement exponential backoff reconnection (1s initial, 30s max, 5 max retries)
    - JSON-encode all data channel messages with `type` field
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 14.1, 14.2, 14.3, 14.4, 32.1_

  - [x] 9.2 Implement QR code payload encoding/decoding
    - Create `packages/shared/src/qr-codec.ts`
    - Implement `encodeQRPayload(peerId, publicKey, sdpOffer)` → compact string under 4,296 chars
    - Implement `decodeQRPayload(payload)` → `{ peerId, publicKey, sdpOffer }`
    - _Requirements: 16.1, 16.2, 16.3_

  - [ ]* 9.3 Write property test: QR code payload round-trip
    - **Property 11: QR code payload round-trip**
    - Create `packages/shared/src/__tests__/qr.property.test.ts`
    - For any valid peerId, publicKey, and SDP offer, encoding then decoding recovers the originals
    - **Validates: Requirements 16.1, 16.2**

  - [x] 9.4 Implement peer discovery stubs (DHT, mDNS)
    - Create `packages/shared/src/discovery.ts`
    - Implement DHT discovery interface using WebTorrent-compatible topic announcement
    - Implement mDNS discovery interface with `_bitacora._tcp` service type and TXT record containing peerId and publicKey
    - Both trigger `connectToPeer()` on the P2P client when a new peer is found
    - _Requirements: 15.1, 15.2, 15.3, 17.1, 17.2, 17.3_

- [x] 10. Implement Sync Protocol
  - [x] 10.1 Implement sync protocol
    - Create `packages/shared/src/sync.ts` implementing the `SyncProtocol` interface
    - Implement `initSync()`: send sync-request with local Merkle root
    - Implement `handleMessage()`: process sync-request, sync-response, tree-level, tree-diff, memos, sync-complete messages
    - On root match → respond with `{ status: "in-sync" }`
    - On root mismatch → level-by-level hash exchange to find divergent subtrees
    - Request only missing memos from divergent leaves
    - Verify signatures on received memos before storing
    - Update Merkle tree with new leaves after storing
    - Track sync status: idle, syncing, complete, error
    - _Requirements: 18.1, 18.2, 18.3, 18.4, 19.1, 19.2, 19.3, 19.4, 19.5_

  - [x] 10.2 Implement conflict resolution
    - Add conflict resolution logic to sync protocol
    - When two Memos share the same id but different contentHash: keep earlier timestamp; if equal, keep lexicographically smaller contentHash
    - Deterministic regardless of memo order
    - _Requirements: 20.1, 20.2, 20.3_

  - [ ]* 10.3 Write property test: Sync transfers exactly the set difference
    - **Property 12: Sync transfers exactly the set difference**
    - Create `packages/shared/src/__tests__/sync.property.test.ts`
    - For any two distinct sets of signed Memos, sync transfers exactly `A \ B` to B and `B \ A` to A
    - Use in-memory peers with mock data channels
    - **Validates: Requirements 18.3, 19.1, 19.3**

  - [ ]* 10.4 Write property test: Sync convergence
    - **Property 13: Sync convergence**
    - After complete sync, both peers' Merkle trees have the same root hash
    - **Validates: Requirements 19.5**

  - [ ]* 10.5 Write property test: Conflict resolution confluence
    - **Property 14: Conflict resolution confluence**
    - For any two Memos with same id but different contentHash, resolution is deterministic and order-independent
    - **Validates: Requirements 20.1, 20.2, 20.3**

- [x] 11. Checkpoint — Phase 2 complete, P2P networking and sync tested
  - Ensure all tests pass, ask the user if questions arise.

- [x] 12. Wire shared package exports
  - Update `packages/shared/src/index.ts` to export all new modules: types, crypto, storage (interface + factory), merkle, sync, p2p-client, qr-codec, discovery, entity-helpers, ai-agent
  - Rebuild shared package and verify no TypeScript errors
  - _Requirements: 7.1, 7.2_

- [x] 13. Implement AI Agent
  - [x] 13.1 Implement AI agent module
    - Create `packages/shared/src/ai-agent.ts` implementing the `AIAgent` interface
    - Implement `synthesizeConsensus(topic, memos, edges)`: query memos/edges by topic, send to Claude API, return structured `ConsensusSynthesis` with statement, supporting memo ids, confidence level
    - Implement `detectContradictions(memos, edges)`: analyze "contradicts" edges and semantic opposition, return `Contradiction[]` with memo pairs and explanations
    - Implement `analyzeGraph(memos, edges)`: traverse graph for clusters, paths, central nodes, return `GraphInsights` with mostConnected, strongestChains, isolatedClusters, suggestedEdges
    - Handle API errors gracefully: display error, offer retry, never block main flow
    - Return "insufficient data" when fewer than 2 memos for a topic
    - _Requirements: 28.1, 28.2, 28.3, 28.4, 29.1, 29.2, 29.3, 30.1, 30.2, 30.3, 30.4, 32.3_

  - [ ]* 13.2 Write unit tests for AI agent
    - Create `packages/shared/src/__tests__/ai-agent.test.ts`
    - Test prompt construction for each method
    - Test response parsing and error handling with mocked Claude API
    - Test insufficient data handling (< 2 memos)
    - _Requirements: 28.4, 32.3_

- [x] 14. Implement React Native UI — Memo Screens
  - [x] 14.1 Create Memo creation screen
    - Create `apps/mobile/app/(tabs)/memos.tsx` or update existing tab for Memo creation
    - Text input for content, submit button
    - Disable submit when content is empty, show validation message
    - On submit: invoke crypto to sign, storage to persist, display new Memo within 500ms
    - Use dark theme: background #0A1628, WCAG AA contrast text colors
    - _Requirements: 22.1, 22.2, 22.3, 22.4, 26.1, 26.2_

  - [x] 14.2 Create Memo list and detail views
    - Implement scrollable Memo list sorted by timestamp descending
    - Each item shows: content (2 lines), creator peerId (truncated), relative time, status badge
    - Tap navigates to detail view with all fields including signature and Merkle proof
    - Support pull-to-refresh
    - Dark theme consistent across list and detail
    - _Requirements: 23.1, 23.2, 23.3, 23.4, 26.1, 26.2, 26.3_

- [x] 15. Implement React Native UI — Peer and Sync Screens
  - [x] 15.1 Create Peer status panel
    - Create peer status UI showing all known peers
    - Display: peerId (truncated), connection status (green online / gray offline), lastSeen relative time, reputationScore visual indicator
    - Update indicators within 1 second of status change
    - _Requirements: 24.1, 24.2, 24.3, 24.4, 26.3_

  - [x] 15.2 Create sync status indicators
    - Show sync-in-progress indicator with peer's peerId during active sync
    - Display "Synced" confirmation for 3 seconds on success
    - Show error indicator with retry option on failure
    - Display total memos synced in current session
    - _Requirements: 25.1, 25.2, 25.3, 25.4_

- [x] 16. Implement React Native UI — Knowledge Graph and AI
  - [x] 16.1 Create Knowledge Graph visualization screen
    - Render interactive node-link diagram: Memos as nodes, Edges as links
    - Nodes color-coded by status: pending (yellow), verified (green), disputed (red)
    - Links styled by relation: supports (green), contradicts (red), relates_to (gray), thickness by weight
    - Tap node → navigate to Memo detail
    - Support pinch-to-zoom and pan gestures
    - _Requirements: 27.1, 27.2, 27.3, 27.4, 27.5, 26.3_

  - [x] 16.2 Create AI Agent UI panel
    - Create AI agent screen with options for: consensus synthesis, contradiction detection, graph reasoning
    - Display structured results with Memo references the user can tap to navigate
    - Show error messages with retry button on API failure
    - Show "insufficient data" message when applicable
    - _Requirements: 28.3, 29.3, 29.4, 30.3, 30.4, 32.3_

- [x] 17. Implement tab navigation and offline mode
  - [x] 17.1 Update tab layout for new screens
    - Update `apps/mobile/app/(tabs)/_layout.tsx` to include Memos, Peers, Graph, and AI Agent tabs
    - Apply dark theme to tab bar
    - _Requirements: 26.3_

  - [x] 17.2 Implement offline mode and error handling
    - Ensure full functionality offline: access to local Memos, Edges, Knowledge Graph
    - Show "offline" indicators when network unavailable
    - Auto-reconnect to known peers when connectivity restored
    - Surface user-visible error toasts for storage failures with retry
    - Silently discard invalid-signature memos with warning log
    - _Requirements: 32.1, 32.2, 32.4, 32.5_

- [x] 18. Final checkpoint — All phases complete
  - Ensure all tests pass, ask the user if questions arise.
  - Verify shared package builds without TypeScript errors
  - Verify signal server compiles and starts
  - Confirm all requirements 1–32 are covered by implementation tasks

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at phase boundaries
- Property tests validate the 15 universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- All P2P logic is in `packages/shared/src/` for platform-agnostic reuse
- React Native UI uses dark theme (#0A1628) consistently across all screens
