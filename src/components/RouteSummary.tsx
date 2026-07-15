import type { RouteStep, TravelMode } from '../types/navigation';
import { calculateAccessibilityScore } from '../utils/routeUtils';

interface Props { steps: RouteStep[]; totalCost: number; mode: TravelMode; }

export function RouteSummary({ steps, totalCost, mode }: Props) {
  if (!steps.length) return null;
  const count = (type: RouteStep['edge']['type']) => steps.filter(({ edge }) => edge.type === type).length;
  const floors = [...new Set(steps.flatMap(({ from, to }) => [from.floor, to.floor]))].sort();
  const score = calculateAccessibilityScore(steps);
  return (
    <section className="card summary-card" aria-labelledby="summary-title" aria-live="polite">
      <div className="summary-title"><div><p className="eyebrow">맞춤형 경로 안내</p><h2 id="summary-title">추천 경로</h2></div><span className="mode-chip">{mode === 'wheelchair' ? '♿ 휠체어 이동' : '● 일반 이동'}</span></div>
      <p className="route-names"><strong>{steps[0].from.name}</strong><span aria-hidden="true">→</span><strong>{steps.at(-1)?.to.name}</strong></p>
      <div className="score-row"><div className="score-ring" style={{ '--score': `${score * 3.6}deg` } as React.CSSProperties}><span><strong>{score}</strong>점</span></div><div><strong>접근성 점수</strong><p>{score >= 85 ? '편안한 이동이 가능한 경로예요.' : score >= 60 ? '일부 주의 구간이 있어요.' : '이동 전 경로를 확인하세요.'}</p></div></div>
      <dl className="summary-grid">
        <div><dt>총 이동 비용</dt><dd>{totalCost}</dd></div><div><dt>이동 단계</dt><dd>{steps.length}단계</dd></div><div><dt>이용 층</dt><dd>{floors.map((floor) => `${floor}층`).join(' · ')}</dd></div><div><dt>엘리베이터</dt><dd>{count('elevator')}회</dd></div><div><dt>계단</dt><dd>{count('stairs')}회</dd></div><div><dt>경사로</dt><dd>{count('ramp')}회</dd></div>
      </dl>
    </section>
  );
}
