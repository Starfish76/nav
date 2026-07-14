import type { NavigationEdge, NavigationNode, RouteResult } from '../types/navigation';
import { AccessibilityLegend } from './AccessibilityLegend';
import { FloorSelector } from './FloorSelector';

interface Props {
  nodes: NavigationNode[];
  edges: NavigationEdge[];
  route: RouteResult | null;
  selectedFloor: number;
  onFloorChange: (floor: number) => void;
}

const nodeTypeLabels: Record<NavigationNode['type'], string> = { entrance: '입구', hallway: '복도', room: '교실·업무실', elevator: '엘리베이터', stairs: '계단', ramp: '경사로', restroom: '화장실', facility: '시설' };

function splitNodeLabel(name: string): string[] {
  if (name.length <= 6) return [name];
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
  'wee-class-1': { x: 26, y: 312.221, width: 64, height: 67.779, doorPath: '' },
  'health-1': { x: 26, y: 380, width: 64, height: 45.334, doorPath: '' },
  'lobby-1': { x: 90, y: 336.666, width: 65, height: 88.668, doorPath: '' },
  'stairs-west-1': { x: 90, y: 265.555, width: 50, height: 61.111, doorPath: '' },
  'male-wc-1': { x: 141.111, y: 265.555, width: 62.222, height: 61.111, doorPath: '' },
  'class-1-1': { x: 140, y: 365, width: 80, height: 32.223, doorPath: '' },
  'class-1-2': { x: 220, y: 365, width: 75, height: 32.223, doorPath: '' },
  'vice-principal-1': { x: 295, y: 365, width: 45, height: 32.223, doorPath: '' },
  'support-a-1': { x: 340, y: 365, width: 45, height: 32.223, doorPath: '' },
  'administration-1': { x: 385, y: 365, width: 70, height: 32.223, doorPath: '' },
  'grade1-office-1': { x: 385, y: 294.444, width: 70, height: 32.223, doorPath: '' },
  'print-room-1': { x: 455, y: 294.444, width: 55, height: 32.223, doorPath: '' },
  'stairs-1': { x: 511.11, y: 294.444, width: 54.667, height: 32.223, doorPath: '' },
  'accessible-female-wc-1': { x: 566.888, y: 294.444, width: 42, height: 32.223, doorPath: '' },
  'accessible-wc-1': { x: 608.888, y: 294.444, width: 38, height: 32.223, doorPath: '' },
  'elevator-1': { x: 647.999, y: 303.333, width: 30, height: 23.334, doorPath: '' },
  'main-entrance-1': { x: 455, y: 356.667, width: 110.555, height: 83.112, doorPath: '' },
  'class-1-3': { x: 566.666, y: 366.111, width: 90, height: 35.556, doorPath: '' },
  'class-1-4': { x: 657.777, y: 366.111, width: 70, height: 35.556, doorPath: '' },
  'class-1-5': { x: 727.777, y: 366.111, width: 75, height: 35.556, doorPath: '' },
  'class-1-6': { x: 802.777, y: 366.111, width: 75, height: 35.556, doorPath: '' },
  'facility-storage-1': { x: 727.777, y: 303.333, width: 55.556, height: 23.334, doorPath: '' },
  'female-wc-east-1': { x: 817.777, y: 265.555, width: 58.333, height: 60, doorPath: '' },
  'stairs-east-1': { x: 876.659, y: 265.555, width: 51.111, height: 61.111, doorPath: '' },
  'east-lobby-1': { x: 876.666, y: 326.333, width: 51.667, height: 106.779, doorPath: '' },
  'library-1': { x: 928.333, y: 309.999, width: 61.223, height: 123.113, doorPath: '' },
};

const floorTwoBoxes: Record<string, { x: number; y: number; width: number; height: number; doorPath: string }> = {
  'art-prep-2': { x: 26, y: 312.221, width: 64, height: 52.779, doorPath: '' },
  'art-room-2': { x: 26, y: 365, width: 64, height: 60.334, doorPath: '' },
  'lobby-west-2': { x: 90, y: 326.666, width: 65, height: 98.668, doorPath: '' },
  'stairs-west-2': { x: 90, y: 265.555, width: 50, height: 61.111, doorPath: '' },
  'female-wc-west-2': { x: 140, y: 265.555, width: 63.333, height: 61.111, doorPath: '' },
  'class-2-1': { x: 140, y: 365, width: 80, height: 32.223, doorPath: '' },
  'class-2-2': { x: 220, y: 365, width: 75, height: 32.223, doorPath: '' },
  'class-2-3': { x: 295, y: 365, width: 75, height: 32.223, doorPath: '' },
  'broadcast-2': { x: 370, y: 365, width: 85, height: 32.223, doorPath: '' },
  'support-b-2': { x: 385, y: 294.444, width: 70, height: 32.222, doorPath: '' },
  'telecom-2': { x: 455, y: 294.444, width: 55, height: 32.222, doorPath: '' },
  'stairs-2': { x: 511.11, y: 294.444, width: 54.667, height: 32.222, doorPath: '' },
  'male-wc-2': { x: 566.888, y: 294.444, width: 42, height: 32.222, doorPath: '' },
  'accessible-wc-2': { x: 608.888, y: 294.444, width: 38, height: 32.222, doorPath: '' },
  'elevator-2': { x: 647.999, y: 303.332, width: 30, height: 23.334, doorPath: '' },
  'principal-2': { x: 455, y: 397.223, width: 45, height: 42.556, doorPath: '' },
  'study-lounge-2': { x: 455.00001, y: 365, width: 110.555, height: 74.779, doorPath: '' },
  'grade2-office-2': { x: 565.555, y: 365, width: 90, height: 36.667, doorPath: '' },
  'class-2-4': { x: 655.555, y: 365, width: 70, height: 36.667, doorPath: '' },
  'class-2-5': { x: 725.555, y: 365, width: 75, height: 36.667, doorPath: '' },
  'moving-class-2': { x: 800.555, y: 365, width: 75, height: 36.667, doorPath: '' },
  'male-wc-east-2': { x: 785.77697, y: 265.555, width: 90.333, height: 61.111, doorPath: '' },
  'stairs-east-2': { x: 876.659, y: 265.555, width: 51.111, height: 61.111, doorPath: '' },
  'lobby-east-2': { x: 876.666, y: 326.333, width: 51.667, height: 63.667, doorPath: '' },
  'staff-lounge-2': { x: 876.666, y: 389.99998, width: 51.667, height: 43.11202, doorPath: '' },
  'history-2': { x: 928.333, y: 309.999, width: 61.223, height: 34.001, doorPath: '' },
  'ib-seminar-2': { x: 928.333, y: 344, width: 61.223, height: 89.112, doorPath: '' },
};

const floorThreeBoxes: Record<string, { x: number; y: number; width: number; height: number; doorPath: string }> = {
  'career-guidance-3': { x: 26, y: 312.221, width: 64, height: 37.779, doorPath: '' },
  'korean-room-3': { x: 26, y: 350, width: 64, height: 37.667, doorPath: '' },
  'social-room-3': { x: 26, y: 387.667, width: 64, height: 37.667, doorPath: '' },
  'stairs-west-3': { x: 90, y: 265.29199, width: 50, height: 61.37402, doorPath: '' },
  'lobby-west-3': { x: 90, y: 326.66601, width: 50, height: 75.33399, doorPath: '' },
  'document-room-3': { x: 90, y: 402, width: 50, height: 23.33399, doorPath: '' },
  'male-wc-west-3': { x: 140, y: 265.555, width: 63.333, height: 61.111, doorPath: '' },
  'west-lobby-3': { x: 141.40422, y: 326.666, width: 71.57903, height: 75.334, doorPath: '' },
  'class-3-1': { x: 213.68432, y: 365, width: 77.63155, height: 37, doorPath: '' },
  'class-3-2': { x: 291.31584, y: 365, width: 78.68417, height: 37, doorPath: '' },
  'class-3-3': { x: 368.94739, y: 365, width: 86.05261, height: 37, doorPath: '' },
  'grade3-office-3': { x: 385, y: 294.444, width: 124.73647, height: 32.223, doorPath: '' },
  'stairs-3': { x: 511.11, y: 294.444, width: 54.667, height: 32.223, doorPath: '' },
  'study-lounge-3': { x: 455, y: 365, width: 110.555, height: 37, doorPath: '' },
  'career-class-3': { x: 455, y: 402, width: 110.555, height: 37.779, doorPath: '' },
  'class-3-4': { x: 565.555, y: 365, width: 87.84211, height: 36.667, doorPath: '' },
  'elevator-3': { x: 639.57794, y: 303.332, width: 30, height: 23.334, doorPath: '' },
  'class-3-5': { x: 653.3971, y: 365, width: 76.7608, height: 36.667, doorPath: '' },
  'moving-class-3': { x: 729.10528, y: 365, width: 72.82381, height: 36.667, doorPath: '' },
  'female-wc-east-3': { x: 817.777, y: 265.555, width: 58.333, height: 61.111, doorPath: '' },
  'stairs-east-3': { x: 876.666, y: 265.555, width: 51.667, height: 61.111, doorPath: '' },
  'east-lobby-3': { x: 803.51028, y: 326.666, width: 71.57903, height: 75.334, doorPath: '' },
  'east-hall-3': { x: 876.666, y: 326.66601, width: 51.667, height: 75.33399, doorPath: '' },
  'support-d-3': { x: 876.666, y: 402, width: 51.667, height: 31.112, doorPath: '' },
  'math-room-3': { x: 928.333, y: 309.999, width: 61.223, height: 61.557, doorPath: '' },
  'english-room-3': { x: 928.333, y: 371.556, width: 61.223, height: 61.556, doorPath: '' },
};

const floorOneOutline = 'M26 312.221H90V265.555H203.333V326.667H385V294.444H647.999V303.333H677.999V326.667H727.777V303.333H783.333V265.555H927.77V309.999H989.556V433.112H928.333V433.112H876.666V401.667H565.555V439.779H455V397.223H140V425.334H26Z';

const floorTwoOutline = 'M26 312.221H90V265.555H203.333V326.666H385V294.444H647.999V303.332H677.999V326.666H785.777V265.555H927.77V309.999H989.556V433.112H876.666V401.667H565.555V439.779H455V397.223H140V425.334H26Z';

const floorThreeOutline = 'M26 312.221H90V265.292H140V265.555H203.333V326.666H385V294.444H565.777V326.666H639.578V303.332H669.578V326.666H817.777V265.555H928.333V309.999H989.556V433.112H876.666V402H565.555V439.779H455V402H140V425.334H26Z';

const floorOneCorridor = { x: 140, y: 326.666, width: 737.222, height: 38.334, centerY: 346.182 };

const floorOneCorridorExtensions = 'M90 326.666H140V336.666H90Z M783.333 268.055H817.777V326.666H783.333Z';

const floorTwoCorridor = floorOneCorridor;

const floorOneOpenSpaces: Record<string, { fillPath: string; wallPath: string }> = {
  'lobby-1': {
    fillPath: 'M90 336.666H155V360.833H140V425.334H90Z',
    wallPath: 'M90 336.666V425.334H140V360.833',
  },
  'main-entrance-1': {
    fillPath: 'M455 356.667H565.555V439.779H455Z',
    wallPath: 'M455 364.259V439.779H565.555V364.259',
  },
  'east-lobby-1': {
    fillPath: 'M876.666 326.333H928.333V433.112H876.666V355.028',
    wallPath: 'M928.333 326.333V433.112H876.666V355.028',
  },
};

const floorTwoOpenSpaces: Record<string, { fillPath: string; wallPath: string }> = {
  'lobby-west-2': {
    fillPath: 'M90 326.666H140V336.666H155V360.833H140V425.334H90Z',
    wallPath: 'M90 326.666V425.334H140V360.833',
  },
  'lobby-east-2': {
    fillPath: 'M876.666 326.333H928.333V390H876.666Z',
    wallPath: 'M928.333 326.333V390',
  },
};

function buildRoomBoxes(nodes: NavigationNode[]): RoomBox[] {
  const roomNodes = nodes.filter((node) => node.type !== 'hallway');
  const detailedBoxes = roomNodes[0]?.floor === 1 ? floorOneBoxes : roomNodes[0]?.floor === 2 ? floorTwoBoxes : roomNodes[0]?.floor === 3 ? floorThreeBoxes : undefined;
  if (detailedBoxes) {
    return roomNodes.flatMap((node) => {
      const layout = detailedBoxes[node.id];
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

export function RouteMap({ nodes, edges, route, selectedFloor, onFloorChange }: Props) {
  const nodeMap = new Map(nodes.map((node) => [node.id, node]));
  const floorNodes = nodes.filter((node) => node.floor === selectedFloor);
  const floorNodeIds = new Set(floorNodes.map((node) => node.id));
  const floorEdges = edges.filter((edge) => floorNodeIds.has(edge.from) && floorNodeIds.has(edge.to));
  const routeDirections = new Map<string, { fromId: string; toId: string; routeIndex: number }>();
  route?.edgeIds.forEach((edgeId, index) => {
    const fromId = route.nodeIds[index]; const toId = route.nodeIds[index + 1];
    if (fromId && toId) routeDirections.set(edgeId, { fromId, toId, routeIndex: index });
  });
  const floorRouteEdges = floorEdges
    .filter((edge) => routeDirections.has(edge.id))
    .sort((a, b) => (routeDirections.get(a.id)?.routeIndex ?? 0) - (routeDirections.get(b.id)?.routeIndex ?? 0));
  const corridorRouteEdges = floorRouteEdges.filter((edge) => edge.id.includes('-corridor-'));
  const directionArrowEdgeIds = new Set<string>();
  const firstFloorRouteEdge = floorRouteEdges[0];
  const lastFloorRouteEdge = floorRouteEdges.at(-1);
  if (firstFloorRouteEdge) directionArrowEdgeIds.add(firstFloorRouteEdge.id);
  if (lastFloorRouteEdge) directionArrowEdgeIds.add(lastFloorRouteEdge.id);
  if (corridorRouteEdges.length <= 2) {
    corridorRouteEdges.forEach((edge) => directionArrowEdgeIds.add(edge.id));
  } else {
    directionArrowEdgeIds.add(corridorRouteEdges[Math.floor(corridorRouteEdges.length / 3)].id);
    directionArrowEdgeIds.add(corridorRouteEdges[Math.floor((corridorRouteEdges.length * 2) / 3)].id);
  }
  const routeFloors = [...new Set((route?.nodeIds ?? []).map((id) => nodeMap.get(id)?.floor).filter((floor): floor is number => floor !== undefined))];
  const roomBoxes = buildRoomBoxes(floorNodes);
  const detailedBoxes = selectedFloor === 1 ? floorOneBoxes : selectedFloor === 2 ? floorTwoBoxes : selectedFloor === 3 ? floorThreeBoxes : undefined;
  const detailedOutline = selectedFloor === 1 ? floorOneOutline : selectedFloor === 2 ? floorTwoOutline : undefined;
  const detailedCorridor = selectedFloor === 1 ? floorOneCorridor : selectedFloor === 2 ? floorTwoCorridor : undefined;
  const detailedOpenSpaces = selectedFloor === 1 ? floorOneOpenSpaces : selectedFloor === 2 ? floorTwoOpenSpaces : undefined;
  const viewBoxWidth = 1280;
  const horizontalOrigin = 20;
  const scaleX = 1.28;
  const scaleY = 2;
  const scalePointX = (x: number) => horizontalOrigin + ((x - horizontalOrigin) * scaleX);
  const scalePointY = (y: number) => 350 + ((y - 350) * scaleY);
  const layoutTransform = `translate(${horizontalOrigin * (1 - scaleX)} ${350 * (1 - scaleY)}) scale(${scaleX} ${scaleY})`;

  return (
    <section className="card map-card" aria-labelledby="map-title">
      <div className="map-topbar">
        <div><p className="eyebrow">SIMPLIFIED FLOOR PLAN</p><h2 id="map-title">학교 안내 지도</h2></div>
        <FloorSelector selectedFloor={selectedFloor} routeFloors={routeFloors} onChange={onFloorChange} />
      </div>
      <div className="map-frame" aria-label={`${selectedFloor}층 학교 안내 지도`}>
        <div className="floor-label" aria-hidden="true"><strong>{selectedFloor}</strong><span>FLOOR</span></div>
        <span className="map-source-note">본관 배치 기반 간략도</span>
        <svg className="floorplan-mode" viewBox={`0 0 ${viewBoxWidth} 700`} role="img" aria-labelledby="map-svg-title map-svg-desc">
          <title id="map-svg-title">본관 {selectedFloor}층 경로 지도</title>
          <desc id="map-svg-desc">실제 본관의 긴 중앙 복도와 복도 양쪽 공간을 단순화하고 장소 노드와 이동 경로를 표시한 지도입니다.</desc>
          <g className="building-layout" transform={layoutTransform} aria-hidden="true">
            {selectedFloor >= 2
              ? <>
                <image href={selectedFloor === 2 ? '/svg%20(1).svg' : '/svg%20(2).svg'} x="0" y="0" width="1000" height="700" preserveAspectRatio="none" />
                <path className="building-outline building-outline-overlay" d={selectedFloor === 2 ? floorTwoOutline : floorThreeOutline} />
              </>
              : <>
                {detailedOutline
                  ? <path className="building-outline" d={detailedOutline} />
                  : <rect className="building-outline" x="24" y="72" width="952" height="574" rx="16" />}
                <rect
                  className="corridor-area"
                  x={detailedCorridor?.x ?? 24}
                  y={detailedCorridor?.y ?? 300}
                  width={detailedCorridor?.width ?? 952}
                  height={detailedCorridor?.height ?? 90}
                />
                <path className="corridor-centerline" d={detailedCorridor ? `M${detailedCorridor.x} ${detailedCorridor.centerY}H${detailedCorridor.x + detailedCorridor.width}` : 'M42 350H958'} />
                {selectedFloor === 1 && <path className="corridor-extension" d={floorOneCorridorExtensions} />}
                <text className="corridor-label" x="507" y={detailedCorridor ? detailedCorridor.centerY - 7 : 338} textAnchor="middle">{selectedFloor}층 본관 중앙 복도</text>
                {roomBoxes.map(({ node, x, y, width, height }) => {
                  const openSpace = detailedOpenSpaces?.[node.id];
                  if (openSpace) {
                    return <g key={`room-box-${node.id}`} className="open-hall-space">
                      <path className="open-hall-fill" d={openSpace.fillPath} />
                      <path className="open-hall-walls" d={openSpace.wallPath} />
                    </g>;
                  }
                  return <g key={`room-box-${node.id}`} className={`room-space ${node.type}`}>
                    <rect x={x} y={y} width={width} height={height} />
                  </g>;
                })}
              </>}
          </g>
          <g aria-label="이동 통로">
            {floorEdges.map((edge) => {
              const direction = routeDirections.get(edge.id);
              const from = nodeMap.get(direction?.fromId ?? edge.from); const to = nodeMap.get(direction?.toId ?? edge.to); if (!from || !to) return null;
              const isRoute = Boolean(direction);
              const classes = ['map-edge', edge.id.startsWith('access-') ? 'access-edge' : 'corridor-edge', !edge.accessible || edge.type === 'stairs' ? 'blocked' : '', isRoute ? 'route' : ''].filter(Boolean).join(' ');
              const fromX = scalePointX(from.x); const fromY = scalePointY(from.y);
              const toX = scalePointX(to.x); const toY = scalePointY(to.y);
              const path = edge.id === 'access-ib-seminar-2-east-lobby'
                ? from.id === 'ib-seminar-2' ? `M${fromX} ${fromY}V${toY}H${toX}` : `M${fromX} ${fromY}H${toX}V${toY}`
                : edge.id === 'access-art-prep-2-west-lobby'
                  ? from.id === 'art-prep-2' ? `M${fromX} ${fromY}H${toX}V${toY}` : `M${fromX} ${fromY}V${toY}H${toX}`
                  : from.type === 'hallway' && to.type !== 'hallway'
                    ? `M${fromX} ${fromY}H${toX}V${toY}`
                    : from.type !== 'hallway' && to.type === 'hallway'
                      ? `M${fromX} ${fromY}V${toY}H${toX}`
                      : `M${fromX} ${fromY}H${toX}V${toY}`;
              const hasVerticalAccess = Math.abs(toY - fromY) > 1;
              const arrow = edge.id === 'access-ib-seminar-2-east-lobby'
                ? { x: (fromX + toX) / 2, y: from.id === 'ib-seminar-2' ? toY : fromY, angle: toX > fromX ? 0 : 180 }
                : edge.id === 'access-art-prep-2-west-lobby' && from.id === 'lobby-west-2'
                  ? { x: fromX, y: (fromY + toY) / 2, angle: toY > fromY ? 90 : -90 }
                  : from.type === 'hallway' && to.type !== 'hallway' && hasVerticalAccess
                    ? { x: toX, y: (fromY + toY) / 2, angle: toY > fromY ? 90 : -90 }
                    : from.type !== 'hallway' && to.type === 'hallway' && hasVerticalAccess
                      ? { x: fromX, y: (fromY + toY) / 2, angle: toY > fromY ? 90 : -90 }
                      : { x: (fromX + toX) / 2, y: fromY, angle: toX > fromX ? 0 : 180 };
              return <g key={edge.id}>
                <path d={path} className={classes} aria-label={`${from.name}에서 ${to.name} 이동 통로`} />
                {isRoute && directionArrowEdgeIds.has(edge.id) && <polygon className="route-direction-arrow" points="-7,-6 7,0 -7,6 -3,0" transform={`translate(${arrow.x} ${arrow.y}) rotate(${arrow.angle})`} aria-hidden="true" />}
              </g>;
            })}
          </g>
          <g aria-label="학교 장소">
            {floorNodes.map((node) => {
              const isStart = route?.nodeIds[0] === node.id; const isEnd = route?.nodeIds.at(-1) === node.id;
              if (node.type === 'hallway') return null;
              const labelLines = splitNodeLabel(node.name);
              const longestLine = Math.max(...labelLines.map((line) => line.length));
              const labelWidth = Math.min(104, Math.max(38, (longestLine * 9) + 14));
              const labelHeight = (labelLines.length * 14) + 12;
              const textStartY = -((labelLines.length - 1) * 7) + 3.5;
              const roomLayout = detailedBoxes?.[node.id];
              const availableLabelWidth = roomLayout
                ? Math.max(1, Math.min(node.x - roomLayout.x, roomLayout.x + roomLayout.width - node.x) * 2 * scaleX - 8)
                : labelWidth;
              const availableLabelHeight = roomLayout
                ? Math.max(1, Math.min(node.y - roomLayout.y, roomLayout.y + roomLayout.height - node.y) * 2 * scaleY - 8)
                : labelHeight;
              const labelScale = Math.min(1, availableLabelWidth / labelWidth, availableLabelHeight / labelHeight);
              return <g key={node.id} className={`map-node label-node ${node.type} ${isStart ? 'start' : ''} ${isEnd ? 'end' : ''}`} transform={`translate(${scalePointX(node.x)} ${scalePointY(node.y)})`} role="img" aria-label={`${node.name}, ${node.floor}층, ${nodeTypeLabels[node.type]}`}>
                <g transform={`scale(${labelScale})`}>
                  <rect className="node-label-box" x={-(labelWidth / 2)} y={-(labelHeight / 2)} width={labelWidth} height={labelHeight} rx="7" />
                  <text className="node-label-text" y={textStartY}>{labelLines.map((line, index) => <tspan key={`${node.id}-${line}`} x="0" dy={index === 0 ? 0 : 14}>{line}</tspan>)}</text>
                </g>
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
