import { useEffect, useRef } from 'react';

interface UsePollingOptions {
  enabled: boolean;
  interval?: number;
  onPoll: () => void | Promise<void>;
  onStop?: () => void;
}

export const usePolling = ({
  enabled,
  interval = 500,
  onPoll,
  onStop,
}: UsePollingOptions) => {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onPollRef = useRef(onPoll);
  const onStopRef = useRef(onStop);

  onPollRef.current = onPoll;
  onStopRef.current = onStop;

  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        onStopRef.current?.();
      }
      return;
    }

    const poll = async () => {
      try {
        await onPollRef.current();
      } catch (error) {
        console.error('Polling error:', error);
      }
    };

    // Initial poll
    poll();

    // Set up interval
    intervalRef.current = setInterval(poll, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, interval]);
};

