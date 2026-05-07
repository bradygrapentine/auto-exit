import { useState, useEffect, useRef } from 'react';
import { ProgressBar } from './ProgressBar';

export interface TerminalStatus {
  jobId: string;
  filledTotal: number;
  initialPosition: number;
  ordersAttempted: number;
  startedAt?: string;
  finishedAt?: string;
  durationMs: number;
}

interface StatusViewProps {
  jobId: string | null;
  serverUrl?: string;
  onTerminal?: (status: TerminalStatus) => void;
}

interface StatusData {
  running: boolean;
  stopped?: boolean;
  filledTotal?: number;
  initialPosition?: number;
  ordersAttempted?: number;
  startedAt?: string;
  finishedAt?: string;
}

export function StatusView({ jobId, serverUrl = 'http://127.0.0.1:7777', onTerminal }: StatusViewProps) {
  const [status, setStatus] = useState<StatusData | null>(null);
  const firedRef = useRef(false);

  useEffect(() => {
    if (!jobId) return;
    firedRef.current = false;
    const poll = async () => {
      try {
        const res = await fetch(`${serverUrl}/status`);
        if (res.ok) setStatus(await res.json());
      } catch { /* engine offline */ }
    };
    poll();
    const id = setInterval(poll, 2000);
    return () => clearInterval(id);
  }, [jobId, serverUrl]);

  // Fire onTerminal exactly once when status transitions to terminal (stopped + !running).
  useEffect(() => {
    if (!jobId || !status || firedRef.current) return;
    if (!status.running && status.stopped) {
      firedRef.current = true;
      const startMs = status.startedAt ? new Date(status.startedAt).getTime() : Date.now();
      const endMs = status.finishedAt ? new Date(status.finishedAt).getTime() : Date.now();
      onTerminal?.({
        jobId,
        filledTotal: status.filledTotal ?? 0,
        initialPosition: status.initialPosition ?? 0,
        ordersAttempted: status.ordersAttempted ?? 0,
        startedAt: status.startedAt,
        finishedAt: status.finishedAt,
        durationMs: Math.max(0, endMs - startMs),
      });
    }
  }, [jobId, status, onTerminal]);

  if (!status || (!status.running && !status.stopped)) return null;

  const elapsedMs = status.startedAt
    ? (status.finishedAt ? new Date(status.finishedAt).getTime() : Date.now()) - new Date(status.startedAt).getTime()
    : undefined;

  return (
    <ProgressBar
      filled={status.filledTotal ?? 0}
      total={status.initialPosition ?? 0}
      chunksPlaced={status.ordersAttempted ?? 0}
      elapsedMs={elapsedMs}
    />
  );
}
