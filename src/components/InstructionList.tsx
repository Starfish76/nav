import type { RouteStep } from '../types/navigation';
import { edgeTypeLabels } from '../utils/routeUtils';

interface Props {
  steps: RouteStep[];
  currentStep: number;
  speechStatus: string;
  onStepSelect: (index: number) => void;
  onPrevious: () => void;
  onNext: () => void;
  onRestart: () => void;
  onSpeakAll: () => void;
  onSpeakCurrent: () => void;
  onStopSpeech: () => void;
}

export function InstructionList(props: Props) {
  if (!props.steps.length) return null;
  return (
    <section className="card instructions-card" aria-labelledby="instructions-title">
      <div className="instructions-header"><div><p className="eyebrow">순서별 길 안내</p><h2 id="instructions-title">단계별 이동 안내</h2></div><span className="progress-text">{props.currentStep + 1} / {props.steps.length} 단계</span></div>
      <div className="speech-actions" aria-label="음성 안내 제어"><button type="button" onClick={props.onSpeakAll}>🔊 전체 경로 음성 안내</button><button type="button" onClick={props.onSpeakCurrent}>▶ 현재 단계 듣기</button><button type="button" onClick={props.onStopSpeech}>■ 음성 중지</button></div>
      <p className="sr-status" aria-live="polite">{props.speechStatus}</p>
      <ol className="instruction-list">
        {props.steps.map((step, index) => <li key={`${step.edge.id}-${index}`} className={index === props.currentStep ? 'active' : ''}>
          <button type="button" onClick={() => props.onStepSelect(index)} aria-current={index === props.currentStep ? 'step' : undefined}>
            <span className="instruction-number">{String(index + 1).padStart(2, '0')}</span>
            <span className="instruction-content"><strong>{step.edge.instruction}</strong><span className="step-nodes">{step.from.name} <span aria-hidden="true">→</span> {step.to.name}</span><span className="step-meta"><i>{edgeTypeLabels[step.edge.type]}</i><i>{step.edge.accessible ? '♿ 접근 가능' : '⚠ 접근 제한'}</i><i>상대 거리 {step.edge.distance}</i></span></span>
          </button>
        </li>)}
      </ol>
      <div className="simulation-controls"><button type="button" onClick={props.onPrevious} disabled={props.currentStep === 0}>← 이전 단계</button><button type="button" onClick={props.onRestart}>처음부터</button><button className="primary" type="button" onClick={props.onNext} disabled={props.currentStep >= props.steps.length - 1}>다음 단계 →</button></div>
    </section>
  );
}
