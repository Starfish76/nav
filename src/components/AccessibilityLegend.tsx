export function AccessibilityLegend() {
  return (
    <div className="map-legend" aria-label="지도 범례">
      <span><i className="legend-line route" />추천 경로</span>
      <span><i className="legend-line current" />현재 구간</span>
      <span><i className="legend-line blocked" />휠체어 이용 제한</span>
      <span><i className="legend-node start" />출발</span>
      <span><i className="legend-node end" />도착</span>
    </div>
  );
}
