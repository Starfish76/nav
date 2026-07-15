import { useMemo, useState } from 'react';
import { findShortestPath } from './algorithms/dijkstra';
import { Header } from './components/Header';
import { InstructionList } from './components/InstructionList';
import { RouteForm } from './components/RouteForm';
import { RouteMap } from './components/RouteMap';
import { RouteSummary } from './components/RouteSummary';
import { navigationEdges } from './data/edges';
import { navigationNodes } from './data/nodes';
import type { RouteResult, TravelMode } from './types/navigation';
import { buildRouteSteps, validateNavigationData } from './utils/routeUtils';
import { speakKorean, stopSpeech } from './utils/speech';

export default function App() {
  const [selectedStartId, setSelectedStartId] = useState('main-entrance-1');
  const [selectedEndId, setSelectedEndId] = useState('class-2-1');
  const [travelMode, setTravelMode] = useState<TravelMode>('wheelchair');
  const [routeResult, setRouteResult] = useState<RouteResult | null>(null);
  const [selectedFloor, setSelectedFloor] = useState(1);
  const [currentStep, setCurrentStep] = useState(0);
  const [speechStatus, setSpeechStatus] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const validation = useMemo(() => validateNavigationData(navigationNodes, navigationEdges), []);
  const steps = useMemo(() => routeResult ? buildRouteSteps(routeResult, navigationNodes, navigationEdges) : [], [routeResult]);

  const findRoute = () => {
    setErrorMessage(''); stopSpeech(); setSpeechStatus('');
    if (!validation.valid) { setErrorMessage('학교 경로 데이터에 오류가 있어 탐색할 수 없습니다.'); return; }
    if (!selectedStartId) { setErrorMessage('출발지를 선택해 주세요.'); return; }
    if (!selectedEndId) { setErrorMessage('목적지를 선택해 주세요.'); return; }
    if (selectedStartId === selectedEndId) { setErrorMessage('출발지와 목적지는 서로 달라야 합니다.'); return; }
    const result = findShortestPath(navigationNodes, navigationEdges, selectedStartId, selectedEndId, travelMode);
    if (!result || result.edgeIds.length === 0) { setRouteResult(null); setErrorMessage('선택한 이동 조건으로 이용 가능한 경로를 찾을 수 없습니다.'); return; }
    setRouteResult(result); setCurrentStep(0);
    const startFloor = navigationNodes.find((node) => node.id === selectedStartId)?.floor;
    if (startFloor) setSelectedFloor(startFloor);
  };

  const reset = () => { setSelectedStartId(''); setSelectedEndId(''); setTravelMode('wheelchair'); setRouteResult(null); setCurrentStep(0); setSelectedFloor(1); setErrorMessage(''); stopSpeech(); setSpeechStatus(''); };
  const swap = () => { setSelectedStartId(selectedEndId); setSelectedEndId(selectedStartId); setRouteResult(null); setCurrentStep(0); setErrorMessage(''); };
  const selectStep = (index: number) => { setCurrentStep(index); setSelectedFloor(steps[index]?.to.floor ?? selectedFloor); };
  const changeStep = (next: number) => { const index = Math.max(0, Math.min(steps.length - 1, next)); selectStep(index); };
  const speak = (text: string) => { const supported = speakKorean(text, () => setSpeechStatus('음성 안내가 끝났습니다.')); setSpeechStatus(supported ? '음성 안내를 재생하고 있습니다.' : '현재 브라우저에서는 음성 안내를 지원하지 않습니다.'); };

  return (
    <><Header /><main id="main-content" className="page-shell">
      <div className="intro-line"><span>본관 · 1–3층</span><p>정확한 평면도가 아닌 주요 이동 지점을 연결한 안내 지도입니다.</p></div>
      <div className="dashboard-grid">
        <div className="top-card-grid">
          <RouteForm nodes={navigationNodes} startId={selectedStartId} endId={selectedEndId} mode={travelMode} onStartChange={setSelectedStartId} onEndChange={setSelectedEndId} onModeChange={setTravelMode} onSubmit={findRoute} onSwap={swap} onReset={reset} />
          <div className="route-result-column">
            {errorMessage && <div className="error-message" role="alert"><strong>경로를 확인해 주세요</strong><span>{errorMessage}</span></div>}
            {routeResult
              ? <RouteSummary steps={steps} totalCost={routeResult.totalCost} mode={travelMode} />
              : <section className="card summary-card summary-placeholder" aria-live="polite">
                  <div><p className="eyebrow">맞춤형 경로 안내</p><h2>추천 경로</h2></div>
                  <div className="summary-placeholder-content"><span aria-hidden="true">↗</span><strong>이동 경로를 찾아보세요</strong><p>출발지와 목적지를 선택하고 경로 찾기 버튼을 누르면 이동 요약이 표시됩니다.</p></div>
                </section>}
          </div>
        </div>
        <RouteMap nodes={navigationNodes} edges={navigationEdges} route={routeResult} selectedFloor={selectedFloor} onFloorChange={setSelectedFloor} />
      </div>
      {routeResult && <InstructionList steps={steps} currentStep={currentStep} speechStatus={speechStatus} onStepSelect={selectStep} onPrevious={() => changeStep(currentStep - 1)} onNext={() => changeStep(currentStep + 1)} onRestart={() => changeStep(0)} onSpeakAll={() => speak(steps.map((step, index) => `${index + 1}단계. ${step.edge.instruction}`).join(' '))} onSpeakCurrent={() => speak(`${currentStep + 1}단계. ${steps[currentStep]?.edge.instruction ?? ''}`)} onStopSpeech={() => { stopSpeech(); setSpeechStatus('음성 안내를 중지했습니다.'); }} />}
    </main><footer>교내 배리어프리 길찾기 <span>·</span> 학교 이동 지원 프로젝트</footer></>
  );
}
