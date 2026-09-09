'use client';

import { useEffect, useState } from 'react';

interface TimerProps {
  isRunning: boolean;
  onTick?: (ms: number) => void;
}

export function useTimer() {
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);

  const start = () => {
    setStartTime(Date.now());
    setElapsed(0);
  };

  const stop = (): number => {
    if (!startTime) return 0;
    const ms = Date.now() - startTime;
    setElapsed(ms);
    setStartTime(null);
    return ms;
  };

  const reset = () => {
    setStartTime(null);
    setElapsed(0);
  };

  useEffect(() => {
    if (!startTime) return;
    const interval = setInterval(() => {
      setElapsed(Date.now() - startTime);
    }, 100);
    return () => clearInterval(interval);
  }, [startTime]);

  return { elapsed, start, stop, reset, isRunning: startTime !== null };
}

export function TimerDisplay({ elapsed }: { elapsed: number }) {
  const seconds = Math.floor(elapsed / 1000);
  const ms = Math.floor((elapsed % 1000) / 100);

  return (
    <div className="flex items-center gap-2 text-surface-500">
      <div className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
      <span className="font-mono text-sm font-medium tabular-nums">
        {seconds}.{ms}s
      </span>
    </div>
  );
}
