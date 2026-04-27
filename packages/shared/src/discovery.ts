/**
 * Peer Discovery Module for Bitácora P2P
 * Implements DHT and mDNS discovery interfaces
 * Both mechanisms trigger connectToPeer() on the P2P client when a new peer is found
 * 
 * Requirements: 15.1, 15.2, 15.3, 17.1, 17.2, 17.3
 */

import type { P2PClient } from './p2p-client';

/**
 * DHT Discovery interface
 * Uses WebTorrent-compatible topic announcement for peer discovery
 */
export interface DHTDiscovery {
  /**
   * Start DHT discovery with the given topic
   * Announces the local peer on the DHT and listens for other peers
   * @param topic - Shared application identifier for DHT topic
   * @param peerId - Local peer ID to announce
   * @param publicKey - Local peer's public key
   */
  start(topic: string, peerId: string, publicKey: string): Promise<void>;

  /**
   * Stop DHT discovery
   */
  stop(): Promise<void>;

  /**
   * Check if DHT discovery is active
   */
  isActive(): boolean;
}

/**
 * mDNS Discovery interface
 * Uses multicast DNS for local network peer discovery
 */
export interface MDNSDiscovery {
  /**
   * Start mDNS discovery and advertisement
   * Advertises the local peer on the local network with _bitacora._tcp service type
   * Listens for other peers advertising the same service
   * @param peerId - Local peer ID to advertise
   * @param publicKey - Local peer's public key
   * @param port - Optional port number for the service (default: 0 for ephemeral)
   */
  start(peerId: string, publicKey: string, port?: number): Promise<void>;

  /**
   * Stop mDNS discovery and advertisement
   */
  stop(): Promise<void>;

  /**
   * Check if mDNS discovery is active
   */
  isActive(): boolean;
}

/**
 * Peer discovery manager
 * Coordinates DHT and mDNS discovery mechanisms
 */
export interface PeerDiscoveryManager {
  /**
   * Initialize the discovery manager with a P2P client
   * @param p2pClient - The P2P client to use for connecting to discovered peers
   */
  initialize(p2pClient: P2PClient): Promise<void>;

  /**
   * Start all discovery mechanisms
   * @param peerId - Local peer ID
   * @param publicKey - Local peer's public key
   * @param dhtTopic - Topic for DHT discovery
   * @param mdnsPort - Optional port for mDNS service
   */
  startDiscovery(
    peerId: string,
    publicKey: string,
    dhtTopic: string,
    mdnsPort?: number
  ): Promise<void>;

  /**
   * Stop all discovery mechanisms
   */
  stopDiscovery(): Promise<void>;

  /**
   * Check if any discovery mechanism is active
   */
  isDiscoveryActive(): boolean;
}

/**
 * Create a DHT discovery instance
 * This is a stub implementation that defines the interface
 * Actual DHT implementation can use webtorrent-dht or similar library
 */
export function createDHTDiscovery(): DHTDiscovery {
  let active = false;

  return {
    async start(topic: string, peerId: string, _publicKey: string): Promise<void> {
      if (active) {
        console.warn('DHT discovery is already active');
        return;
      }

      active = true;

      console.log(`DHT discovery started for topic: ${topic}, peerId: ${peerId}`);

      // Stub implementation:
      // In a real implementation, this would:
      // 1. Initialize a DHT client (e.g., webtorrent-dht)
      // 2. Announce the local peer on the DHT with the given topic
      // 3. Listen for peer announcements on the same topic
      // 4. When a new peer is discovered, call p2pClient.connectToPeer(discoveredPeerId)
      //
      // Example with webtorrent-dht:
      // const dht = new DHT();
      // dht.announce(topic, { peerId, publicKey });
      // dht.on('peer', (peer) => {
      //   if (p2pClient && peer.peerId !== peerId) {
      //     p2pClient.connectToPeer(peer.peerId);
      //   }
      // });
    },

    async stop(): Promise<void> {
      if (!active) {
        console.warn('DHT discovery is not active');
        return;
      }

      active = false;

      console.log('DHT discovery stopped');

      // Stub implementation:
      // In a real implementation, this would:
      // 1. Stop listening for peer announcements
      // 2. Unannounce the local peer from the DHT
      // 3. Close the DHT client connection
    },

    isActive(): boolean {
      return active;
    },
  };
}

/**
 * Create an mDNS discovery instance
 * This is a stub implementation that defines the interface
 * Actual mDNS implementation can use mdns or similar library
 */
export function createMDNSDiscovery(): MDNSDiscovery {
  let active = false;

  return {
    async start(peerId: string, _publicKey: string, port?: number): Promise<void> {
      if (active) {
        console.warn('mDNS discovery is already active');
        return;
      }

      active = true;
      const servicePort = port || 0;

      console.log(
        `mDNS discovery started for peerId: ${peerId}, port: ${servicePort}`
      );

      // Stub implementation:
      // In a real implementation, this would:
      // 1. Initialize an mDNS advertiser
      // 2. Advertise the local peer with service type "_bitacora._tcp"
      // 3. Include peerId and publicKey in the TXT record
      // 4. Listen for other peers advertising the same service
      // 5. When a new peer is discovered, call p2pClient.connectToPeer(discoveredPeerId)
      //
      // Example with mdns library:
      // const advertiser = mdns.createAdvertisement(
      //   mdns.tcp('bitacora'),
      //   servicePort,
      //   {
      //     txtRecord: {
      //       peerId,
      //       publicKey,
      //     },
      //   }
      // );
      // advertiser.start();
      //
      // const browser = mdns.createBrowser(mdns.tcp('bitacora'));
      // browser.on('serviceUp', (service) => {
      //   if (p2pClient && service.txtRecord.peerId !== peerId) {
      //     p2pClient.connectToPeer(service.txtRecord.peerId);
      //   }
      // });
      // browser.start();
    },

    async stop(): Promise<void> {
      if (!active) {
        console.warn('mDNS discovery is not active');
        return;
      }

      active = false;

      console.log('mDNS discovery stopped');

      // Stub implementation:
      // In a real implementation, this would:
      // 1. Stop the mDNS browser
      // 2. Stop the mDNS advertiser
      // 3. Clean up resources
    },

    isActive(): boolean {
      return active;
    },
  };
}

/**
 * Create a peer discovery manager
 * Coordinates DHT and mDNS discovery mechanisms
 */
export function createPeerDiscoveryManager(): PeerDiscoveryManager {
  const dhtDiscovery = createDHTDiscovery();
  const mdnsDiscovery = createMDNSDiscovery();
  let p2pClient: P2PClient | null = null;

  return {
    async initialize(p2pClientInstance: P2PClient): Promise<void> {
      p2pClient = p2pClientInstance;
      console.log('Peer discovery manager initialized');
    },

    async startDiscovery(
      peerId: string,
      publicKey: string,
      dhtTopic: string,
      mdnsPort?: number
    ): Promise<void> {
      if (!p2pClient) {
        throw new Error('Peer discovery manager not initialized');
      }

      console.log('Starting peer discovery mechanisms');

      // Start DHT discovery
      try {
        await dhtDiscovery.start(dhtTopic, peerId, publicKey);
      } catch (error) {
        console.error('Failed to start DHT discovery:', error);
      }

      // Start mDNS discovery
      try {
        await mdnsDiscovery.start(peerId, publicKey, mdnsPort);
      } catch (error) {
        console.error('Failed to start mDNS discovery:', error);
      }
    },

    async stopDiscovery(): Promise<void> {
      console.log('Stopping peer discovery mechanisms');

      // Stop DHT discovery
      try {
        await dhtDiscovery.stop();
      } catch (error) {
        console.error('Failed to stop DHT discovery:', error);
      }

      // Stop mDNS discovery
      try {
        await mdnsDiscovery.stop();
      } catch (error) {
        console.error('Failed to stop mDNS discovery:', error);
      }
    },

    isDiscoveryActive(): boolean {
      return dhtDiscovery.isActive() || mdnsDiscovery.isActive();
    },
  };
}

// Export singleton instances
export const dhtDiscovery = createDHTDiscovery();
export const mdnsDiscovery = createMDNSDiscovery();
export const peerDiscoveryManager = createPeerDiscoveryManager();
