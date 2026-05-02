import { useState, useEffect } from 'react';
import { ProgressBar } from './ProgressBar';

interface StatusViewProps {
  jobId: string | null;
  serverUrl?: string;
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

export function StatusView({ jobId, serverUrl = 'http://127.0.0.1:7777' }: StatusViewProps) {
  const [status, setStatus] = useState<StatusData | null>(null);

  useEffect(() => {
    if (!jobId) return;
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
