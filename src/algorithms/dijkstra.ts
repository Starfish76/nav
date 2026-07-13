import type { NavigationEdge, NavigationNode, RouteResult, TravelMode } from '../types/navigation';

export const MIN_WHEELCHAIR_WIDTH = 0.9;
export const MAX_RECOMMENDED_SLOPE = 8;
export const ELEVATOR_PENALTY = 5;
export const OBSTACLE_PENALTY = 30;
export const NARROW_PATH_PENALTY = 15;
export const COMFORTABLE_WIDTH = 1.2;

export function isEdgeAllowed(edge: NavigationEdge, mode: TravelMode): boolean {
  if (mode === 'normal') return true;
  return edge.accessible
    && edge.type !== 'stairs'
    && !edge.hasObstacle
    && (edge.width === undefined || edge.width >= MIN_WHEELCHAIR_WIDTH)
    && (edge.slope === undefined || edge.slope <= MAX_RECOMMENDED_SLOPE);
}

export function calculateEdgeCost(edge: NavigationEdge, mode: TravelMode): number {
  let cost = edge.distance;
  if (edge.type === 'elevator') cost += ELEVATOR_PENALTY;
  if (edge.type === 'ramp' && edge.slope) cost += edge.slope * 2;
  if (edge.hasObstacle) cost += OBSTACLE_PENALTY;
  if (mode === 'wheelchair' && edge.width && edge.width < COMFORTABLE_WIDTH) cost += NARROW_PATH_PENALTY;
  return cost;
}

export function findShortestPath(
  nodes: NavigationNode[], edges: NavigationEdge[], startId: string, endId: string, mode: TravelMode,
): RouteResult | null {
  const nodeIds = new Set(nodes.map((node) => node.id));
  if (!nodeIds.has(startId) || !nodeIds.has(endId)) return null;
  if (startId === endId) return { nodeIds: [startId], edgeIds: [], totalCost: 0 };

  const distances = new Map<string, number>(nodes.map((node) => [node.id, Infinity]));
  const previous = new Map<string, { nodeId: string; edgeId: string }>();
  const unvisited = new Set(nodeIds);
  distances.set(startId, 0);

  while (unvisited.size > 0) {
    let currentId: string | null = null;
    let currentDistance = Infinity;
    for (const id of unvisited) {
      const distance = distances.get(id) ?? Infinity;
      if (distance < currentDistance) { currentId = id; currentDistance = distance; }
    }
    if (currentId === null || currentDistance === Infinity) break;
    if (currentId === endId) break;
    unvisited.delete(currentId);

    for (const edge of edges) {
      if (!isEdgeAllowed(edge, mode)) continue;
      const isForward = edge.from === currentId;
      const isReverse = edge.to === currentId && edge.bidirectional !== false;
      if (!isForward && !isReverse) continue;
      const neighborId = isForward ? edge.to : edge.from;
      if (!unvisited.has(neighborId) || !nodeIds.has(neighborId)) continue;
      const candidate = currentDistance + calculateEdgeCost(edge, mode);
      if (candidate < (distances.get(neighborId) ?? Infinity)) {
        distances.set(neighborId, candidate);
        previous.set(neighborId, { nodeId: currentId, edgeId: edge.id });
      }
    }
  }

  if (!previous.has(endId)) return null;
  const pathNodes = [endId];
  const pathEdges: string[] = [];
  let cursor = endId;
  while (cursor !== startId) {
    const item = previous.get(cursor);
    if (!item) return null;
    pathEdges.unshift(item.edgeId);
    pathNodes.unshift(item.nodeId);
    cursor = item.nodeId;
  }
  return { nodeIds: pathNodes, edgeIds: pathEdges, totalCost: distances.get(endId) ?? 0 };
}
