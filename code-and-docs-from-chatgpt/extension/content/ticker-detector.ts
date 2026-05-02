export function detectTickerFromPath(pathname: string): string | null {
  const segments = pathname.split('/').filter(Boolean);
  for (const segment of segments) {
    if (segment.startsWith('KX')) {
      return segment;
    }
  }
  return null;
}

export function detectTickerFromDOM(document: Document): string | null {
  const el =
    document.querySelector('[data-market-ticker]') ||
    document.querySelector('h1[data-testid="market-header-title"]') ||
    document.querySelector('.market-title');
  if (!el) return null;
  const text = el.textContent?.trim() ?? null;
  return text || null;
}

export function detectTicker(pathname: string, document: Document): string | null {
  return detectTickerFromPath(pathname) ?? detectTickerFromDOM(document);
}
