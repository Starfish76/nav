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
  'wee-class-1': { x: 26, y: 205, width: 72, height: 170, doorPath: 'M98 271v18' },
  'health-1': { x: 26, y: 375, width: 72, height: 170, doorPath: 'M98 446v18' },
  'lobby-1': { x: 98, y: 390, width: 50, height: 155, doorPath: 'M148 456v18' },
  'stairs-west-1': { x: 98, y: 190, width: 54, height: 110, doorPath: 'M116 300h18' },
  'male-wc-1': { x: 152, y: 190, width: 72, height: 110, doorPath: 'M178 300h18' },
  'class-1-1': { x: 152, y: 390, width: 72, height: 110, doorPath: 'M178 390h18' },
  'class-1-2': { x: 224, y: 390, width: 76, height: 110, doorPath: 'M253 390h18' },
  'vice-principal-1': { x: 300, y: 390, width: 38, height: 110, doorPath: 'M310 390h18' },
  'support-a-1': { x: 338, y: 390, width: 44, height: 110, doorPath: 'M351 390h18' },
  'administration-1': { x: 382, y: 390, width: 63, height: 110, doorPath: 'M403 390h18' },
  'grade1-office-1': { x: 335, y: 205, width: 60, height: 95, doorPath: 'M356 300h18' },
  'print-room-1': { x: 395, y: 205, width: 56, height: 95, doorPath: 'M414 300h18' },
  'warehouse-1': { x: 398, y: 160, width: 50, height: 45, doorPath: 'M414 205h18' },
  'stairs-1': { x: 451, y: 205, width: 39, height: 95, doorPath: 'M461 300h18' },
  'accessible-wc-1': { x: 490, y: 205, width: 45, height: 95, doorPath: 'M503 300h18' },
  'elevator-1': { x: 535, y: 205, width: 40, height: 95, doorPath: 'M546 300h18' },
  'main-entrance-1': { x: 445, y: 390, width: 52, height: 170, doorPath: 'M461 390h18' },
  'class-1-3': { x: 497, y: 390, width: 95, height: 110, doorPath: 'M536 390h18' },
  'class-1-4': { x: 592, y: 390, width: 68, height: 110, doorPath: 'M616 390h18' },
  'class-1-5': { x: 660, y: 390, width: 74, height: 110, doorPath: 'M688 390h18' },
  'class-1-6': { x: 734, y: 390, width: 76, height: 110, doorPath: 'M763 390h18' },
  'facility-storage-1': { x: 650, y: 205, width: 85, height: 95, doorPath: 'M683 300h18' },
  'machine-room-1': { x: 735, y: 205, width: 75, height: 95, doorPath: 'M763 300h18' },
  'library-1': { x: 810, y: 205, width: 164, height: 340, doorPath: 'M891 300h18' },
};

const floorOneOutline = 'M26 205H98V190H224V300H335V205H398V160H448V205H575V300H650V205H810V205H974V545H810V500H497V560H445V500H152V545H26Z';

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
  const scaleX = 1.04;
  const scaleY = selectedFloor === 1 ? 1.28 : 1.12;
  const scalePointX = (x: number) => 500 + ((x - 500) * scaleX);
  const scalePointY = (y: number) => 350 + ((y - 350) * scaleY);
  const layoutTransform = `translate(${500 * (1 - scaleX)} ${350 * (1 - scaleY)}) scale(${scaleX} ${scaleY})`;

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
          <g className="building-layout" transform={layoutTransform} aria-hidden="true">
            {selectedFloor === 1
              ? <path className="building-outline" d={floorOneOutline} />
              : <rect className="building-outline" x="24" y="72" width="952" height="574" rx="16" />}
            <rect className="corridor-area" x={selectedFloor === 1 ? 148 : 24} y="300" width={selectedFloor === 1 ? 826 : 952} height="90" />
            <path className="corridor-centerline" d={selectedFloor === 1 ? 'M148 350H958' : 'M42 350H958'} />
            <text className="corridor-label" x="500" y="338" textAnchor="middle">{selectedFloor}층 본관 중앙 복도</text>
            {roomBoxes.map(({ node, x, y, width, height, doorPath }) => {
              if (node.id === 'lobby-1') {
                return <g key={`room-box-${node.id}`} className="open-hall-space">
                  <path className="open-hall-fill" d="M98 300H152V390H148V545H98Z" />
                  <path className="open-hall-walls" d="M98 300V545H148V390" />
                </g>;
              }
              if (node.id === 'stairs-west-1') {
                return <g key={`room-box-${node.id}`} className="room-space stairs partial-room">
                  <rect className="partial-room-fill" x={x} y={y} width={width} height={height} />
                  <path className="partial-room-outline" d={`M${x} ${y + height}V${y}H${x + width}V${y + height}`} />
                </g>;
              }
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
              return <line key={edge.id} x1={scalePointX(from.x)} y1={scalePointY(from.y)} x2={scalePointX(to.x)} y2={scalePointY(to.y)} className={classes} aria-label={`${from.name}에서 ${to.name} 이동 통로`} />;
            })}
          </g>
          <g aria-label="학교 장소">
            {floorNodes.map((node) => {
              const isStart = route?.nodeIds[0] === node.id; const isEnd = route?.nodeIds.at(-1) === node.id; const isCurrent = currentNodeId === node.id;
              const labelLines = splitNodeLabel(node.name);
              const labelY = node.y > 450 ? -44 - ((labelLines.length - 1) * 8) : 48;
              return <g key={node.id} className={`map-node ${node.type} ${isStart ? 'start' : ''} ${isEnd ? 'end' : ''} ${isCurrent ? 'current-position' : ''}`} transform={`translate(${scalePointX(node.x)} ${scalePointY(node.y)})`} role="img" aria-label={`${node.name}, ${node.floor}층, ${symbols[node.type]}`}>
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
