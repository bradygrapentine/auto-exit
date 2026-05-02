import { describe, it, expect } from 'vitest';
import {
  detectTickerFromPath,
  detectTickerFromDOM,
  detectTicker,
} from '../../../extension/content/ticker-detector';

const mockDoc = (ticker: string | null) =>
  ({
    querySelector: (_: string) => (ticker ? { textContent: ticker } : null),
  }) as unknown as Document;

describe('detectTickerFromPath', () => {
  it('extracts ticker from market path', () => {
    expect(detectTickerFromPath('/markets/KX-BTCUSD-24DEC/')).toBe('KX-BTCUSD-24DEC');
  });

  it('extracts ticker with trailing path segment', () => {
    expect(detectTickerFromPath('/markets/KX-ETHUSDT/order')).toBe('KX-ETHUSDT');
  });

  it('returns null for home page', () => {
    expect(detectTickerFromPath('/')).toBeNull();
  });

  it('returns null when no KX segment', () => {
    expect(detectTickerFromPath('/explore/politics')).toBeNull();
  });
});

describe('detectTickerFromDOM', () => {
  it('returns ticker from element textContent', () => {
    expect(detectTickerFromDOM(mockDoc('KX-TESTMKT'))).toBe('KX-TESTMKT');
  });

  it('returns null when querySelector returns null', () => {
    expect(detectTickerFromDOM(mockDoc(null))).toBeNull();
  });

  it('trims whitespace from textContent', () => {
    expect(detectTickerFromDOM(mockDoc('  KX-TRIMMED  '))).toBe('KX-TRIMMED');
  });
});

describe('detectTicker', () => {
  it('path wins over DOM when both present', () => {
    expect(detectTicker('/markets/KX-PATH-WINS/', mockDoc('KX-DOM-TICKER'))).toBe('KX-PATH-WINS');
  });

  it('falls back to DOM when path has no KX segment', () => {
    expect(detectTicker('/explore', mockDoc('KX-DOM-TICKER'))).toBe('KX-DOM-TICKER');
  });

  it('returns null when neither source finds a ticker', () => {
    expect(detectTicker('/', mockDoc(null))).toBeNull();
  });
});
