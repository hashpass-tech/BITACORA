/**
 * Unit tests for AI Agent module
 * Tests prompt construction, response parsing, and error handling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ClaudeAIAgent, createAIAgent } from '../ai-agent';
import { Memo, Edge } from '../types';

// Mock fetch globally
global.fetch = vi.fn();

describe('AI Agent', () => {
  let agent: ClaudeAIAgent;
  const mockApiKey = 'test-api-key';

  beforeEach(() => {
    agent = new ClaudeAIAgent(mockApiKey);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('synthesizeConsensus', () => {
    it('should return insufficient data when fewer than 2 memos', async () => {
      const result = await agent.synthesizeConsensus('test', [], []);
      expect(result.statement).toBe('Insufficient data');
      expect(result.supportingMemoIds).toEqual([]);
      expect(result.confidenceLevel).toBe('low');
    });

    it('should return insufficient data when fewer than 2 topic-related memos', async () => {
      const memos: Memo[] = [
        {
          id: '1',
          creator: 'peer1',
          timestamp: Date.now(),
          content: 'unrelated content',
          contentHash: 'hash1',
          signature: 'sig1',
          merkleProof: [],
          merkleRoot: 'root1',
          status: 'verified',
        },
      ];
      const result = await agent.synthesizeConsensus('specific-topic', memos, []);
      expect(result.statement).toBe('Insufficient data');
      expect(result.confidenceLevel).toBe('low');
    });

    it('should call Claude API with proper prompt structure', async () => {
      const memos: Memo[] = [
        {
          id: '1',
          creator: 'peer1',
          timestamp: 1000,
          content: 'Climate change is real',
          contentHash: 'hash1',
          signature: 'sig1',
          merkleProof: [],
          merkleRoot: 'root1',
          status: 'verified',
        },
        {
          id: '2',
          creator: 'peer2',
          timestamp: 2000,
          content: 'Climate change impacts are severe',
          contentHash: 'hash2',
          signature: 'sig2',
          merkleProof: [],
          merkleRoot: 'root2',
          status: 'verified',
        },
      ];
      const edges: Edge[] = [
        {
          id: 'e1',
          sourceId: '1',
          targetId: '2',
          relation: 'supports',
          weight: 0.9,
        },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                statement: 'Climate change is real and severe',
                supportingMemoIds: ['1', '2'],
                confidenceLevel: 'high',
              }),
            },
          ],
        }),
      });

      const result = await agent.synthesizeConsensus('climate', memos, edges);
      expect(result.statement).toBe('Climate change is real and severe');
      expect(result.supportingMemoIds).toEqual(['1', '2']);
      expect(result.confidenceLevel).toBe('high');

      // Verify API was called
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.anthropic.com/v1/messages',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'x-api-key': mockApiKey,
          }),
        })
      );
    });

    it('should handle Claude API errors gracefully', async () => {
      const memos: Memo[] = [
        {
          id: '1',
          creator: 'peer1',
          timestamp: 1000,
          content: 'test memo 1',
          contentHash: 'hash1',
          signature: 'sig1',
          merkleProof: [],
          merkleRoot: 'root1',
          status: 'verified',
        },
        {
          id: '2',
          creator: 'peer2',
          timestamp: 2000,
          content: 'test memo 2',
          contentHash: 'hash2',
          signature: 'sig2',
          merkleProof: [],
          merkleRoot: 'root2',
          status: 'verified',
        },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Unauthorized' }),
      });

      await expect(agent.synthesizeConsensus('test', memos, [])).rejects.toThrow(
        'Failed to synthesize consensus'
      );
    });

    it('should handle malformed JSON response', async () => {
      const memos: Memo[] = [
        {
          id: '1',
          creator: 'peer1',
          timestamp: 1000,
          content: 'test memo 1',
          contentHash: 'hash1',
          signature: 'sig1',
          merkleProof: [],
          merkleRoot: 'root1',
          status: 'verified',
        },
        {
          id: '2',
          creator: 'peer2',
          timestamp: 2000,
          content: 'test memo 2',
          contentHash: 'hash2',
          signature: 'sig2',
          merkleProof: [],
          merkleRoot: 'root2',
          status: 'verified',
        },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          content: [
            {
              type: 'text',
              text: 'invalid json {',
            },
          ],
        }),
      });

      await expect(agent.synthesizeConsensus('test', memos, [])).rejects.toThrow(
        'Failed to synthesize consensus'
      );
    });
  });

  describe('detectContradictions', () => {
    it('should return empty array when fewer than 2 memos', async () => {
      const result = await agent.detectContradictions([], []);
      expect(result).toEqual([]);
    });

    it('should return empty array when no contradicts edges exist', async () => {
      const memos: Memo[] = [
        {
          id: '1',
          creator: 'peer1',
          timestamp: 1000,
          content: 'memo 1',
          contentHash: 'hash1',
          signature: 'sig1',
          merkleProof: [],
          merkleRoot: 'root1',
          status: 'verified',
        },
        {
          id: '2',
          creator: 'peer2',
          timestamp: 2000,
          content: 'memo 2',
          contentHash: 'hash2',
          signature: 'sig2',
          merkleProof: [],
          merkleRoot: 'root2',
          status: 'verified',
        },
      ];
      const edges: Edge[] = [
        {
          id: 'e1',
          sourceId: '1',
          targetId: '2',
          relation: 'supports',
          weight: 0.8,
        },
      ];

      const result = await agent.detectContradictions(memos, edges);
      expect(result).toEqual([]);
    });

    it('should call Claude API for contradicts edges', async () => {
      const memos: Memo[] = [
        {
          id: '1',
          creator: 'peer1',
          timestamp: 1000,
          content: 'The Earth is flat',
          contentHash: 'hash1',
          signature: 'sig1',
          merkleProof: [],
          merkleRoot: 'root1',
          status: 'verified',
        },
        {
          id: '2',
          creator: 'peer2',
          timestamp: 2000,
          content: 'The Earth is round',
          contentHash: 'hash2',
          signature: 'sig2',
          merkleProof: [],
          merkleRoot: 'root2',
          status: 'verified',
        },
      ];
      const edges: Edge[] = [
        {
          id: 'e1',
          sourceId: '1',
          targetId: '2',
          relation: 'contradicts',
          weight: 1.0,
        },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          content: [
            {
              type: 'text',
              text: JSON.stringify([
                {
                  memoA: '1',
                  memoB: '2',
                  explanation: 'Direct contradiction about Earth shape',
                },
              ]),
            },
          ],
        }),
      });

      const result = await agent.detectContradictions(memos, edges);
      expect(result).toHaveLength(1);
      expect(result[0].memoA).toBe('1');
      expect(result[0].memoB).toBe('2');
      expect(result[0].explanation).toBe('Direct contradiction about Earth shape');
    });

    it('should handle Claude API errors in contradiction detection', async () => {
      const memos: Memo[] = [
        {
          id: '1',
          creator: 'peer1',
          timestamp: 1000,
          content: 'memo 1',
          contentHash: 'hash1',
          signature: 'sig1',
          merkleProof: [],
          merkleRoot: 'root1',
          status: 'verified',
        },
        {
          id: '2',
          creator: 'peer2',
          timestamp: 2000,
          content: 'memo 2',
          contentHash: 'hash2',
          signature: 'sig2',
          merkleProof: [],
          merkleRoot: 'root2',
          status: 'verified',
        },
      ];
      const edges: Edge[] = [
        {
          id: 'e1',
          sourceId: '1',
          targetId: '2',
          relation: 'contradicts',
          weight: 1.0,
        },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Internal Server Error' }),
      });

      await expect(agent.detectContradictions(memos, edges)).rejects.toThrow(
        'Failed to detect contradictions'
      );
    });
  });

  describe('analyzeGraph', () => {
    it('should return empty insights when no memos', async () => {
      const result = await agent.analyzeGraph([], []);
      expect(result.mostConnected).toEqual([]);
      expect(result.strongestChains).toEqual([]);
      expect(result.isolatedClusters).toEqual([]);
      expect(result.suggestedEdges).toEqual([]);
    });

    it('should calculate most connected nodes correctly', async () => {
      const memos: Memo[] = Array.from({ length: 5 }, (_, i) => ({
        id: `${i}`,
        creator: 'peer1',
        timestamp: 1000 + i,
        content: `memo ${i}`,
        contentHash: `hash${i}`,
        signature: `sig${i}`,
        merkleProof: [],
        merkleRoot: 'root',
        status: 'verified' as const,
      }));

      const edges: Edge[] = [
        { id: 'e1', sourceId: '0', targetId: '1', relation: 'supports', weight: 0.8 },
        { id: 'e2', sourceId: '0', targetId: '2', relation: 'supports', weight: 0.8 },
        { id: 'e3', sourceId: '0', targetId: '3', relation: 'supports', weight: 0.8 },
        { id: 'e4', sourceId: '1', targetId: '2', relation: 'relates_to', weight: 0.5 },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                strongestChains: [['0', '1', '2']],
                isolatedClusters: [['4']],
                suggestedEdges: [],
              }),
            },
          ],
        }),
      });

      const result = await agent.analyzeGraph(memos, edges);
      expect(result.mostConnected).toContain('0');
      expect(result.mostConnected).toContain('1');
      expect(result.strongestChains).toEqual([['0', '1', '2']]);
      expect(result.isolatedClusters).toEqual([['4']]);
    });

    it('should handle Claude API errors in graph analysis', async () => {
      const memos: Memo[] = [
        {
          id: '1',
          creator: 'peer1',
          timestamp: 1000,
          content: 'memo 1',
          contentHash: 'hash1',
          signature: 'sig1',
          merkleProof: [],
          merkleRoot: 'root1',
          status: 'verified',
        },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({ error: 'Rate limited' }),
      });

      await expect(agent.analyzeGraph(memos, [])).rejects.toThrow(
        'Failed to analyze graph'
      );
    });
  });

  describe('createAIAgent factory', () => {
    it('should create an AI agent instance', () => {
      const agent = createAIAgent('test-key');
      expect(agent).toBeDefined();
      expect(agent.synthesizeConsensus).toBeDefined();
      expect(agent.detectContradictions).toBeDefined();
      expect(agent.analyzeGraph).toBeDefined();
    });
  });
});
