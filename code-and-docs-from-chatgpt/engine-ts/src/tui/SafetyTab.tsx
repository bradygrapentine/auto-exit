import React, { useState } from 'react';
import { Box, Text, useInput, useStdin } from 'ink';
import { getSafety, removeForbiddenTicker } from '../safety.js';
import type { ForbiddenEntry, SafetyConfig } from '../types.js';

export function SafetyTab() {
  const [safety, setSafetyState] = useState<SafetyConfig>(() => getSafety());
  const [cursor, setCursor] = useState(0);
  const [msg, setMsg] = useState<string | undefined>();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const stdinInfo = useStdin();
  const isInteractive = stdinInfo.isRawModeSupported;

  useInput(
    (input, key) => {
      const entries: ForbiddenEntry[] = safety.forbiddenTickers;
      if (key.upArrow) {
        setCursor((c) => Math.max(0, c - 1));
      } else if (key.downArrow) {
        setCursor((c) => Math.min(Math.max(0, entries.length - 1), c + 1));
      } else if (input === 'd' || input === 'D') {
        const entry = entries[cursor];
        if (entry) {
          try {
            removeForbiddenTicker(entry.ticker);
            const updated = getSafety();
            setSafetyState(updated);
            setCursor((c) => Math.min(c, Math.max(0, updated.forbiddenTickers.length - 1)));
            setMsg(`removed ${entry.ticker}`);
            setErrorMsg(null);
          } catch (e) {
            setErrorMsg(e instanceof Error ? e.message : 'Failed to remove ticker');
          }
        }
      }
    },
    { isActive: isInteractive },
  );

  const entries = safety.forbiddenTickers;

  return (
    <Box marginTop={1} paddingX={1} borderStyle="round" borderColor="white" flexDirection="column">
      <Text bold>Safety config</Text>
      <Box marginTop={1} flexDirection="column">
        <Text>safetySubmittedMultiple: <Text bold>{safety.safetySubmittedMultiple}</Text></Text>
        <Text>floorPriceCents:         <Text bold>{safety.floorPriceCents}</Text></Text>
        <Text>tailSweepThreshold:      <Text bold>{safety.tailSweepThreshold}</Text></Text>
      </Box>
      <Box marginTop={1} flexDirection="column">
        <Text bold>Forbidden tickers ({entries.length})</Text>
        {entries.length === 0 ? (
          <Text color="gray">(none)</Text>
        ) : (
          <>
            <Box>
              <Text color="gray">{'  '}{padRight('ticker', 36)}{padRight('addedBy', 8)}{padRight('addedAt', 22)}reason</Text>
            </Box>
            {entries.map((e, i) => (
              <Box key={e.ticker}>
                <Text color={i === cursor ? 'cyan' : undefined}>{i === cursor ? '▶ ' : '  '}</Text>
                <Text inverse={i === cursor}>{padRight(e.ticker, 36)}</Text>
                <Text>{padRight(e.addedBy, 8)}</Text>
                <Text>{padRight(e.addedAt.slice(0, 19), 22)}</Text>
                <Text>{e.reason}</Text>
              </Box>
            ))}
          </>
        )}
      </Box>
      {msg && <Box marginTop={1}><Text color="green">{msg}</Text></Box>}
      {errorMsg && <Box marginTop={1}><Text color="red">{errorMsg}</Text></Box>}
      <Box marginTop={1}><Text color="gray">[↑↓] select   [d] remove highlighted   [1-4/a/5] tabs</Text></Box>
    </Box>
  );
}

function padRight(s: string, n: number): string {
  return s.length >= n ? s.slice(0, n) : s + ' '.repeat(n - s.length);
}
