import { describe, expect, it } from 'vitest';
import type { NavigationEdge, NavigationNode, RouteStep } from '../types/navigation';
import { calculateAccessibilityScore, validateNavigationData } from './routeUtils';

const a: NavigationNode = { id: 'a', name: 'A', floor: 1, x: 0, y: 0, type: 'room' };
const b: NavigationNode = { id: 'b', name: 'B', floor: 1, x: 10, y: 0, type: 'room' };

describe('routeUtils', () => {
  it('잘못된 간선 참조를 발견한다', () => {
    const edge: NavigationEdge = { id: 'e', from: 'a', to: 'missing', distance: 1, accessible: true, type: 'corridor', instruction: '' };
    expect(validateNavigationData([a, b], [edge]).valid).toBe(false);
  });

  it('접근성 점수를 0에서 100 사이로 제한한다', () => {
    const edge: NavigationEdge = { id: 'e', from: 'a', to: 'b', distance: 1, accessible: true, type: 'stairs', width: 0.5, hasObstacle: true, instruction: '' };
    const steps: RouteStep[] = Array.from({ length: 10 }, () => ({ edge, from: a, to: b }));
    expect(calculateAccessibilityScore(steps)).toBe(0);
  });
});
