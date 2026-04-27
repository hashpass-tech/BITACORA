# Requirements Document

## Introduction

Bitácora P2P transforms the existing Bitácora collaborative fact-checking and knowledge graph application from a client-server model into a fully client-side, peer-to-peer, zero-server-dependency architecture. Peers communicate directly via WebRTC, store data locally (IndexedDB for browser, SQLite for React Native), synchronize efficiently using a Merkle tree-based differential sync protocol, and cryptographically sign all contributions using TweetNaCl.js. An optional stateless signal server facilitates initial peer discovery only. An on-device AI agent (Claude API) provides consensus synthesis and contradiction detection across the knowledge graph.

The feature is organized into three phases:
- **Phase 1 — Core Data & Crypto (Days 1–2):** Data structures, local storage, cryptographic identity and signing.
- **Phase 2 — P2P Networking & Sync (Days 3–4):** WebRTC connections, peer discovery, Merkle tree sync protocol, conflict resolution.
- **Phase 3 — UI & AI Agent (Days 5–6):** React Native UI for memos/peers/graph, on-device Claude-powered agent, polish and error handling.

## Glossary

- **Memo**: A unit of knowledge in the Bitácora graph — a fact, claim, or note created by a peer, containing content, a cryptographic signature, and Merkle proof metadata.
- **Edge**: A directed, weighted relationship between two Memos in the knowledge graph (e.g., "supports", "contradicts", "relates_to").
- **Peer**: A participant in the P2P network identified by a unique peerId and Ed25519 public key.
- **Bitacora_P2P_Client**: The core client-side class managing WebRTC connections, peer discovery, data channels, and sync orchestration.
- **Merkle_Tree**: A hash tree data structure used to efficiently compare and synchronize Memo collections between peers with O(log n) complexity.
- **Signal_Server**: An optional, stateless Node.js server (~100 lines) that relays WebRTC offer/answer/ICE candidate messages for peer discovery without storing any data.
- **Crypto_Module**: The cryptographic subsystem using TweetNaCl.js for Ed25519 keypair generation, memo signing, signature verification, and optional Curve25519 encryption.
- **Local_Storage**: The platform-specific persistence layer — IndexedDB (browser) or SQLite (React Native) — storing Memos, Edges, Peers, and UserProfile.
- **Sync_Protocol**: The Merkle tree-based differential synchronization protocol that exchanges roots, finds divergence, and transfers only missing Memos.
- **Knowledge_Graph**: The directed graph formed by Memos (nodes) and Edges (relationships) representing the collective fact-checking corpus.
- **AI_Agent**: The on-device Claude API-powered reasoning module that synthesizes consensus, detects contradictions, and performs graph analysis.
- **DHT**: Distributed Hash Table — a decentralized peer discovery mechanism (WebTorrent-compatible).
- **mDNS**: Multicast DNS — a local network peer discovery mechanism for peers on the same WiFi.
- **UserProfile**: The local identity record containing the peer's keypair, display name, and configuration.
- **Reputation_Score**: A numeric score associated with a Peer reflecting trustworthiness based on contribution history.
- **Content_Hash**: A SHA-256 hash of a Memo's content used for integrity verification and Merkle tree leaf computation.

---

## Phase 1: Core Data Structures, Local Storage & Cryptography

### Requirement 1: Memo Data Structure

**User Story:** As a peer, I want a well-defined Memo data structure, so that every knowledge contribution is consistently structured, hashable, and signable.

#### Acceptance Criteria

1. THE Memo interface SHALL define the fields: id (string), creator (string), timestamp (number), content (string), contentHash (string), signature (string), merkleProof (array of strings), merkleRoot (string), and status (string enum of "pending", "verified", "disputed").
2. WHEN a Memo is created, THE Bitacora_P2P_Client SHALL compute the contentHash as the SHA-256 hash of the content field.
3. WHEN a Memo is created, THE Bitacora_P2P_Client SHALL set the timestamp to the current Unix epoch in milliseconds.
4. THE Memo id SHALL be a UUID v4 string unique across all peers.

### Requirement 2: Edge Data Structure

**User Story:** As a peer, I want a well-defined Edge data structure, so that relationships between Memos in the knowledge graph are explicit and weighted.

#### Acceptance Criteria

1. THE Edge interface SHALL define the fields: id (string), sourceId (string), targetId (string), relation (string enum of "supports", "contradicts", "relates_to"), and weight (number between 0 and 1 inclusive).
2. WHEN an Edge is created, THE Bitacora_P2P_Client SHALL validate that sourceId and targetId reference existing Memo ids in Local_Storage.
3. THE Edge id SHALL be a UUID v4 string unique across all peers.

### Requirement 3: Peer Data Structure

**User Story:** As a peer, I want a well-defined Peer record, so that the network can track connected peers, their public keys, and sync state.

#### Acceptance Criteria

1. THE Peer interface SHALL define the fields: peerId (string), publicKey (string), merkleRoot (string), lastSeen (number as Unix epoch milliseconds), and reputationScore (number between 0 and 1 inclusive).
2. WHEN a new peer connects, THE Bitacora_P2P_Client SHALL create a Peer record with reputationScore initialized to 0.5.
3. WHEN a peer is seen, THE Bitacora_P2P_Client SHALL update the lastSeen field to the current Unix epoch in milliseconds.

### Requirement 4: UserProfile Data Structure

**User Story:** As a user, I want a local identity profile, so that my cryptographic keypair and display name are persisted across sessions.

#### Acceptance Criteria

1. THE UserProfile interface SHALL define the fields: peerId (string), publicKey (string), secretKey (string), displayName (string), and createdAt (number as Unix epoch milliseconds).
2. WHEN the application launches for the first time, THE Crypto_Module SHALL generate an Ed25519 keypair and persist it as a UserProfile in Local_Storage.
3. IF a UserProfile already exists in Local_Storage, THEN THE Bitacora_P2P_Client SHALL load the existing profile without generating a new keypair.

### Requirement 5: Local Storage — IndexedDB (Browser)

**User Story:** As a browser user, I want my data persisted in IndexedDB, so that Memos, Edges, Peers, and my profile survive page reloads.

#### Acceptance Criteria

1. THE Local_Storage SHALL create an IndexedDB database named "bitacora-p2p" with object stores: "memos", "edges", "peers", and "userProfile".
2. THE "memos" object store SHALL use "id" as the keyPath and create indexes on "creator", "timestamp", and "contentHash".
3. THE "edges" object store SHALL use "id" as the keyPath and create indexes on "sourceId" and "targetId".
4. THE "peers" object store SHALL use "peerId" as the keyPath and create an index on "lastSeen".
5. WHEN a Memo is stored, THE Local_Storage SHALL persist all Memo fields atomically within a single IndexedDB transaction.
6. WHEN a Memo is retrieved by id, THE Local_Storage SHALL return the complete Memo object or null if not found.

### Requirement 6: Local Storage — SQLite (React Native)

**User Story:** As a React Native user, I want my data persisted in SQLite, so that Memos, Edges, Peers, and my profile survive app restarts.

#### Acceptance Criteria

1. THE Local_Storage SHALL create a SQLite database named "bitacora-p2p.db" with tables: "memos", "edges", "peers", and "userProfile".
2. THE "memos" table SHALL define columns matching the Memo interface fields with appropriate SQL types and indexes on "creator", "timestamp", and "contentHash".
3. THE "edges" table SHALL define columns matching the Edge interface fields with appropriate SQL types and indexes on "sourceId" and "targetId".
4. THE "peers" table SHALL define columns matching the Peer interface fields with appropriate SQL types and an index on "lastSeen".
5. WHEN a Memo is stored, THE Local_Storage SHALL persist all Memo fields atomically within a single SQLite transaction.
6. WHEN a Memo is retrieved by id, THE Local_Storage SHALL return the complete Memo object or null if not found.

### Requirement 7: Platform-Agnostic Storage Abstraction

**User Story:** As a developer, I want a unified storage interface, so that the rest of the application does not depend on whether IndexedDB or SQLite is used.

#### Acceptance Criteria

1. THE Local_Storage SHALL expose a platform-agnostic interface with methods: putMemo, getMemo, getAllMemos, putEdge, getEdge, getEdgesByMemo, putPeer, getPeer, getAllPeers, getProfile, and putProfile.
2. WHEN the application initializes, THE Local_Storage SHALL detect the runtime platform and instantiate the appropriate backend (IndexedDB for browser, SQLite for React Native).
3. FOR ALL storage operations, calling putMemo then getMemo with the same id SHALL return an equivalent Memo object (round-trip property).
4. FOR ALL storage operations, calling putEdge then getEdge with the same id SHALL return an equivalent Edge object (round-trip property).

### Requirement 8: Ed25519 Keypair Generation

**User Story:** As a user, I want a cryptographic identity generated on first launch, so that my contributions are attributable and verifiable.

#### Acceptance Criteria

1. THE Crypto_Module SHALL generate Ed25519 keypairs using TweetNaCl.js sign.keyPair().
2. WHEN a keypair is generated, THE Crypto_Module SHALL derive the peerId as the hex-encoded first 16 bytes of the public key.
3. THE Crypto_Module SHALL store the generated keypair in the UserProfile via Local_Storage.
4. THE generated public key SHALL be 32 bytes and the secret key SHALL be 64 bytes.

### Requirement 9: Memo Signing

**User Story:** As a peer, I want every Memo I create to be cryptographically signed, so that other peers can verify its authenticity.

#### Acceptance Criteria

1. WHEN a Memo is created, THE Crypto_Module SHALL produce a detached Ed25519 signature over the concatenation of the Memo's id, creator, timestamp, and contentHash fields.
2. THE Crypto_Module SHALL encode the signature as a hex string and store it in the Memo's signature field.
3. THE Crypto_Module SHALL use TweetNaCl.js sign.detached() for signature generation.

### Requirement 10: Signature Verification

**User Story:** As a peer, I want to verify the signature of any received Memo, so that I can trust its authenticity before storing it.

#### Acceptance Criteria

1. WHEN a Memo is received from another peer, THE Crypto_Module SHALL verify the detached signature using the sender's public key from the Peer record.
2. IF signature verification fails, THEN THE Bitacora_P2P_Client SHALL reject the Memo and not store it in Local_Storage.
3. IF the sender's public key is not found in the Peer records, THEN THE Bitacora_P2P_Client SHALL reject the Memo.
4. FOR ALL Memos signed by the Crypto_Module, verifying the signature with the corresponding public key SHALL return true (round-trip property).

### Requirement 11: Merkle Tree Construction

**User Story:** As a developer, I want a Merkle tree built from local Memos, so that sync can efficiently compare datasets between peers.

#### Acceptance Criteria

1. THE Merkle_Tree SHALL be constructed from the sorted list of contentHash values of all local Memos.
2. THE Merkle_Tree SHALL use SHA-256 as the hash function for internal nodes.
3. WHEN a Memo is added or removed, THE Merkle_Tree SHALL recompute the affected path from leaf to root.
4. THE Merkle_Tree root SHALL be a single 64-character hex string.
5. FOR ALL sets of Memos, constructing the Merkle_Tree from the same set in any insertion order SHALL produce the same root hash (confluence property).


---

## Phase 2: P2P Networking & Sync Protocol

### Requirement 12: Signal Server

**User Story:** As a peer, I want an optional stateless signal server, so that I can exchange WebRTC offers and answers to establish direct connections.

#### Acceptance Criteria

1. THE Signal_Server SHALL be a Node.js Express application of approximately 100 lines exposing POST endpoints: /offer, /answer, and /icecandidate.
2. THE Signal_Server SHALL maintain an in-memory peer map keyed by peerId for the duration of the server process only.
3. THE Signal_Server SHALL NOT persist any data to disk or database.
4. WHEN a POST /offer request is received with a valid peerId and SDP offer, THE Signal_Server SHALL store the offer in the in-memory map and return HTTP 200.
5. WHEN a POST /answer request is received with a valid peerId and SDP answer, THE Signal_Server SHALL store the answer in the in-memory map and return HTTP 200.
6. WHEN a POST /icecandidate request is received with a valid peerId and ICE candidate, THE Signal_Server SHALL relay the candidate to the target peer's entry and return HTTP 200.
7. IF a request is missing required fields, THEN THE Signal_Server SHALL return HTTP 400 with a descriptive error message.

### Requirement 13: WebRTC Peer Connection

**User Story:** As a peer, I want to establish direct WebRTC connections with other peers, so that data can flow without a central server.

#### Acceptance Criteria

1. THE Bitacora_P2P_Client SHALL create RTCPeerConnection instances using standard WebRTC APIs.
2. WHEN a connection is initiated, THE Bitacora_P2P_Client SHALL create an SDP offer, set it as the local description, and send it to the target peer via the Signal_Server or alternative discovery mechanism.
3. WHEN an SDP offer is received, THE Bitacora_P2P_Client SHALL create an SDP answer, set it as the local description, and send it back to the offering peer.
4. WHEN ICE candidates are generated, THE Bitacora_P2P_Client SHALL relay each candidate to the remote peer.
5. WHEN the RTCPeerConnection state transitions to "connected", THE Bitacora_P2P_Client SHALL update the corresponding Peer record's lastSeen field.

### Requirement 14: Data Channel Setup

**User Story:** As a peer, I want a reliable data channel over WebRTC, so that Memos and sync messages can be exchanged directly.

#### Acceptance Criteria

1. WHEN a WebRTC connection is established, THE Bitacora_P2P_Client SHALL create a data channel named "bitacora-sync" with ordered delivery enabled.
2. THE data channel SHALL use JSON-encoded messages with a "type" field indicating the message kind (e.g., "sync-request", "sync-response", "memo", "edge").
3. WHEN the data channel opens, THE Bitacora_P2P_Client SHALL trigger the Sync_Protocol with the connected peer.
4. IF the data channel closes unexpectedly, THEN THE Bitacora_P2P_Client SHALL update the Peer record's lastSeen and attempt reconnection after a 5-second delay.

### Requirement 15: Peer Discovery — DHT

**User Story:** As a peer, I want to discover other peers via a Distributed Hash Table, so that I can find peers without relying on the Signal_Server.

#### Acceptance Criteria

1. THE Bitacora_P2P_Client SHALL support peer discovery via a WebTorrent-compatible DHT bootstrap mechanism.
2. WHEN the DHT discovers a new peer, THE Bitacora_P2P_Client SHALL initiate a WebRTC connection to that peer.
3. THE Bitacora_P2P_Client SHALL announce its own presence on the DHT using a topic derived from a shared application identifier.

### Requirement 16: Peer Discovery — QR Code (Offline)

**User Story:** As a peer, I want to exchange connection information via QR code, so that I can connect to nearby peers without any network infrastructure.

#### Acceptance Criteria

1. THE Bitacora_P2P_Client SHALL generate a QR code encoding the peer's peerId, publicKey, and a WebRTC SDP offer.
2. WHEN a peer scans another peer's QR code, THE Bitacora_P2P_Client SHALL extract the connection information and initiate a WebRTC connection using the embedded SDP offer.
3. THE QR code payload SHALL be compact enough to fit in a standard QR code (under 4,296 alphanumeric characters).

### Requirement 17: Peer Discovery — mDNS (Same WiFi)

**User Story:** As a peer, I want automatic discovery of peers on the same local network, so that nearby peers connect seamlessly.

#### Acceptance Criteria

1. THE Bitacora_P2P_Client SHALL advertise its presence on the local network using mDNS with a service type of "_bitacora._tcp".
2. WHEN an mDNS peer is discovered, THE Bitacora_P2P_Client SHALL initiate a WebRTC connection to that peer.
3. THE mDNS advertisement SHALL include the peer's peerId and publicKey in the TXT record.

### Requirement 18: Merkle Root Exchange

**User Story:** As a peer, I want to exchange Merkle roots with connected peers, so that I can determine in O(1) whether our datasets differ.

#### Acceptance Criteria

1. WHEN the Sync_Protocol is triggered, THE Bitacora_P2P_Client SHALL send a "sync-request" message containing the local Merkle_Tree root to the connected peer.
2. WHEN a "sync-request" is received, THE Bitacora_P2P_Client SHALL compare the received root with the local Merkle_Tree root.
3. IF the roots are identical, THEN THE Sync_Protocol SHALL conclude with no data transfer.
4. IF the roots differ, THEN THE Sync_Protocol SHALL proceed to the Merkle tree diff phase.

### Requirement 19: Merkle Tree Differential Sync

**User Story:** As a peer, I want to sync only the Memos I'm missing, so that bandwidth and time are minimized during synchronization.

#### Acceptance Criteria

1. WHEN roots differ, THE Sync_Protocol SHALL traverse the Merkle_Tree level by level, exchanging node hashes to identify divergent subtrees.
2. THE Sync_Protocol SHALL achieve O(log n) comparison complexity where n is the total number of Memos.
3. WHEN divergent leaves are identified, THE Sync_Protocol SHALL request only the missing Memos from the remote peer.
4. WHEN missing Memos are received, THE Bitacora_P2P_Client SHALL verify each Memo's signature before storing it in Local_Storage.
5. WHEN missing Memos are stored, THE Merkle_Tree SHALL be updated to include the new leaves and recompute the root.

### Requirement 20: Conflict Resolution

**User Story:** As a peer, I want deterministic conflict resolution, so that concurrent edits to the same Memo converge to the same result across all peers.

#### Acceptance Criteria

1. WHEN two Memos with the same id but different contentHash values are detected during sync, THE Sync_Protocol SHALL resolve the conflict by retaining the Memo with the earlier timestamp.
2. IF timestamps are identical, THEN THE Sync_Protocol SHALL resolve the conflict by retaining the Memo whose contentHash is lexicographically smaller.
3. THE conflict resolution strategy SHALL be deterministic: given the same two conflicting Memos, all peers SHALL arrive at the same resolution regardless of the order they receive the Memos (confluence property).

### Requirement 21: Optional Peer-to-Peer Encryption

**User Story:** As a peer, I want the option to encrypt data channel messages, so that sensitive knowledge graph data is protected in transit.

#### Acceptance Criteria

1. WHERE peer-to-peer encryption is enabled, THE Crypto_Module SHALL derive a shared secret using Curve25519 key exchange (TweetNaCl.js box.before) from the local secret key and the remote peer's public key.
2. WHERE peer-to-peer encryption is enabled, THE Bitacora_P2P_Client SHALL encrypt all data channel messages using the shared secret with TweetNaCl.js secretbox.
3. WHERE peer-to-peer encryption is enabled, THE Bitacora_P2P_Client SHALL decrypt received data channel messages using the shared secret.
4. FOR ALL messages, encrypting then decrypting with the same shared secret SHALL produce the original message (round-trip property).


---

## Phase 3: React Native UI & AI Agent

### Requirement 22: Memo Creation UI

**User Story:** As a user, I want to create Memos through the mobile app, so that I can contribute knowledge to the graph.

#### Acceptance Criteria

1. THE Mobile_App SHALL provide a Memo creation screen with a text input for content and a submit button.
2. WHEN the user submits a Memo, THE Mobile_App SHALL invoke the Crypto_Module to sign the Memo and the Local_Storage to persist it.
3. WHEN a Memo is successfully created, THE Mobile_App SHALL display the new Memo in the Memo list within 500 milliseconds.
4. IF the content field is empty, THEN THE Mobile_App SHALL disable the submit button and display a validation message.

### Requirement 23: Memo Display and List

**User Story:** As a user, I want to browse all Memos in a scrollable list, so that I can review the knowledge graph content.

#### Acceptance Criteria

1. THE Mobile_App SHALL display Memos in a scrollable list sorted by timestamp in descending order (newest first).
2. EACH Memo in the list SHALL display: content (truncated to 2 lines), creator peerId (truncated), timestamp formatted as relative time, and status badge.
3. WHEN a Memo is tapped, THE Mobile_App SHALL navigate to a detail view showing all Memo fields including signature and Merkle proof metadata.
4. THE Memo list SHALL support pull-to-refresh to reload Memos from Local_Storage.

### Requirement 24: Peer Status Visualization

**User Story:** As a user, I want to see the status of connected peers, so that I know who is online and synced.

#### Acceptance Criteria

1. THE Mobile_App SHALL display a Peer status panel showing all known peers with their peerId (truncated), connection status (online/offline), lastSeen as relative time, and reputationScore as a visual indicator.
2. WHILE a peer's WebRTC connection state is "connected", THE Mobile_App SHALL display that peer with a green online indicator.
3. WHILE a peer's WebRTC connection state is "disconnected" or "failed", THE Mobile_App SHALL display that peer with a gray offline indicator.
4. WHEN a peer's status changes, THE Mobile_App SHALL update the visual indicator within 1 second.

### Requirement 25: Real-Time Sync Status Indicators

**User Story:** As a user, I want to see sync progress in real time, so that I know when data exchange is happening.

#### Acceptance Criteria

1. WHILE the Sync_Protocol is actively exchanging data with a peer, THE Mobile_App SHALL display a sync-in-progress indicator with the peer's peerId.
2. WHEN the Sync_Protocol completes successfully, THE Mobile_App SHALL display a brief "Synced" confirmation for 3 seconds.
3. IF the Sync_Protocol fails, THEN THE Mobile_App SHALL display an error indicator with a retry option.
4. THE Mobile_App SHALL display the total number of Memos synced in the current session.

### Requirement 26: Dark Theme

**User Story:** As a user, I want a dark-themed interface, so that the app is comfortable to use in low-light environments.

#### Acceptance Criteria

1. THE Mobile_App SHALL use a dark color scheme with primary background color #0A1628.
2. THE Mobile_App SHALL use contrasting text colors that meet WCAG AA contrast ratio (minimum 4.5:1 for normal text).
3. THE Mobile_App SHALL apply the dark theme consistently across all screens including Memo list, Memo detail, Peer status, and settings.

### Requirement 27: Knowledge Graph Visualization

**User Story:** As a user, I want to see the knowledge graph visually, so that I can understand relationships between Memos.

#### Acceptance Criteria

1. THE Mobile_App SHALL render the Knowledge_Graph as an interactive node-link diagram where Memos are nodes and Edges are links.
2. EACH node SHALL display a truncated Memo content label and be color-coded by status (pending: yellow, verified: green, disputed: red).
3. EACH link SHALL be styled by relation type (supports: green, contradicts: red, relates_to: gray) with thickness proportional to weight.
4. WHEN a node is tapped, THE Mobile_App SHALL navigate to the Memo detail view.
5. THE graph visualization SHALL support pinch-to-zoom and pan gestures.

### Requirement 28: AI Agent — Consensus Synthesis

**User Story:** As a user, I want the AI agent to synthesize consensus from the knowledge graph, so that I can understand the collective agreement on a topic.

#### Acceptance Criteria

1. WHEN the user requests a consensus synthesis, THE AI_Agent SHALL query all Memos and Edges related to the specified topic from Local_Storage.
2. THE AI_Agent SHALL send the collected Memos and Edge relationships to the Claude API with a prompt requesting consensus analysis.
3. THE AI_Agent SHALL present the synthesis result as a structured summary with: consensus statement, supporting evidence (Memo references), and confidence level (high/medium/low).
4. IF fewer than 2 Memos exist for the specified topic, THEN THE AI_Agent SHALL inform the user that insufficient data is available for synthesis.

### Requirement 29: AI Agent — Contradiction Detection

**User Story:** As a user, I want the AI agent to detect contradictions in the knowledge graph, so that disputed facts are surfaced.

#### Acceptance Criteria

1. WHEN the user requests contradiction detection, THE AI_Agent SHALL analyze Memos connected by "contradicts" Edges and Memos with semantically opposing content.
2. THE AI_Agent SHALL send the relevant Memos to the Claude API with a prompt requesting contradiction analysis.
3. THE AI_Agent SHALL present detected contradictions as pairs of conflicting Memos with an explanation of the contradiction.
4. WHEN a contradiction is confirmed by the user, THE AI_Agent SHALL update the status of the involved Memos to "disputed".

### Requirement 30: AI Agent — Graph Reasoning

**User Story:** As a user, I want the AI agent to reason over the knowledge graph structure, so that I can discover implicit relationships and insights.

#### Acceptance Criteria

1. WHEN the user requests graph reasoning, THE AI_Agent SHALL traverse the Knowledge_Graph using Edge relationships to identify clusters, paths, and central nodes.
2. THE AI_Agent SHALL send the graph structure summary to the Claude API with a prompt requesting structural analysis.
3. THE AI_Agent SHALL present insights including: most connected Memos, strongest support chains, isolated clusters, and suggested new Edges.
4. THE AI_Agent SHALL reference specific Memo ids in the analysis so the user can navigate to them.

### Requirement 31: Bundle Size Target

**User Story:** As a developer, I want the total bundle size to remain under 600KB, so that the app loads quickly and remains lightweight.

#### Acceptance Criteria

1. THE total JavaScript bundle size of the P2P module (excluding React Native core) SHALL remain under 600KB gzipped.
2. THE bundle SHALL include: TweetNaCl.js (approximately 100KB), SQLite adapter (approximately 150KB), and custom Merkle tree implementation (approximately 20KB).
3. WHEN a new dependency is added, THE build process SHALL report the updated bundle size.

### Requirement 32: Error Handling and Resilience

**User Story:** As a user, I want the app to handle errors gracefully, so that network failures and data issues do not crash the application.

#### Acceptance Criteria

1. IF a WebRTC connection fails, THEN THE Bitacora_P2P_Client SHALL log the error, update the Peer record, and attempt reconnection with exponential backoff (initial delay 1 second, maximum delay 30 seconds).
2. IF Local_Storage operations fail, THEN THE Bitacora_P2P_Client SHALL surface a user-visible error message and retry the operation once.
3. IF the Claude API call fails, THEN THE AI_Agent SHALL display an error message and offer the user the option to retry.
4. IF a received Memo fails signature verification, THEN THE Bitacora_P2P_Client SHALL silently discard the Memo and log a warning.
5. THE Mobile_App SHALL remain functional in offline mode with full access to locally stored Memos, Edges, and the Knowledge_Graph.
