import type { NavigationEdge, NavigationNode, RouteResult } from '../types/navigation';
import { AccessibilityLegend } from './AccessibilityLegend';
import { FloorSelector } from './FloorSelector';

interface Props {
  nodes: NavigationNode[];
  edges: NavigationEdge[];
  route: RouteResult | null;
  selectedFloor: number;
  currentStep: number;
  onFloorChange: (floor: number) => void;
}

const symbols: Record<NavigationNode['type'], string> = { entrance: 'IN', hallway: '•', room: '교실', elevator: 'E', stairs: 'S', ramp: '↗', restroom: 'WC', facility: '시설' };

function splitNodeLabel(name: string): string[] {
  if (name.length <= 9) return [name];
  if (name.includes(' · ')) return name.split(' · ').map((part, index) => index === 0 ? part : `· ${part}`);
  const parenthesisIndex = name.indexOf(' (');
  if (parenthesisIndex > 0) return [name.slice(0, parenthesisIndex), name.slice(parenthesisIndex + 1)];
  const words = name.split(' ');
  if (words.length > 1) {
    const middle = Math.ceil(words.length / 2);
    return [words.slice(0, middle).join(' '), words.slice(middle).join(' ')];
  }
  return [name];
}

interface RoomBox {
  node: NavigationNode;
  x: number;
  y: number;
  width: number;
  height: number;
  doorPath: string;
}

const floorOneBoxes: Record<string, { x: number; y: number; width: number; height: number; doorPath: string }> = {
  'wee-class-1': { x: 26, y: 135, width: 72, height: 180, doorPath: 'M98 225v18' },
  'health-1': { x: 26, y: 315, width: 72, height: 250, doorPath: 'M98 456v18' },
  'lobby-1': { x: 98, y: 315, width: 50, height: 250, doorPath: 'M148 421v18' },
  'stairs-west-1': { x: 98, y: 78, width: 54, height: 220, doorPath: 'M116 298h18' },
  'male-wc-1': { x: 152, y: 78, width: 72, height: 220, doorPath: 'M178 298h18' },
  'class-1-1': { x: 152, y: 402, width: 72, height: 240, doorPath: 'M178 402h18' },
  'class-1-2': { x: 224, y: 402, width: 76, height: 240, doorPath: 'M253 402h18' },
  'vice-principal-1': { x: 300, y: 402, width: 38, height: 240, doorPath: 'M310 402h18' },
  'support-a-1': { x: 338, y: 402, width: 44, height: 240, doorPath: 'M351 402h18' },
  'administration-1': { x: 382, y: 402, width: 63, height: 240, doorPath: 'M403 402h18' },
  'grade1-office-1': { x: 335, y: 78, width: 60, height: 220, doorPath: 'M356 298h18' },
  'print-room-1': { x: 395, y: 78, width: 56, height: 220, doorPath: 'M414 298h18' },
  'warehouse-1': { x: 398, y: 34, width: 50, height: 44, doorPath: 'M414 78h18' },
  'stairs-1': { x: 451, y: 78, width: 39, height: 220, doorPath: 'M461 298h18' },
  'accessible-wc-1': { x: 490, y: 78, width: 45, height: 220, doorPath: 'M503 298h18' },
  'elevator-1': { x: 535, y: 78, width: 40, height: 220, doorPath: 'M546 298h18' },
  'main-entrance-1': { x: 445, y: 492, width: 52, height: 150, doorPath: 'M461 492h18' },
  'class-1-3': { x: 497, y: 402, width: 95, height: 240, doorPath: 'M536 402h18' },
  'class-1-4': { x: 592, y: 402, width: 68, height: 240, doorPath: 'M616 402h18' },
  'class-1-5': { x: 660, y: 402, width: 74, height: 240, doorPath: 'M688 402h18' },
  'class-1-6': { x: 734, y: 402, width: 76, height: 240, doorPath: 'M763 402h18' },
  'facility-storage-1': { x: 650, y: 78, width: 85, height: 220, doorPath: 'M683 298h18' },
  'machine-room-1': { x: 735, y: 78, width: 75, height: 220, doorPath: 'M763 298h18' },
  'library-1': { x: 810, y: 298, width: 164, height: 344, doorPath: 'M891 298h18' },
};

function buildRoomBoxes(nodes: NavigationNode[]): RoomBox[] {
  const roomNodes = nodes.filter((node) => node.type !== 'hallway');
  if (roomNodes[0]?.floor === 1) {
    return roomNodes.flatMap((node) => {
      const layout = floorOneBoxes[node.id];
      return layout ? [{ node, ...layout }] : [];
    });
  }
  const boxes: RoomBox[] = [];

  (['top', 'bottom'] as const).forEach((side) => {
    const sideNodes = roomNodes.filter((node) => side === 'top' ? node.y < 350 : node.y >= 350);
    const groupedByX = new Map<number, NavigationNode[]>();
    sideNodes.forEach((node) => groupedByX.set(node.x, [...(groupedByX.get(node.x) ?? []), node]));
    const groups = [...groupedByX.entries()].sort(([xA], [xB]) => xA - xB);

    groups.forEach(([centerX, groupNodes], index) => {
      const previousX = groups[index - 1]?.[0];
      const nextX = groups[index + 1]?.[0];
      const left = index === 0 ? 26 : (previousX + centerX) / 2;
      const right = index === groups.length - 1 ? 974 : (centerX + nextX) / 2;
      const areaTop = side === 'top' ? 78 : 402;
      const areaBottom = side === 'top' ? 298 : 642;
      const sortedGroup = [...groupNodes].sort((a, b) => a.y - b.y);
      const cellHeight = (areaBottom - areaTop) / sortedGroup.length;

      sortedGroup.forEach((node, stackIndex) => boxes.push({
        node,
        x: left,
        y: areaTop + (cellHeight * stackIndex),
        width: right - left,
        height: cellHeight,
        doorPath: side === 'top' ? `M${node.x - 9} 298h18` : `M${node.x - 9} 402h18`,
      }));
    });
  });

  return boxes;
}

export function RouteMap({ nodes, edges, route, selectedFloor, currentStep, onFloorChange }: Props) {
  const nodeMap = new Map(nodes.map((node) => [node.id, node]));
  const floorNodes = nodes.filter((node) => node.floor === selectedFloor);
  const floorNodeIds = new Set(floorNodes.map((node) => node.id));
  const floorEdges = edges.filter((edge) => floorNodeIds.has(edge.from) && floorNodeIds.has(edge.to));
  const routeEdgeIds = new Set(route?.edgeIds ?? []);
  const currentEdgeId = route?.edgeIds[currentStep];
  const currentNodeId = route?.nodeIds[currentStep + 1];
  const routeFloors = [...new Set((route?.nodeIds ?? []).map((id) => nodeMap.get(id)?.floor).filter((floor): floor is number => floor !== undefined))];
  const roomBoxes = buildRoomBoxes(floorNodes);

  return (
    <section className="card map-card" aria-labelledby="map-title">
      <div className="map-topbar">
        <div><p className="eyebrow">SIMPLIFIED FLOOR PLAN</p><h2 id="map-title">학교 안내 지도</h2></div>
        <FloorSelector selectedFloor={selectedFloor} routeFloors={routeFloors} onChange={onFloorChange} />
      </div>
      <div className="map-frame">
        <div className="floor-label" aria-hidden="true"><strong>{selectedFloor}</strong><span>FLOOR</span></div>
        <span className="map-source-note">본관 배치 기반 간략도</span>
        <svg className="floorplan-mode" viewBox="0 0 1000 700" role="img" aria-labelledby="map-svg-title map-svg-desc">
          <title id="map-svg-title">본관 {selectedFloor}층 경로 지도</title>
          <desc id="map-svg-desc">실제 본관의 긴 중앙 복도와 복도 양쪽 공간을 단순화하고 장소 노드와 이동 경로를 표시한 지도입니다.</desc>
          <g className="building-layout" aria-hidden="true">
            <rect className="building-outline" x="24" y="72" width="952" height="574" rx="16" />
            <rect className="corridor-area" x="24" y="306" width="952" height="88" />
            <path className="corridor-centerline" d="M42 350H958" />
            <text className="corridor-label" x="500" y="338" textAnchor="middle">{selectedFloor}층 본관 중앙 복도</text>
            {roomBoxes.map(({ node, x, y, width, height, doorPath }) => {
              return <g key={`room-box-${node.id}`} className={`room-space ${node.type}`}>
                <rect x={x} y={y} width={width} height={height} />
                <path className="door-mark" d={doorPath} />
              </g>;
            })}
          </g>
          <g aria-label="이동 통로">
            {floorEdges.map((edge) => {
              const from = nodeMap.get(edge.from); const to = nodeMap.get(edge.to); if (!from || !to) return null;
              const classes = ['map-edge', edge.id.startsWith('access-') ? 'access-edge' : 'corridor-edge', !edge.accessible || edge.type === 'stairs' ? 'blocked' : '', routeEdgeIds.has(edge.id) ? 'route' : '', currentEdgeId === edge.id ? 'current' : ''].filter(Boolean).join(' ');
              return <line key={edge.id} x1={from.x} y1={from.y} x2={to.x} y2={to.y} className={classes} aria-label={`${from.name}에서 ${to.name} 이동 통로`} />;
            })}
          </g>
          <g aria-label="학교 장소">
            {floorNodes.map((node) => {
              const isStart = route?.nodeIds[0] === node.id; const isEnd = route?.nodeIds.at(-1) === node.id; const isCurrent = currentNodeId === node.id;
              const labelLines = splitNodeLabel(node.name);
              const labelY = node.y > 450 ? -44 - ((labelLines.length - 1) * 8) : 48;
              return <g key={node.id} className={`map-node ${node.type} ${isStart ? 'start' : ''} ${isEnd ? 'end' : ''} ${isCurrent ? 'current-position' : ''}`} transform={`translate(${node.x} ${node.y})`} role="img" aria-label={`${node.name}, ${node.floor}층, ${symbols[node.type]}`}>
                <circle r={node.type === 'hallway' ? 8 : 23} /><text className="node-symbol" y="5">{symbols[node.type]}</text>
                {node.type !== 'hallway' && <text className="node-name" y={labelY}>{labelLines.map((line, index) => <tspan key={`${node.id}-${line}`} x="0" dy={index === 0 ? 0 : 16}>{line}</tspan>)}</text>}
                {isCurrent && <circle className="pulse-ring" r="36" aria-hidden="true" />}
              </g>;
            })}
          </g>
          {route && !routeFloors.includes(selectedFloor) && <text x="500" y="650" textAnchor="middle" className="empty-floor-note">현재 층에는 추천 경로 구간이 없습니다.</text>}
        </svg>
      </div>
      <AccessibilityLegend />
    </section>
  );
}
