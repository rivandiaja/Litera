import { useEffect, useRef } from "react";

interface UseIndexingPollingOptions {
  enabled: boolean;
  onPoll: () => void | Promise<void>;
  intervalMs?: number;
}

export function useIndexingPolling({ enabled, onPoll, intervalMs = 3_000 }: UseIndexingPollingOptions) {
  const onPollRef = useRef(onPoll);

  useEffect(() => {
    onPollRef.current = onPoll;
  }, [onPoll]);

  useEffect(() => {
    if (!enabled) return undefined;

    const intervalId = window.setInterval(() => {
      void onPollRef.current();
    }, intervalMs);

    return () => window.clearInterval(intervalId);
  }, [enabled, intervalMs]);
}
