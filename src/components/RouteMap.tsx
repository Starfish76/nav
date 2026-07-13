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

export function RouteMap({ nodes, edges, route, selectedFloor, currentStep, onFloorChange }: Props) {
  const nodeMap = new Map(nodes.map((node) => [node.id, node]));
  const floorNodes = nodes.filter((node) => node.floor === selectedFloor);
  const floorNodeIds = new Set(floorNodes.map((node) => node.id));
  const floorEdges = edges.filter((edge) => floorNodeIds.has(edge.from) && floorNodeIds.has(edge.to));
  const routeEdgeIds = new Set(route?.edgeIds ?? []);
  const currentEdgeId = route?.edgeIds[currentStep];
  const currentNodeId = route?.nodeIds[currentStep + 1];
  const routeFloors = [...new Set((route?.nodeIds ?? []).map((id) => nodeMap.get(id)?.floor).filter((floor): floor is number => floor !== undefined))];

  return (
    <section className="card map-card" aria-labelledby="map-title">
      <div className="map-topbar"><div><p className="eyebrow">SIMPLIFIED NETWORK MAP</p><h2 id="map-title">학교 안내 지도</h2></div><FloorSelector selectedFloor={selectedFloor} routeFloors={routeFloors} onChange={onFloorChange} /></div>
      <div className="map-frame">
        <div className="floor-label" aria-hidden="true"><strong>{selectedFloor}</strong><span>FLOOR</span></div>
        <svg viewBox="0 0 1000 700" role="img" aria-labelledby="map-svg-title map-svg-desc">
          <title id="map-svg-title">본관 {selectedFloor}층 경로 지도</title>
          <desc id="map-svg-desc">장소를 노드로, 이동 통로를 선으로 나타낸 단순화된 안내 지도입니다.</desc>
          <g className="grid-lines" aria-hidden="true"><path d="M100 120H900M100 350H900M100 580H900M220 80V620M500 80V620M780 80V620" /></g>
          <g aria-label="이동 통로">
            {floorEdges.map((edge) => {
              const from = nodeMap.get(edge.from); const to = nodeMap.get(edge.to); if (!from || !to) return null;
              const classes = ['map-edge', !edge.accessible || edge.type === 'stairs' ? 'blocked' : '', routeEdgeIds.has(edge.id) ? 'route' : '', currentEdgeId === edge.id ? 'current' : ''].filter(Boolean).join(' ');
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
