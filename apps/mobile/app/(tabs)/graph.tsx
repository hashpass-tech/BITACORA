import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  PanResponder,
  GestureResponderEvent,
  PanResponderGestureState,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { createStorage, type Memo, type Edge } from '@bitacora/shared';
import Svg, { Circle, Line, Text as SvgText } from 'react-native-svg';

const DARK_BG = '#0A1628';
const TEXT_PRIMARY = '#E5E7EB';
const TEXT_SECONDARY = '#9CA3AF';
const ACCENT = '#3B82F6';

// Node status colors
const STATUS_COLORS = {
  pending: '#EAB308',    // yellow
  verified: '#10B981',   // green
  disputed: '#EF4444',   // red
};

// Edge relation colors and styles
const EDGE_STYLES = {
  supports: { color: '#10B981', width: 2 },      // green
  contradicts: { color: '#EF4444', width: 2 },   // red
  relates_to: { color: '#9CA3AF', width: 1 },    // gray
};

interface GraphNode {
  id: string;
  x: number;
  y: number;
  memo: Memo;
}

interface GraphEdgeData {
  source: GraphNode;
  target: GraphNode;
  edge: Edge;
}

export default function GraphScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [memos, setMemos] = useState<Memo[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [graphEdges, setGraphEdges] = useState<GraphEdgeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (evt: GestureResponderEvent, gestureState: PanResponderGestureState) => {
        setOffsetX((prev) => prev + gestureState.dx);
        setOffsetY((prev) => prev + gestureState.dy);
      },
    })
  ).current;

  // Load memos and edges from storage
  useEffect(() => {
    const loadData = async () => {
      try {
        const storage = createStorage();
        await storage.initialize();

        const allMemos = await storage.getAllMemos();
        
        // Collect all edges by iterating through memos
        const edgeSet = new Set<string>();
        const allEdgesArray: Edge[] = [];
        
        for (const memo of allMemos) {
          const memoEdges = await storage.getEdgesByMemo(memo.id);
          for (const edge of memoEdges) {
            if (!edgeSet.has(edge.id)) {
              edgeSet.add(edge.id);
              allEdgesArray.push(edge);
            }
          }
        }

        setMemos(allMemos);
        setEdges(allEdgesArray);

        // Generate graph layout
        generateGraphLayout(allMemos, allEdgesArray);
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : 'Failed to load graph data';
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const generateGraphLayout = (memoList: Memo[], edgeList: Edge[]) => {
    if (memoList.length === 0) {
      setNodes([]);
      setGraphEdges([]);
      return;
    }

    const { width, height } = Dimensions.get('window');
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 3;

    // Position nodes in a circle
    const newNodes: GraphNode[] = memoList.map((memo, index) => {
      const angle = (index / memoList.length) * 2 * Math.PI;
      return {
        id: memo.id,
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
        memo,
      };
    });

    setNodes(newNodes);

    // Create edge data with positioned nodes
    const nodeMap = new Map(newNodes.map((n) => [n.id, n]));
    const newGraphEdges: GraphEdgeData[] = edgeList
      .map((edge) => {
        const source = nodeMap.get(edge.sourceId);
        const target = nodeMap.get(edge.targetId);
        if (source && target) {
          return { source, target, edge };
        }
        return null;
      })
      .filter((e): e is GraphEdgeData => e !== null);

    setGraphEdges(newGraphEdges);
  };

  const handleNodePress = (nodeId: string) => {
    setSelectedNodeId(nodeId);
    router.push(`/memo/${nodeId}`);
  };

  const handlePinch = (scale: number) => {
    setScale(Math.max(0.5, Math.min(3, scale)));
  };

  if (loading) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={ACCENT} />
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Knowledge Graph</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </View>
    );
  }

  if (nodes.length === 0) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Knowledge Graph</Text>
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            No memos yet. Create some memos to visualize the knowledge graph.
          </Text>
        </View>
      </View>
    );
  }

  const { width, height } = Dimensions.get('window');

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Knowledge Graph</Text>
        <Text style={styles.headerSubtitle}>
          {nodes.length} memos, {graphEdges.length} relations
        </Text>
      </View>

      <View
        style={styles.graphContainer}
        {...panResponder.panHandlers}
      >
        <Svg
          width={width}
          height={height - 100}
          style={styles.svg}
        >
          {/* Render edges first (so they appear behind nodes) */}
          {graphEdges.map((graphEdge, idx) => {
            const style = EDGE_STYLES[graphEdge.edge.relation];
            const thickness = 1 + graphEdge.edge.weight * 2;

            return (
              <Line
                key={`edge-${idx}`}
                x1={graphEdge.source.x * scale + offsetX}
                y1={graphEdge.source.y * scale + offsetY}
                x2={graphEdge.target.x * scale + offsetX}
                y2={graphEdge.target.y * scale + offsetY}
                stroke={style.color}
                strokeWidth={thickness}
                opacity={0.6}
              />
            );
          })}

          {/* Render nodes */}
          {nodes.map((node) => {
            const nodeColor = STATUS_COLORS[node.memo.status];
            const isSelected = selectedNodeId === node.id;

            return (
              <g key={`node-${node.id}`}>
                <Circle
                  cx={node.x * scale + offsetX}
                  cy={node.y * scale + offsetY}
                  r={isSelected ? 20 : 16}
                  fill={nodeColor}
                  opacity={0.8}
                  onPress={() => handleNodePress(node.id)}
                />
                <SvgText
                  x={node.x * scale + offsetX}
                  y={node.y * scale + offsetY + 4}
                  textAnchor="middle"
                  fontSize="10"
                  fill={TEXT_PRIMARY}
                  onPress={() => handleNodePress(node.id)}
                >
                  {node.memo.content.substring(0, 8)}...
                </SvgText>
              </g>
            );
          })}
        </Svg>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendRow}>
          <View style={[styles.legendDot, { backgroundColor: STATUS_COLORS.pending }]} />
          <Text style={styles.legendText}>Pending</Text>
        </View>
        <View style={styles.legendRow}>
          <View style={[styles.legendDot, { backgroundColor: STATUS_COLORS.verified }]} />
          <Text style={styles.legendText}>Verified</Text>
        </View>
        <View style={styles.legendRow}>
          <View style={[styles.legendDot, { backgroundColor: STATUS_COLORS.disputed }]} />
          <Text style={styles.legendText}>Disputed</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: DARK_BG,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(229, 231, 235, 0.1)',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  headerSubtitle: {
    fontSize: 12,
    color: TEXT_SECONDARY,
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyStateText: {
    fontSize: 16,
    color: TEXT_SECONDARY,
    textAlign: 'center',
  },
  graphContainer: {
    flex: 1,
    backgroundColor: 'rgba(229, 231, 235, 0.02)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(229, 231, 235, 0.1)',
  },
  svg: {
    backgroundColor: 'transparent',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(229, 231, 235, 0.1)',
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 12,
    color: TEXT_SECONDARY,
  },
});
