import { describe, it, expect } from 'vitest';
import {
  detectPositionSizeFromDOM,
  type PositionDetectResult,
} from '../../../extension/content/position-detector';

function mockDoc(
  nodes: Array<{ textContent: string }>,
  fallbackNode: { textContent: string } | null = null,
): Document {
  return {
    querySelectorAll: (_: string) => nodes as unknown as NodeListOf<Element>,
    querySelector: (_: string) => (nodes.length > 0 ? nodes[0] : fallbackNode) as unknown as Element | null,
  } as unknown as Document;
}

describe('detectPositionSizeFromDOM', () => {
  it('single match returns found', () => {
    const result = detectPositionSizeFromDOM(mockDoc([{ textContent: '1000' }]));
    expect(result).toEqual<PositionDetectResult>({ kind: 'found', size: 1000 });
  });

  it('multiple matches same value returns found', () => {
    const result = detectPositionSizeFromDOM(mockDoc([{ textContent: '500' }, { textContent: '500' }]));
    expect(result).toEqual<PositionDetectResult>({ kind: 'found', size: 500 });
  });

  it('multiple matches different values returns ambiguous', () => {
    const result = detectPositionSizeFromDOM(mockDoc([{ textContent: '500' }, { textContent: '300' }]));
    expect(result).toEqual<PositionDetectResult>({ kind: 'ambiguous' });
  });

  it('empty node list with no fallback returns not-found', () => {
    const doc = {
      querySelectorAll: (_: string) => [] as unknown as NodeListOf<Element>,
      querySelector: (_: string) => null,
    } as unknown as Document;
    const result = detectPositionSizeFromDOM(doc);
    expect(result).toEqual<PositionDetectResult>({ kind: 'not-found' });
  });

  it('non-numeric textContent returns not-found', () => {
    const result = detectPositionSizeFromDOM(mockDoc([{ textContent: 'abc' }]));
    expect(result).toEqual<PositionDetectResult>({ kind: 'not-found' });
  });

  it('zero textContent returns not-found', () => {
    const result = detectPositionSizeFromDOM(mockDoc([{ textContent: '0' }]));
    expect(result).toEqual<PositionDetectResult>({ kind: 'not-found' });
  });

  it('negative textContent returns not-found', () => {
    const result = detectPositionSizeFromDOM(mockDoc([{ textContent: '-5' }]));
    expect(result).toEqual<PositionDetectResult>({ kind: 'not-found' });
  });
});
