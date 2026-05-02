export type PositionDetectResult =
  | { kind: 'found'; size: number }
  | { kind: 'ambiguous' }
  | { kind: 'not-found' };

function parsePositiveInt(text: string | null): number | null {
  if (text === null) return null;
  const trimmed = text.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  const n = parseInt(trimmed, 10);
  return n > 0 ? n : null;
}

export function detectPositionSizeFromDOM(document: Document): PositionDetectResult {
  const nodes = document.querySelectorAll('[data-position-size]');

  if (nodes.length > 0) {
    const values = Array.from(nodes).map((el) => parsePositiveInt(el.textContent));
    const valid = values.filter((v): v is number => v !== null);

    if (valid.length === 0) return { kind: 'not-found' };

    const unique = new Set(valid);
    if (unique.size > 1) return { kind: 'ambiguous' };

    // All valid values agree (or there's exactly one)
    return { kind: 'found', size: valid[0] };
  }

  // Fallback: .position-size-value
  const fallback = document.querySelector('.position-size-value');
  if (fallback === null) return { kind: 'not-found' };

  const n = parsePositiveInt(fallback.textContent);
  if (n === null) return { kind: 'not-found' };
  return { kind: 'found', size: n };
}
