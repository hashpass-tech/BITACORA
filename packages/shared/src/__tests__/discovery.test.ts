/**
 * Unit tests for peer discovery module
 * Tests DHT and mDNS discovery interfaces
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createDHTDiscovery,
  createMDNSDiscovery,
  createPeerDiscoveryManager,
  type DHTDiscovery,
  type MDNSDiscovery,
  type PeerDiscoveryManager,
} from '../discovery';
import type { P2PClient } from '../p2p-client';

describe('DHT Discovery', () => {
  let dhtDiscovery: DHTDiscovery;

  beforeEach(() => {
    dhtDiscovery = createDHTDiscovery();
  });

  it('should start DHT discovery', async () => {
    expect(dhtDiscovery.isActive()).toBe(false);
    await dhtDiscovery.start('test-topic', 'peer-1', 'public-key-1');
    expect(dhtDiscovery.isActive()).toBe(true);
  });

  it('should stop DHT discovery', async () => {
    await dhtDiscovery.start('test-topic', 'peer-1', 'public-key-1');
    expect(dhtDiscovery.isActive()).toBe(true);
    await dhtDiscovery.stop();
    expect(dhtDiscovery.isActive()).toBe(false);
  });

  it('should not start DHT discovery twice', async () => {
    await dhtDiscovery.start('test-topic', 'peer-1', 'public-key-1');
    const consoleSpy = vi.spyOn(console, 'warn');
    await dhtDiscovery.start('test-topic', 'peer-1', 'public-key-1');
    expect(consoleSpy).toHaveBeenCalledWith('DHT discovery is already active');
    consoleSpy.mockRestore();
  });

  it('should not stop DHT discovery if not active', async () => {
    const consoleSpy = vi.spyOn(console, 'warn');
    await dhtDiscovery.stop();
    expect(consoleSpy).toHaveBeenCalledWith('DHT discovery is not active');
    consoleSpy.mockRestore();
  });
});

describe('mDNS Discovery', () => {
  let mdnsDiscovery: MDNSDiscovery;

  beforeEach(() => {
    mdnsDiscovery = createMDNSDiscovery();
  });

  it('should start mDNS discovery', async () => {
    expect(mdnsDiscovery.isActive()).toBe(false);
    await mdnsDiscovery.start('peer-1', 'public-key-1');
    expect(mdnsDiscovery.isActive()).toBe(true);
  });

  it('should start mDNS discovery with port', async () => {
    expect(mdnsDiscovery.isActive()).toBe(false);
    await mdnsDiscovery.start('peer-1', 'public-key-1', 5000);
    expect(mdnsDiscovery.isActive()).toBe(true);
  });

  it('should stop mDNS discovery', async () => {
    await mdnsDiscovery.start('peer-1', 'public-key-1');
    expect(mdnsDiscovery.isActive()).toBe(true);
    await mdnsDiscovery.stop();
    expect(mdnsDiscovery.isActive()).toBe(false);
  });

  it('should not start mDNS discovery twice', async () => {
    await mdnsDiscovery.start('peer-1', 'public-key-1');
    const consoleSpy = vi.spyOn(console, 'warn');
    await mdnsDiscovery.start('peer-1', 'public-key-1');
    expect(consoleSpy).toHaveBeenCalledWith('mDNS discovery is already active');
    consoleSpy.mockRestore();
  });

  it('should not stop mDNS discovery if not active', async () => {
    const consoleSpy = vi.spyOn(console, 'warn');
    await mdnsDiscovery.stop();
    expect(consoleSpy).toHaveBeenCalledWith('mDNS discovery is not active');
    consoleSpy.mockRestore();
  });
});

describe('Peer Discovery Manager', () => {
  let manager: PeerDiscoveryManager;
  let mockP2PClient: P2PClient;

  beforeEach(() => {
    manager = createPeerDiscoveryManager();
    mockP2PClient = {
      initialize: vi.fn(),
      connectToPeer: vi.fn(),
      disconnectFromPeer: vi.fn(),
      broadcastMemo: vi.fn(),
      broadcastEdge: vi.fn(),
      getConnectedPeers: vi.fn(() => []),
      onPeerConnected: vi.fn(),
      onPeerDisconnected: vi.fn(),
      onMemoReceived: vi.fn(),
      onSyncStatusChanged: vi.fn(),
    } as unknown as P2PClient;
  });

  it('should initialize with P2P client', async () => {
    await manager.initialize(mockP2PClient);
    expect(manager).toBeDefined();
  });

  it('should throw error if not initialized before starting discovery', async () => {
    await expect(
      manager.startDiscovery('peer-1', 'public-key-1', 'test-topic')
    ).rejects.toThrow('Peer discovery manager not initialized');
  });

  it('should start discovery mechanisms', async () => {
    await manager.initialize(mockP2PClient);
    await manager.startDiscovery('peer-1', 'public-key-1', 'test-topic');
    expect(manager.isDiscoveryActive()).toBe(true);
  });

  it('should start discovery with mDNS port', async () => {
    await manager.initialize(mockP2PClient);
    await manager.startDiscovery('peer-1', 'public-key-1', 'test-topic', 5000);
    expect(manager.isDiscoveryActive()).toBe(true);
  });

  it('should stop discovery mechanisms', async () => {
    await manager.initialize(mockP2PClient);
    await manager.startDiscovery('peer-1', 'public-key-1', 'test-topic');
    expect(manager.isDiscoveryActive()).toBe(true);
    await manager.stopDiscovery();
    expect(manager.isDiscoveryActive()).toBe(false);
  });

  it('should report discovery inactive when nothing is running', async () => {
    await manager.initialize(mockP2PClient);
    expect(manager.isDiscoveryActive()).toBe(false);
  });
});
