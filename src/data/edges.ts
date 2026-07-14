import type { EdgeType, NavigationEdge } from '../types/navigation';
import { navigationNodes } from './nodes';

const nodeById = new Map(navigationNodes.map((node) => [node.id, node]));
const nodeNames = new Map(navigationNodes.map((node) => [node.id, node.name]));
const hallNodesByFloor = new Map([1, 2, 3].map((floor) => [
  floor,
  navigationNodes.filter((node) => node.floor === floor && /^hall-\d+-\d+$/.test(node.id)).sort((a, b) => a.x - b.x),
]));
const halls: Record<number, string[]> = Object.fromEntries(
  [...hallNodesByFloor].map(([floor, nodes]) => [floor, nodes.map((node) => node.id)]),
);

const corridorEdges: NavigationEdge[] = Object.entries(halls).flatMap(([floor, ids]) => ids.slice(0, -1).map((from, index) => ({
  id: `f${floor}-corridor-${index + 1}`,
  from,
  to: ids[index + 1],
  distance: Math.max(1, Math.abs((nodeById.get(ids[index + 1])?.x ?? 0) - (nodeById.get(from)?.x ?? 0)) / 10),
  accessible: true,
  type: 'corridor' as const,
  width: 1.4,
  instruction: `${floor}층 본관 복도를 따라 이동하세요.`,
  bidirectional: true,
})));

interface RoomConnection {
  node: string;
  hall?: string;
  distance?: number;
  type?: EdgeType;
  accessible?: boolean;
  width?: number;
  hasObstacle?: boolean;
}

function findNearestHallId(nodeId: string): string {
  const node = nodeById.get(nodeId);
  const floorHalls = node ? hallNodesByFloor.get(node.floor) : undefined;
  if (!node || !floorHalls?.length) throw new Error(`${nodeId}에 연결할 복도 노드를 찾을 수 없습니다.`);
  return floorHalls.reduce((nearest, hall) => Math.abs(hall.x - node.x) < Math.abs(nearest.x - node.x) ? hall : nearest).id;
}

const roomConnections: RoomConnection[] = [
  // 1층: 안내도 왼쪽에서 오른쪽 순서
  { node: 'lobby-1', type: 'corridor' }, { node: 'male-wc-1' },
  { node: 'stairs-west-1', type: 'corridor' },
  { node: 'class-1-1' }, { node: 'class-1-2' },
  { node: 'grade1-office-1' }, { node: 'print-room-1' },
  { node: 'vice-principal-1' }, { node: 'support-a-1' },
  { node: 'administration-1' }, { node: 'elevator-1', type: 'corridor' },
  { node: 'accessible-female-wc-1' }, { node: 'accessible-wc-1' },
  { node: 'main-entrance-1', type: 'ramp', distance: 8 },
  { node: 'stairs-1', type: 'corridor' }, { node: 'class-1-3' },
  { node: 'class-1-4' }, { node: 'class-1-5' },
  { node: 'class-1-6' }, { node: 'facility-storage-1' },
  { node: 'female-wc-east-1' }, { node: 'stairs-east-1', type: 'corridor' },
  { node: 'east-lobby-1', type: 'corridor' },

  // 2층
  { node: 'lobby-west-2', type: 'corridor' }, { node: 'stairs-west-2', type: 'corridor' },
  { node: 'female-wc-west-2' },
  { node: 'class-2-1' }, { node: 'class-2-2' },
  { node: 'class-2-3' }, { node: 'support-b-2' },
  { node: 'telecom-2', accessible: false }, { node: 'broadcast-2' },
  { node: 'principal-2' }, { node: 'elevator-2', type: 'corridor' },
  { node: 'male-wc-2' }, { node: 'accessible-wc-2' },
  { node: 'stairs-2', type: 'corridor' },
  { node: 'study-lounge-2' }, { node: 'grade2-office-2' },
  { node: 'class-2-4' }, { node: 'class-2-5' },
  { node: 'moving-class-2' }, { node: 'male-wc-east-2' },
  { node: 'stairs-east-2', type: 'corridor' }, { node: 'lobby-east-2', type: 'corridor' },
  { node: 'history-2' },

  // 3층
  { node: 'career-guidance-3' }, { node: 'korean-room-3' }, { node: 'social-room-3' },
  { node: 'storage-west-3' }, { node: 'stairs-west-3', type: 'corridor' }, { node: 'lobby-west-3', type: 'corridor' },
  { node: 'document-room-3', accessible: false, width: 0.85 }, { node: 'male-wc-west-3' }, { node: 'west-lobby-3', type: 'corridor' },
  { node: 'class-3-1' }, { node: 'class-3-2' }, { node: 'class-3-3' },
  { node: 'grade3-office-3' }, { node: 'storage-center-3' }, { node: 'stairs-3', type: 'corridor' },
  { node: 'study-lounge-3' }, { node: 'career-class-3' }, { node: 'class-3-4' },
  { node: 'elevator-3', type: 'corridor' }, { node: 'class-3-5' }, { node: 'moving-class-3' },
  { node: 'female-wc-east-3' }, { node: 'east-lobby-3', type: 'corridor' },
  { node: 'storage-east-3' }, { node: 'stairs-east-3', type: 'corridor' }, { node: 'east-hall-3', type: 'corridor' },
  { node: 'support-d-3' }, { node: 'math-room-3' }, { node: 'english-room-3' },
];

const accessEdges: NavigationEdge[] = roomConnections.map((connection) => {
  const type = connection.type ?? 'door';
  return {
    id: `access-${connection.node}`,
    from: connection.hall ?? findNearestHallId(connection.node),
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

const lobbyRoomEdges: NavigationEdge[] = [
  {
    id: 'access-wee-class-1-lobby',
    from: 'wee-class-1',
    to: 'lobby-1',
    distance: 4,
    accessible: true,
    type: 'door',
    width: 1.1,
    instruction: 'Wee Class에서 서쪽 홀로 나오세요.',
    bidirectional: true,
  },
  {
    id: 'access-health-1-lobby',
    from: 'health-1',
    to: 'lobby-1',
    distance: 4,
    accessible: true,
    type: 'door',
    width: 1.1,
    instruction: '보건실에서 서쪽 홀로 나오세요.',
    bidirectional: true,
  },
  {
    id: 'access-library-1-east-lobby',
    from: 'library-1',
    to: 'east-lobby-1',
    distance: 4,
    accessible: true,
    type: 'door',
    width: 1.1,
    instruction: '도서관에서 동쪽 홀로 나오세요.',
    bidirectional: true,
  },
  {
    id: 'access-art-prep-2-west-lobby',
    from: 'art-prep-2',
    to: 'lobby-west-2',
    distance: 4,
    accessible: true,
    type: 'door',
    width: 1.1,
    instruction: '미술준비실에서 서쪽 홀로 나오세요.',
    bidirectional: true,
  },
  {
    id: 'access-lobby-west-2-art-room-hall',
    from: 'lobby-west-2',
    to: 'art-room-access-hall-2',
    distance: 2,
    accessible: true,
    type: 'corridor',
    width: 1.4,
    instruction: '서쪽 홀에서 미술실 앞까지 내려가세요.',
    bidirectional: true,
  },
  {
    id: 'access-art-room-2',
    from: 'art-room-access-hall-2',
    to: 'art-room-2',
    distance: 2,
    accessible: true,
    type: 'door',
    width: 1.1,
    instruction: '미술실로 들어가세요.',
    bidirectional: true,
  },
  {
    id: 'access-staff-lounge-2-east-lobby',
    from: 'staff-lounge-2',
    to: 'lobby-east-2',
    distance: 4,
    accessible: true,
    type: 'door',
    width: 1.1,
    instruction: '교직원 휴게실에서 동쪽 로비로 나오세요.',
    bidirectional: true,
  },
  {
    id: 'access-ib-seminar-2-east-lobby',
    from: 'ib-seminar-2',
    to: 'lobby-east-2',
    distance: 4,
    accessible: true,
    type: 'door',
    width: 1.1,
    instruction: 'IB세미나실에서 동쪽 로비로 나오세요.',
    bidirectional: true,
  },
];

export const navigationEdges: NavigationEdge[] = [
  ...corridorEdges,
  ...accessEdges,
  ...lobbyRoomEdges,
  { id: 'elevator-1-2', from: 'elevator-1', to: 'elevator-2', distance: 12, accessible: true, type: 'elevator', width: 1.1, instruction: '엘리베이터를 이용해 1층과 2층 사이를 이동하세요.', bidirectional: true },
  { id: 'elevator-2-3', from: 'elevator-2', to: 'elevator-3', distance: 12, accessible: true, type: 'elevator', width: 1.1, instruction: '엘리베이터를 이용해 2층과 3층 사이를 이동하세요.', bidirectional: true },
  { id: 'stairs-1-2', from: 'stairs-1', to: 'stairs-2', distance: 7, accessible: false, type: 'stairs', instruction: '중앙 계단을 이용해 1층과 2층 사이를 이동하세요.', bidirectional: true },
  { id: 'stairs-2-3', from: 'stairs-2', to: 'stairs-3', distance: 7, accessible: false, type: 'stairs', instruction: '중앙 계단을 이용해 2층과 3층 사이를 이동하세요.', bidirectional: true },
];
