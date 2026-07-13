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

const nodeTypeLabels: Record<NavigationNode['type'], string> = { entrance: '입구', hallway: '복도', room: '교실·업무실', elevator: '엘리베이터', stairs: '계단', ramp: '경사로', restroom: '화장실', facility: '시설' };

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
  'wee-class-1': { x: 26, y: 205, width: 64, height: 170, doorPath: 'M90 271v18' },
  'health-1': { x: 26, y: 375, width: 64, height: 170, doorPath: 'M90 446v18' },
  'lobby-1': { x: 90, y: 390, width: 50, height: 155, doorPath: '' },
  'stairs-west-1': { x: 90, y: 205, width: 50, height: 95, doorPath: '' },
  'male-wc-1': { x: 140, y: 205, width: 70, height: 95, doorPath: 'M166 300h18' },
  'class-1-1': { x: 140, y: 390, width: 80, height: 110, doorPath: 'M171 390h18' },
  'class-1-2': { x: 220, y: 390, width: 75, height: 110, doorPath: 'M248 390h18' },
  'vice-principal-1': { x: 295, y: 390, width: 45, height: 110, doorPath: 'M309 390h18' },
  'support-a-1': { x: 340, y: 390, width: 45, height: 110, doorPath: 'M353 390h18' },
  'administration-1': { x: 385, y: 390, width: 70, height: 110, doorPath: 'M411 390h18' },
  'grade1-office-1': { x: 335, y: 205, width: 70, height: 95, doorPath: 'M361 300h18' },
  'print-room-1': { x: 405, y: 205, width: 45, height: 95, doorPath: 'M416 300h18' },
  'warehouse-1': { x: 405, y: 160, width: 45, height: 45, doorPath: 'M416 205h18' },
  'stairs-1': { x: 450, y: 205, width: 38, height: 95, doorPath: 'M460 300h18' },
  'accessible-female-wc-1': { x: 488, y: 205, width: 42, height: 95, doorPath: 'M500 300h18' },
  'accessible-wc-1': { x: 530, y: 205, width: 38, height: 95, doorPath: 'M540 300h18' },
  'elevator-1': { x: 568, y: 205, width: 30, height: 95, doorPath: 'M574 300h18' },
  'main-entrance-1': { x: 455, y: 390, width: 55, height: 170, doorPath: '' },
  'class-1-3': { x: 510, y: 390, width: 90, height: 110, doorPath: 'M546 390h18' },
  'class-1-4': { x: 600, y: 390, width: 70, height: 110, doorPath: 'M626 390h18' },
  'class-1-5': { x: 670, y: 390, width: 75, height: 110, doorPath: 'M699 390h18' },
  'class-1-6': { x: 745, y: 390, width: 75, height: 110, doorPath: 'M776 390h18' },
  'facility-storage-1': { x: 650, y: 205, width: 70, height: 95, doorPath: 'M676 300h18' },
  'female-wc-east-1': { x: 720, y: 205, width: 55, height: 95, doorPath: 'M738 300h18' },
  'stairs-east-1': { x: 775, y: 205, width: 30, height: 95, doorPath: 'M781 300h18' },
  'machine-room-1': { x: 805, y: 205, width: 45, height: 95, doorPath: 'M818 300h18' },
  'east-lobby-1': { x: 820, y: 390, width: 55, height: 155, doorPath: '' },
  'library-1': { x: 875, y: 205, width: 99, height: 340, doorPath: 'M916 300h18' },
};

const floorOneOutline = 'M26 205H90V205H210V300H335V205H405V160H450V205H598V300H650V205H850V300H875V205H974V545H875V545H820V500H510V560H455V500H140V545H26Z';

const floorOneOpenSpaces: Record<string, { fillPath: string; wallPath: string }> = {
  'lobby-1': { fillPath: 'M90 300H155V390H140V545H90Z', wallPath: 'M90 300V545H140V390' },
  'main-entrance-1': { fillPath: 'M455 375H510V560H455Z', wallPath: 'M455 390V560H510V390' },
  'east-lobby-1': { fillPath: 'M820 300H875V545H820V390', wallPath: 'M875 300V545H820V390' },
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
  const viewBoxWidth = 1280;
  const horizontalOrigin = 20;
  const scaleX = 1.28;
  const scaleY = selectedFloor === 1 ? 1.28 : 1.12;
  const scalePointX = (x: number) => horizontalOrigin + ((x - horizontalOrigin) * scaleX);
  const scalePointY = (y: number) => 350 + ((y - 350) * scaleY);
  const layoutTransform = `translate(${horizontalOrigin * (1 - scaleX)} ${350 * (1 - scaleY)}) scale(${scaleX} ${scaleY})`;

  return (
    <section className="card map-card" aria-labelledby="map-title">
      <div className="map-topbar">
        <div><p className="eyebrow">SIMPLIFIED FLOOR PLAN</p><h2 id="map-title">학교 안내 지도</h2></div>
        <FloorSelector selectedFloor={selectedFloor} routeFloors={routeFloors} onChange={onFloorChange} />
      </div>
      <div className="map-frame" tabIndex={0} aria-label={`${selectedFloor}층 지도. 좌우로 이동하여 전체 지도를 볼 수 있습니다.`}>
        <div className="floor-label" aria-hidden="true"><strong>{selectedFloor}</strong><span>FLOOR</span></div>
        <span className="map-source-note">본관 배치 기반 간략도 · 좌우로 이동</span>
        <svg className="floorplan-mode" viewBox={`0 0 ${viewBoxWidth} 700`} role="img" aria-labelledby="map-svg-title map-svg-desc">
          <title id="map-svg-title">본관 {selectedFloor}층 경로 지도</title>
          <desc id="map-svg-desc">실제 본관의 긴 중앙 복도와 복도 양쪽 공간을 단순화하고 장소 노드와 이동 경로를 표시한 지도입니다.</desc>
          <g className="building-layout" transform={layoutTransform} aria-hidden="true">
            {selectedFloor === 1
              ? <path className="building-outline" d={floorOneOutline} />
              : <rect className="building-outline" x="24" y="72" width="952" height="574" rx="16" />}
            <rect className="corridor-area" x={selectedFloor === 1 ? 140 : 24} y="300" width={selectedFloor === 1 ? 735 : 952} height="90" />
            <path className="corridor-centerline" d={selectedFloor === 1 ? 'M140 350H875' : 'M42 350H958'} />
            <text className="corridor-label" x="500" y="338" textAnchor="middle">{selectedFloor}층 본관 중앙 복도</text>
            {roomBoxes.map(({ node, x, y, width, height }) => {
              const openSpace = floorOneOpenSpaces[node.id];
              if (openSpace) {
                return <g key={`room-box-${node.id}`} className="open-hall-space">
                  <path className="open-hall-fill" d={openSpace.fillPath} />
                  <path className="open-hall-walls" d={openSpace.wallPath} />
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
              if (node.type === 'hallway' && !isCurrent) return null;
              const labelLines = node.type === 'hallway' ? ['현재 위치'] : splitNodeLabel(node.name);
              const longestLine = Math.max(...labelLines.map((line) => line.length));
              const labelWidth = Math.min(104, Math.max(38, (longestLine * 9) + 14));
              const labelHeight = (labelLines.length * 14) + 12;
              const textStartY = -((labelLines.length - 1) * 7) + 3.5;
              return <g key={node.id} className={`map-node label-node ${node.type} ${isStart ? 'start' : ''} ${isEnd ? 'end' : ''} ${isCurrent ? 'current-position' : ''}`} transform={`translate(${scalePointX(node.x)} ${scalePointY(node.y)})`} role="img" aria-label={`${node.name}, ${node.floor}층, ${nodeTypeLabels[node.type]}`}>
                {isCurrent && <rect className="pulse-box" x={-(labelWidth / 2) - 5} y={-(labelHeight / 2) - 5} width={labelWidth + 10} height={labelHeight + 10} rx="10" aria-hidden="true" />}
                <rect className="node-label-box" x={-(labelWidth / 2)} y={-(labelHeight / 2)} width={labelWidth} height={labelHeight} rx="7" />
                <text className="node-label-text" y={textStartY}>{labelLines.map((line, index) => <tspan key={`${node.id}-${line}`} x="0" dy={index === 0 ? 0 : 14}>{line}</tspan>)}</text>
              </g>;
            })}
          </g>
          {route && !routeFloors.includes(selectedFloor) && <text x={viewBoxWidth / 2} y="650" textAnchor="middle" className="empty-floor-note">현재 층에는 추천 경로 구간이 없습니다.</text>}
        </svg>
      </div>
      <AccessibilityLegend />
    </section>
  );
}
