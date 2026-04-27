/**
 * AI Agent Module for Bitácora P2P
 * Provides consensus synthesis, contradiction detection, and graph reasoning
 * using Claude API for on-device knowledge graph analysis
 */

import { Memo, Edge, EdgeRelation } from './types';

/**
 * Consensus synthesis result from Claude API
 */
export interface ConsensusSynthesis {
  statement: string;
  supportingMemoIds: string[];
  confidenceLevel: 'high' | 'medium' | 'low';
}

/**
 * Contradiction detected in the knowledge graph
 */
export interface Contradiction {
  memoA: string;  // Memo id
  memoB: string;  // Memo id
  explanation: string;
}

/**
 * Graph insights from structural analysis
 */
export interface GraphInsights {
  mostConnected: string[];      // Memo ids with highest degree
  strongestChains: string[][];  // Paths of Memo ids (support chains)
  isolatedClusters: string[][]; // Groups of disconnected Memos
  suggestedEdges: Array<{ sourceId: string; targetId: string; relation: EdgeRelation }>;
}

/**
 * AI Agent interface for knowledge graph reasoning
 */
export interface AIAgent {
  synthesizeConsensus(topic: string, memos: Memo[], edges: Edge[]): Promise<ConsensusSynthesis>;
  detectContradictions(memos: Memo[], edges: Edge[]): Promise<Contradiction[]>;
  analyzeGraph(memos: Memo[], edges: Edge[]): Promise<GraphInsights>;
}

/**
 * Implementation of AIAgent using Claude API
 */
export class ClaudeAIAgent implements AIAgent {
  private apiKey: string;
  private apiBaseUrl: string = 'https://api.anthropic.com/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Synthesize consensus from memos and edges on a given topic
   * Queries memos/edges by topic, sends to Claude API, returns structured synthesis
   */
  async synthesizeConsensus(topic: string, memos: Memo[], edges: Edge[]): Promise<ConsensusSynthesis> {
    // Check for insufficient data
    if (memos.length < 2) {
      return {
        statement: 'Insufficient data',
        supportingMemoIds: [],
        confidenceLevel: 'low',
      };
    }

    // Filter memos related to the topic
    const topicMemos = memos.filter(m => 
      m.content.toLowerCase().includes(topic.toLowerCase())
    );

    if (topicMemos.length < 2) {
      return {
        statement: 'Insufficient data',
        supportingMemoIds: [],
        confidenceLevel: 'low',
      };
    }

    // Build context for Claude
    const memoContext = topicMemos.map(m => ({
      id: m.id,
      content: m.content,
      creator: m.creator,
      timestamp: m.timestamp,
    }));

    const edgeContext = edges
      .filter(e => topicMemos.some(m => m.id === e.sourceId || m.id === e.targetId))
      .map(e => ({
        sourceId: e.sourceId,
        targetId: e.targetId,
        relation: e.relation,
        weight: e.weight,
      }));

    const prompt = `Analyze the following memos and relationships to synthesize consensus on the topic: "${topic}"

Memos:
${JSON.stringify(memoContext, null, 2)}

Relationships:
${JSON.stringify(edgeContext, null, 2)}

Provide a JSON response with:
{
  "statement": "A concise consensus statement",
  "supportingMemoIds": ["id1", "id2"],
  "confidenceLevel": "high" | "medium" | "low"
}`;

    try {
      const response = await this.callClaudeAPI(prompt);
      const parsed = JSON.parse(response);
      return {
        statement: parsed.statement || 'Unable to synthesize consensus',
        supportingMemoIds: parsed.supportingMemoIds || [],
        confidenceLevel: parsed.confidenceLevel || 'low',
      };
    } catch (error) {
      console.error('Error synthesizing consensus:', error);
      throw new Error(`Failed to synthesize consensus: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Detect contradictions in the knowledge graph
   * Analyzes "contradicts" edges and semantic opposition
   */
  async detectContradictions(memos: Memo[], edges: Edge[]): Promise<Contradiction[]> {
    if (memos.length < 2) {
      return [];
    }

    // Find explicit contradictions (contradicts edges)
    const contradictEdges = edges.filter(e => e.relation === 'contradicts');
    
    if (contradictEdges.length === 0) {
      return [];
    }

    // Build context for Claude
    const memoMap = new Map(memos.map(m => [m.id, m]));
    const contradictionPairs = contradictEdges
      .map(e => ({
        memoA: memoMap.get(e.sourceId),
        memoB: memoMap.get(e.targetId),
        edge: e,
      }))
      .filter(p => p.memoA && p.memoB);

    const prompt = `Analyze the following memo pairs that are marked as contradicting and provide explanations:

${contradictionPairs.map(p => `
Memo A (${p.memoA!.id}): "${p.memoA!.content}"
Memo B (${p.memoB!.id}): "${p.memoB!.content}"
Weight: ${p.edge.weight}
`).join('\n')}

For each pair, provide a JSON array response with:
[
  {
    "memoA": "id1",
    "memoB": "id2",
    "explanation": "Why these memos contradict"
  }
]`;

    try {
      const response = await this.callClaudeAPI(prompt);
      const parsed = JSON.parse(response);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error('Error detecting contradictions:', error);
      throw new Error(`Failed to detect contradictions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Analyze graph structure for clusters, paths, and central nodes
   * Returns insights about the knowledge graph topology
   */
  async analyzeGraph(memos: Memo[], edges: Edge[]): Promise<GraphInsights> {
    if (memos.length === 0) {
      return {
        mostConnected: [],
        strongestChains: [],
        isolatedClusters: [],
        suggestedEdges: [],
      };
    }

    // Calculate node degrees
    const nodeDegrees = new Map<string, number>();
    memos.forEach(m => nodeDegrees.set(m.id, 0));
    edges.forEach(e => {
      nodeDegrees.set(e.sourceId, (nodeDegrees.get(e.sourceId) || 0) + 1);
      nodeDegrees.set(e.targetId, (nodeDegrees.get(e.targetId) || 0) + 1);
    });

    // Find most connected nodes
    const mostConnected = Array.from(nodeDegrees.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id]) => id);

    // Find isolated nodes (no edges)
    const isolatedNodes = Array.from(nodeDegrees.entries())
      .filter(([, degree]) => degree === 0)
      .map(([id]) => id);

    // Build context for Claude
    const graphContext = {
      totalMemos: memos.length,
      totalEdges: edges.length,
      mostConnected,
      isolatedCount: isolatedNodes.length,
      edgeRelations: {
        supports: edges.filter(e => e.relation === 'supports').length,
        contradicts: edges.filter(e => e.relation === 'contradicts').length,
        relates_to: edges.filter(e => e.relation === 'relates_to').length,
      },
    };

    const prompt = `Analyze the following knowledge graph structure and provide insights:

Graph Statistics:
${JSON.stringify(graphContext, null, 2)}

Sample Memos (first 10):
${JSON.stringify(memos.slice(0, 10).map(m => ({ id: m.id, content: m.content })), null, 2)}

Sample Edges (first 10):
${JSON.stringify(edges.slice(0, 10).map(e => ({ sourceId: e.sourceId, targetId: e.targetId, relation: e.relation })), null, 2)}

Provide a JSON response with:
{
  "strongestChains": [["id1", "id2", "id3"]],
  "isolatedClusters": [["id4", "id5"]],
  "suggestedEdges": [
    {"sourceId": "id1", "targetId": "id6", "relation": "supports"}
  ]
}`;

    try {
      const response = await this.callClaudeAPI(prompt);
      const parsed = JSON.parse(response);
      return {
        mostConnected,
        strongestChains: parsed.strongestChains || [],
        isolatedClusters: parsed.isolatedClusters || [],
        suggestedEdges: parsed.suggestedEdges || [],
      };
    } catch (error) {
      console.error('Error analyzing graph:', error);
      throw new Error(`Failed to analyze graph: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Call Claude API with the given prompt
   * Handles API errors gracefully
   */
  private async callClaudeAPI(prompt: string): Promise<string> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 1024,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Claude API error: ${response.status} - ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      const content = data.content[0];
      
      if (content.type === 'text') {
        return content.text;
      }

      throw new Error('Unexpected response format from Claude API');
    } catch (error) {
      console.error('Claude API call failed:', error);
      throw error;
    }
  }
}

/**
 * Factory function to create an AI agent instance
 */
export function createAIAgent(apiKey: string): AIAgent {
  return new ClaudeAIAgent(apiKey);
}
