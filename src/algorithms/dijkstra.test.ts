import { describe, expect, it } from 'vitest';
import { navigationEdges } from '../data/edges';
import { navigationNodes } from '../data/nodes';
import type { NavigationEdge, NavigationNode } from '../types/navigation';
import { calculateEdgeCost, findShortestPath } from './dijkstra';

describe('findShortestPath', () => {
  it('보건실에서 서쪽 홀을 거쳐 엘리베이터로 이동한다', () => {
    const route = findShortestPath(navigationNodes, navigationEdges, 'health-1', 'elevator-1', 'wheelchair');
    expect(route?.nodeIds.slice(0, 3)).toEqual(['health-1', 'lobby-1', 'hall-1-1']);
    expect(route?.nodeIds).not.toContain('wee-class-1');
    expect(route?.nodeIds.at(-1)).toBe('elevator-1');
  });

  it('도서관에서 동쪽 홀을 거쳐 되돌아가지 않고 엘리베이터로 이동한다', () => {
    const route = findShortestPath(navigationNodes, navigationEdges, 'library-1', 'elevator-1', 'wheelchair');
    const elevator = navigationNodes.find((node) => node.id === 'elevator-1');
    const elevatorAccess = navigationEdges.find((edge) => edge.id === 'access-elevator-1');
    const elevatorHall = navigationNodes.find((node) => node.id === elevatorAccess?.from);
    const routeX = route?.nodeIds.map((id) => navigationNodes.find((node) => node.id === id)?.x ?? Number.POSITIVE_INFINITY) ?? [];
    expect(route?.nodeIds.slice(0, 2)).toEqual(['library-1', 'east-lobby-1']);
    expect(route?.nodeIds.at(-2)).toBe(elevatorHall?.id);
    expect(elevatorHall?.x).toBe(elevator?.x);
    expect(route?.nodeIds).not.toContain('main-entrance-1');
    routeX.slice(1).forEach((x, index) => expect(x).toBeLessThanOrEqual(routeX[index]));
  });

  it('동쪽에서 1-4로 갈 때 교실 앞을 지나쳤다가 되돌아오지 않는다', () => {
    const route = findShortestPath(navigationNodes, navigationEdges, 'library-1', 'class-1-4', 'wheelchair');
    const routeNodes = route?.nodeIds.map((id) => navigationNodes.find((node) => node.id === id)).filter((node): node is NavigationNode => Boolean(node)) ?? [];
    routeNodes.slice(1).forEach((node, index) => expect(node.x).toBeLessThanOrEqual(routeNodes[index].x));
    expect(routeNodes.at(-2)?.x).toBe(routeNodes.at(-1)?.x);
  });

  it('2층 양쪽 끝 공간은 각각 인접한 홀을 거쳐 복도로 나온다', () => {
    const westRoute = findShortestPath(navigationNodes, navigationEdges, 'art-room-2', 'elevator-2', 'wheelchair');
    const eastRoute = findShortestPath(navigationNodes, navigationEdges, 'staff-lounge-2', 'elevator-2', 'wheelchair');
    const ibRoute = findShortestPath(navigationNodes, navigationEdges, 'ib-seminar-2', 'elevator-2', 'wheelchair');
    expect(westRoute?.nodeIds.slice(0, 3)).toEqual(['art-room-2', 'art-room-access-hall-2', 'lobby-west-2']);
    const artRoom = navigationNodes.find((node) => node.id === 'art-room-2');
    const artRoomHall = navigationNodes.find((node) => node.id === 'art-room-access-hall-2');
    const westLobby = navigationNodes.find((node) => node.id === 'lobby-west-2');
    expect(artRoomHall?.y).toBe(artRoom?.y);
    expect(artRoomHall?.x).toBe(westLobby?.x);
    expect(eastRoute?.nodeIds.slice(0, 2)).toEqual(['staff-lounge-2', 'lobby-east-2']);
    expect(ibRoute?.nodeIds.slice(0, 2)).toEqual(['ib-seminar-2', 'lobby-east-2']);
  });

  it('3층 양쪽 끝 교과실은 홀의 세로 통로를 거쳐 중앙 복도로 나온다', () => {
    const westRoute = findShortestPath(navigationNodes, navigationEdges, 'career-guidance-3', 'elevator-3', 'wheelchair');
    const eastRoute = findShortestPath(navigationNodes, navigationEdges, 'math-room-3', 'elevator-3', 'wheelchair');

    expect(westRoute?.nodeIds.slice(0, 4)).toEqual([
      'career-guidance-3',
      'west-hall-3-north',
      'west-hall-3-entry',
      'hall-3-1',
    ]);
    expect(eastRoute?.nodeIds.slice(0, 4)).toEqual([
      'math-room-3',
      'east-hall-3-north',
      'east-hall-3-entry',
      'hall-3-11',
    ]);
    expect(westRoute?.edgeIds).toContain('f3-west-hall-north');
    expect(eastRoute?.edgeIds).toContain('f3-east-hall-north');

    const westHallNodes = navigationNodes.filter((node) => node.id.startsWith('west-hall-3-'));
    const eastHallNodes = navigationNodes.filter((node) => node.id.startsWith('east-hall-3-'));
    expect(new Set(westHallNodes.map((node) => node.x)).size).toBe(1);
    expect(new Set(eastHallNodes.map((node) => node.x)).size).toBe(1);
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

  it('일반 모드에서는 출발지와 목적지에 가장 가까운 계단을 선택한다', () => {
    const westRoute = findShortestPath(navigationNodes, navigationEdges, 'class-1-1', 'art-room-2', 'normal');
    const centerRoute = findShortestPath(navigationNodes, navigationEdges, 'grade1-office-1', 'support-b-2', 'normal');
    const eastRoute = findShortestPath(navigationNodes, navigationEdges, 'library-1', 'history-2', 'normal');

    expect(westRoute?.edgeIds).toContain('stairs-west-1-2');
    expect(westRoute?.edgeIds).not.toContain('stairs-1-2');
    expect(centerRoute?.edgeIds).toContain('stairs-1-2');
    expect(eastRoute?.edgeIds).toContain('stairs-east-1-2');
    expect(eastRoute?.edgeIds).not.toContain('stairs-1-2');
  });

  it('휠체어 모드에서는 계단을 제외하고 엘리베이터로 우회한다', () => {
    const route = findShortestPath(navigationNodes, navigationEdges, 'main-entrance-1', 'moving-class-3', 'wheelchair');
    expect(route).not.toBeNull();
    const usedStairs = route?.edgeIds.some((edgeId) => navigationEdges.find((edge) => edge.id === edgeId)?.type === 'stairs');
    expect(usedStairs).toBe(false);
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
