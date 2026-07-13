import type { DataValidationResult, NavigationEdge, NavigationNode, RouteResult, RouteStep } from '../types/navigation';

export function validateNavigationData(nodes: NavigationNode[], edges: NavigationEdge[]): DataValidationResult {
  const errors: string[] = [];
  const nodeIds = new Set<string>();
  const edgeIds = new Set<string>();
  nodes.forEach((node) => {
    if (!node.id || !node.name || !Number.isFinite(node.x) || !Number.isFinite(node.y) || ![1, 2, 3].includes(node.floor)) errors.push(`잘못된 노드: ${node.id || '(ID 없음)'}`);
    if (nodeIds.has(node.id)) errors.push(`중복 노드 ID: ${node.id}`);
    nodeIds.add(node.id);
  });
  edges.forEach((edge) => {
    if (!edge.id || !nodeIds.has(edge.from) || !nodeIds.has(edge.to) || edge.distance < 0 || !Number.isFinite(edge.distance)) errors.push(`잘못된 간선: ${edge.id || '(ID 없음)'}`);
    if (edgeIds.has(edge.id)) errors.push(`중복 간선 ID: ${edge.id}`);
    edgeIds.add(edge.id);
  });
  return { valid: errors.length === 0, errors };
}

export function buildRouteSteps(route: RouteResult, nodes: NavigationNode[], edges: NavigationEdge[]): RouteStep[] {
  const nodeMap = new Map(nodes.map((node) => [node.id, node]));
  const edgeMap = new Map(edges.map((edge) => [edge.id, edge]));
  const steps: RouteStep[] = [];
  route.edgeIds.forEach((edgeId, index) => {
    const edge = edgeMap.get(edgeId);
    const from = nodeMap.get(route.nodeIds[index]);
    const to = nodeMap.get(route.nodeIds[index + 1]);
    if (edge && from && to) steps.push({ edge, from, to });
  });
  return steps;
}

export function calculateAccessibilityScore(steps: RouteStep[]): number {
  let score = 100;
  steps.forEach(({ edge }) => {
    if (edge.type === 'elevator') score -= 3;
    if (edge.type === 'ramp') score -= Math.ceil(edge.slope ?? 2);
    if (edge.width !== undefined && edge.width < 1.2) score -= 10;
    if (edge.hasObstacle) score -= 20;
    if (edge.type === 'stairs') score -= 35;
  });
  score -= Math.max(0, steps.length - 6);
  return Math.max(0, Math.round(score));
}

export const edgeTypeLabels: Record<NavigationEdge['type'], string> = {
  corridor: '복도', elevator: '엘리베이터', stairs: '계단', ramp: '경사로', door: '출입문',
};
