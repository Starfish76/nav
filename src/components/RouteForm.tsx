import type { FormEvent } from 'react';
import type { NavigationNode, TravelMode } from '../types/navigation';

interface Props {
  nodes: NavigationNode[];
  startId: string;
  endId: string;
  mode: TravelMode;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
  onModeChange: (value: TravelMode) => void;
  onSubmit: () => void;
  onSwap: () => void;
  onReset: () => void;
}

function NodeOptions({ nodes }: { nodes: NavigationNode[] }) {
  return <>{[1, 2, 3].map((floor) => (
    <optgroup key={floor} label={`${floor}층`}>
      {nodes.filter((node) => node.floor === floor && node.type !== 'hallway').map((node) => <option key={node.id} value={node.id}>{node.name}</option>)}
    </optgroup>
  ))}</>;
}

export function RouteForm(props: Props) {
  const submit = (event: FormEvent) => { event.preventDefault(); props.onSubmit(); };
  return (
    <section className="card route-form-card" aria-labelledby="route-form-title">
      <div className="section-heading">
        <span className="step-badge">01</span>
        <div><h2 id="route-form-title">경로 설정</h2><p>출발지와 목적지를 선택하세요.</p></div>
      </div>
      <form onSubmit={submit}>
        <label htmlFor="start">출발지</label>
        <select id="start" value={props.startId} onChange={(event) => props.onStartChange(event.target.value)}>
          <option value="">출발지를 선택하세요</option><NodeOptions nodes={props.nodes} />
        </select>
        <button className="swap-button" type="button" onClick={props.onSwap} aria-label="출발지와 목적지 바꾸기"><span aria-hidden="true">⇅</span> 출발지와 목적지 바꾸기</button>
        <label htmlFor="end">목적지</label>
        <select id="end" value={props.endId} onChange={(event) => props.onEndChange(event.target.value)}>
          <option value="">목적지를 선택하세요</option><NodeOptions nodes={props.nodes} />
        </select>
        <fieldset>
          <legend>이동 모드</legend>
          <div className="mode-selector">
            <label className={props.mode === 'wheelchair' ? 'selected' : ''}><input type="radio" name="mode" value="wheelchair" checked={props.mode === 'wheelchair'} onChange={() => props.onModeChange('wheelchair')} /><span aria-hidden="true">♿</span><strong>휠체어 이동</strong><small>계단·장애물 제외</small></label>
            <label className={props.mode === 'normal' ? 'selected' : ''}><input type="radio" name="mode" value="normal" checked={props.mode === 'normal'} onChange={() => props.onModeChange('normal')} /><span aria-hidden="true">●</span><strong>일반 이동</strong><small>모든 경로 허용</small></label>
          </div>
        </fieldset>
        <div className="form-actions"><button className="primary" type="submit">경로 찾기 <span aria-hidden="true">→</span></button><button className="secondary" type="button" onClick={props.onReset}>초기화</button></div>
      </form>
    </section>
  );
}
