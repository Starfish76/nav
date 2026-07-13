interface Props { selectedFloor: number; routeFloors: number[]; onChange: (floor: number) => void; }

export function FloorSelector({ selectedFloor, routeFloors, onChange }: Props) {
  return (
    <div className="floor-selector" role="group" aria-label="표시할 층 선택">
      {[1, 2, 3].map((floor) => <button key={floor} className={selectedFloor === floor ? 'active' : ''} type="button" aria-pressed={selectedFloor === floor} onClick={() => onChange(floor)}>{floor}층 {routeFloors.includes(floor) && <span className="route-dot" aria-label="경로 있음">●</span>}</button>)}
    </div>
  );
}
