import type { EdgeType, NavigationEdge } from '../types/navigation';
import { navigationNodes } from './nodes';

const nodeNames = new Map(navigationNodes.map((node) => [node.id, node.name]));
const halls: Record<number, string[]> = {
  1: Array.from({ length: 8 }, (_, index) => `hall-1-${index + 1}`),
  2: Array.from({ length: 8 }, (_, index) => `hall-2-${index + 1}`),
  3: Array.from({ length: 8 }, (_, index) => `hall-3-${index + 1}`),
};

const corridorEdges: NavigationEdge[] = Object.entries(halls).flatMap(([floor, ids]) => ids.slice(0, -1).map((from, index) => ({
  id: `f${floor}-corridor-${index + 1}`,
  from,
  to: ids[index + 1],
  distance: 9,
  accessible: true,
  type: 'corridor' as const,
  width: 1.4,
  instruction: `${floor}층 본관 복도를 따라 이동하세요.`,
  bidirectional: true,
})));

interface RoomConnection {
  node: string;
  hall: string;
  distance?: number;
  type?: EdgeType;
  accessible?: boolean;
  width?: number;
  hasObstacle?: boolean;
}

const roomConnections: RoomConnection[] = [
  // 1층: 안내도 왼쪽에서 오른쪽 순서
  { node: 'wee-class-1', hall: 'hall-1-1' }, { node: 'health-1', hall: 'hall-1-1' },
  { node: 'lobby-1', hall: 'hall-1-1', type: 'corridor' }, { node: 'male-wc-1', hall: 'hall-1-1' },
  { node: 'stairs-west-1', hall: 'hall-1-1', type: 'corridor' },
  { node: 'class-1-1', hall: 'hall-1-2' }, { node: 'class-1-2', hall: 'hall-1-2' },
  { node: 'grade1-office-1', hall: 'hall-1-3' }, { node: 'print-room-1', hall: 'hall-1-3' },
  { node: 'warehouse-1', hall: 'hall-1-4', accessible: false, width: 0.85 },
  { node: 'vice-principal-1', hall: 'hall-1-3' }, { node: 'support-a-1', hall: 'hall-1-4' },
  { node: 'administration-1', hall: 'hall-1-5' }, { node: 'elevator-1', hall: 'hall-1-5', type: 'corridor' },
  { node: 'accessible-female-wc-1', hall: 'hall-1-5' }, { node: 'accessible-wc-1', hall: 'hall-1-5' },
  { node: 'main-entrance-1', hall: 'hall-1-5', type: 'ramp', distance: 8 },
  { node: 'stairs-1', hall: 'hall-1-6', type: 'corridor' }, { node: 'class-1-3', hall: 'hall-1-6' },
  { node: 'class-1-4', hall: 'hall-1-6' }, { node: 'class-1-5', hall: 'hall-1-7' },
  { node: 'class-1-6', hall: 'hall-1-8' }, { node: 'facility-storage-1', hall: 'hall-1-7' },
  { node: 'female-wc-east-1', hall: 'hall-1-7' }, { node: 'stairs-east-1', hall: 'hall-1-7', type: 'corridor' },
  { node: 'machine-room-1', hall: 'hall-1-8', accessible: false, hasObstacle: true },
  { node: 'east-lobby-1', hall: 'hall-1-8', type: 'corridor' }, { node: 'library-1', hall: 'hall-1-8' },

  // 2층
  { node: 'art-prep-2', hall: 'hall-2-1' }, { node: 'art-room-2', hall: 'hall-2-1' },
  { node: 'class-2-1', hall: 'hall-2-2' }, { node: 'class-2-2', hall: 'hall-2-2' },
  { node: 'class-2-3', hall: 'hall-2-3' }, { node: 'support-b-2', hall: 'hall-2-3' },
  { node: 'telecom-2', hall: 'hall-2-4', accessible: false }, { node: 'broadcast-2', hall: 'hall-2-4' },
  { node: 'principal-2', hall: 'hall-2-5' }, { node: 'elevator-2', hall: 'hall-2-5', type: 'corridor' },
  { node: 'accessible-wc-2', hall: 'hall-2-5' }, { node: 'stairs-2', hall: 'hall-2-6', type: 'corridor' },
  { node: 'study-lounge-2', hall: 'hall-2-5' }, { node: 'grade2-office-2', hall: 'hall-2-6' },
  { node: 'class-2-4', hall: 'hall-2-7' }, { node: 'class-2-5', hall: 'hall-2-7' },
  { node: 'moving-class-2', hall: 'hall-2-8' }, { node: 'history-2', hall: 'hall-2-7' },
  { node: 'ib-seminar-2', hall: 'hall-2-8' }, { node: 'staff-lounge-2', hall: 'hall-2-8' },

  // 3층
  { node: 'career-guidance-3', hall: 'hall-3-1' }, { node: 'korean-room-3', hall: 'hall-3-1' },
  { node: 'social-room-3', hall: 'hall-3-1' }, { node: 'document-room-3', hall: 'hall-3-2', accessible: false, width: 0.85 },
  { node: 'class-3-1', hall: 'hall-3-2' }, { node: 'class-3-2', hall: 'hall-3-3' },
  { node: 'class-3-3', hall: 'hall-3-4' }, { node: 'grade3-office-3', hall: 'hall-3-4' },
  { node: 'elevator-3', hall: 'hall-3-5', type: 'corridor' }, { node: 'accessible-wc-3', hall: 'hall-3-5' },
  { node: 'stairs-3', hall: 'hall-3-6', type: 'corridor' }, { node: 'study-lounge-3', hall: 'hall-3-5' },
  { node: 'career-class-3', hall: 'hall-3-5' }, { node: 'class-3-4', hall: 'hall-3-6' },
  { node: 'class-3-5', hall: 'hall-3-7' }, { node: 'moving-class-3', hall: 'hall-3-7' },
  { node: 'math-room-3', hall: 'hall-3-8' }, { node: 'english-room-3', hall: 'hall-3-8' },
  { node: 'support-d-3', hall: 'hall-3-8' },
];

const accessEdges: NavigationEdge[] = roomConnections.map((connection) => {
  const type = connection.type ?? 'door';
  return {
    id: `access-${connection.node}`,
    from: connection.hall,
    to: connection.node,
    distance: connection.distance ?? 6,
    accessible: connection.accessible ?? true,
    type,
    slope: type === 'ramp' ? 3 : undefined,
    width: connection.width ?? (type === 'ramp' ? 1.6 : 1.1),
    hasObstacle: connection.hasObstacle,
    instruction: `${nodeNames.get(connection.node) ?? '목적지'} 방향으로 이동하세요.`,
    bidirectional: true,
  };
});

export const navigationEdges: NavigationEdge[] = [
  ...corridorEdges,
  ...accessEdges,
  { id: 'elevator-1-2', from: 'elevator-1', to: 'elevator-2', distance: 12, accessible: true, type: 'elevator', width: 1.1, instruction: '엘리베이터를 이용해 1층과 2층 사이를 이동하세요.', bidirectional: true },
  { id: 'elevator-2-3', from: 'elevator-2', to: 'elevator-3', distance: 12, accessible: true, type: 'elevator', width: 1.1, instruction: '엘리베이터를 이용해 2층과 3층 사이를 이동하세요.', bidirectional: true },
  { id: 'stairs-1-2', from: 'stairs-1', to: 'stairs-2', distance: 7, accessible: false, type: 'stairs', instruction: '중앙 계단을 이용해 1층과 2층 사이를 이동하세요.', bidirectional: true },
  { id: 'stairs-2-3', from: 'stairs-2', to: 'stairs-3', distance: 7, accessible: false, type: 'stairs', instruction: '중앙 계단을 이용해 2층과 3층 사이를 이동하세요.', bidirectional: true },
];
