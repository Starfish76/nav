import { describe, expect, it } from 'vitest';
import { navigationEdges } from '../data/edges';
import { navigationNodes } from '../data/nodes';
import type { NavigationEdge, NavigationNode } from '../types/navigation';
import { calculateEdgeCost, findShortestPath } from './dijkstra';

describe('findShortestPath', () => {
  it('같은 층의 최단 경로를 계산한다', () => {
    const route = findShortestPath(navigationNodes, navigationEdges, 'health-1', 'administration-1', 'wheelchair');
    expect(route?.nodeIds).toContain('hall-1-5');
    expect(route?.nodeIds.at(-1)).toBe('administration-1');
  });

  it('층간 이동에 엘리베이터를 이용한다', () => {
    const route = findShortestPath(navigationNodes, navigationEdges, 'main-entrance-1', 'class-2-1', 'wheelchair');
    expect(route?.edgeIds).toContain('elevator-1-2');
    expect(route?.nodeIds).toContain('elevator-2');
  });

  it('일반 모드에서는 계단 경로를 사용할 수 있다', () => {
    const route = findShortestPath(navigationNodes, navigationEdges, 'stairs-1', 'stairs-3', 'normal');
    expect(route?.edgeIds).toEqual(['stairs-1-2', 'stairs-2-3']);
  });

  it('휠체어 모드에서는 계단을 제외하고 엘리베이터로 우회한다', () => {
    const route = findShortestPath(navigationNodes, navigationEdges, 'main-entrance-1', 'moving-class-3', 'wheelchair');
    expect(route).not.toBeNull();
    expect(route?.edgeIds).not.toContain('stairs-1-2');
    expect(route?.edgeIds).not.toContain('stairs-2-3');
    expect(route?.edgeIds).toContain('elevator-1-2');
    expect(route?.edgeIds).toContain('elevator-2-3');
  });

  it('휠체어 모드에서 접근 불가능한 간선을 제외한다', () => {
    const route = findShortestPath(navigationNodes, navigationEdges, 'stairs-1', 'stairs-2', 'wheelchair');
    expect(route?.edgeIds).not.toContain('stairs-1-2');
    expect(route?.edgeIds).toContain('elevator-1-2');
  });

  it('경로가 없으면 null을 반환한다', () => {
    const nodes: NavigationNode[] = [
      { id: 'a', name: 'A', floor: 1, x: 0, y: 0, type: 'room' },
      { id: 'b', name: 'B', floor: 1, x: 10, y: 0, type: 'room' },
    ];
    expect(findShortestPath(nodes, [], 'a', 'b', 'normal')).toBeNull();
  });

  it('추가 비용을 포함해 총 비용을 정확히 계산한다', () => {
    const edge: NavigationEdge = { id: 'x', from: 'a', to: 'b', distance: 10, accessible: true, type: 'ramp', slope: 4, width: 1.0, hasObstacle: true, instruction: '' };
    expect(calculateEdgeCost(edge, 'wheelchair')).toBe(63);
    expect(calculateEdgeCost(edge, 'normal')).toBe(48);
  });

  it('출발지와 목적지가 같으면 비용 0의 빈 경로를 반환한다', () => {
    expect(findShortestPath(navigationNodes, navigationEdges, 'hall-1-4', 'hall-1-4', 'wheelchair')).toEqual({ nodeIds: ['hall-1-4'], edgeIds: [], totalCost: 0 });
  });

  it('잘못된 노드 ID는 null을 반환한다', () => {
    expect(findShortestPath(navigationNodes, navigationEdges, 'unknown', 'hall-1-4', 'normal')).toBeNull();
  });
});
