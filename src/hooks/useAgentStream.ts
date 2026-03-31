'use client';

import { useEffect, useMemo, useReducer, useRef } from 'react';
import type { AgentEvent } from '@/types/events';
import {
  agentReducer,
  initialAgentRunState,
  type AgentRunState,
  type AgentStreamAction,
} from '@/state/agentReducer';

type UseAgentStreamResult = {
  state: AgentRunState;
  isRunning: boolean;
  startRun: () => void;
};

export function useAgentStream(fixture: AgentEvent[]): UseAgentStreamResult {
  const [state, dispatch] = useReducer(agentReducer, initialAgentRunState);

  const timeoutsRef = useRef<number[]>([]);
  const intervalRef = useRef<number | null>(null);

  const startRun = () => {
    // Cleanup any previous in-flight timers.
    timeoutsRef.current.forEach((t) => window.clearTimeout(t));
    timeoutsRef.current = [];
    if (intervalRef.current != null) window.clearInterval(intervalRef.current);
    intervalRef.current = null;

    dispatch({ type: 'reset' } as AgentStreamAction);

    fixture.forEach((event, index) => {
      const t = window.setTimeout(() => {
        dispatch({
          type: 'event',
          event,
          receivedAt: Date.now(),
        } as AgentStreamAction);
      }, index * 1500);
      timeoutsRef.current.push(t);
    });
  };

  const shouldTick = useMemo(
    () => state.runStatus === 'running',
    [state.runStatus],
  );

  useEffect(() => {
    if (!shouldTick) return;

    intervalRef.current = window.setInterval(() => {
      dispatch({ type: 'tick', now: Date.now() } as AgentStreamAction);
    }, 250);

    return () => {
      if (intervalRef.current != null) window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
  }, [shouldTick]);

  const isRunning = state.runStatus === 'running';
  return { state, isRunning, startRun };
}

