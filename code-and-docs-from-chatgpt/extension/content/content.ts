import { detectTicker } from './ticker-detector';

export function getDetectedTicker(): string | null {
  return detectTicker(window.location.pathname, document);
}
