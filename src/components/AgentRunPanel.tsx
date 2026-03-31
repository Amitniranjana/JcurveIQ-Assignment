'use client';

import React, { useMemo } from 'react';
import { useAgentStream } from '@/hooks/useAgentStream';
import type { AgentEvent } from '@/types/events';
import type { TaskState } from '@/state/agentReducer';

type AgentRunPanelProps = {
  fixture: AgentEvent[];
  showThoughts: boolean;
};

function formatElapsed(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function statusBadge(task: TaskState) {
  const status = task.status;
  const optimized = status === 'cancelled_sufficient_data';
  const retrying = status === 'retrying';
  const failed = status === 'failed';
  const complete = status === 'complete';

  if (optimized) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2 py-0.5 text-[9px] font-medium uppercase tracking-wide text-sky-800">
        <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
        Task Optimized
      </span>
    );
  }

  if (retrying) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-medium uppercase tracking-wide text-amber-800">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
        Retrying
      </span>
    );
  }

  if (failed) {
    return (
      <span className="inline-flex items-center rounded-full bg-rose-100 px-2 py-0.5 text-[9px] font-medium uppercase tracking-wide text-rose-800">
        Failed
      </span>
    );
  }

  if (complete) {
    return (
      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-medium uppercase tracking-wide text-emerald-800 border border-emerald-200">
        Complete
      </span>
    );
  }

  if (status === 'running') {
    return (
      <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-medium uppercase tracking-wide text-emerald-800">
        Running
      </span>
    );
  }

  if (status === 'cancelled') {
    return (
      <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-medium uppercase tracking-wide text-slate-700">
        Cancelled
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-medium uppercase tracking-wide text-slate-700">
      Pending
    </span>
  );
}

function cardBorderClasses(task: TaskState) {
  const status = task.status;
  if (status === 'cancelled_sufficient_data') return 'border-sky-200 bg-sky-50/60';
  if (status === 'retrying') return 'border-amber-200 bg-amber-50/50';
  if (status === 'failed') return 'border-rose-200 bg-rose-50/40';
  if (status === 'complete') return 'border-emerald-200 bg-emerald-50/40';
  return 'border-slate-200 bg-white';
}

export const AgentRunPanel: React.FC<AgentRunPanelProps> = ({ fixture, showThoughts }) => {
  const { state, startRun, isRunning } = useAgentStream(fixture);

  const groups = useMemo(() => {
    return state.groupOrder.map((groupId) => {
      return state.parallelGroups[groupId]?.map((taskId) => state.tasks[taskId]).filter(Boolean) as TaskState[];
    });
  }, [state.groupOrder, state.parallelGroups, state.tasks]);

  return (
    <div className="flex flex-col gap-6 rounded-xl border border-slate-200 bg-slate-50/60 p-6 shadow-sm">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Run Query
          </div>
          <div className="text-sm font-semibold text-slate-900">{state.query ?? 'Awaiting query...'}</div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-50">
            <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400 ring-4 ring-emerald-400/40" />
            <span>Elapsed: {formatElapsed(state.elapsedMs)}</span>
          </div>

          <span
            className={[
              'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium',
              state.runStatus === 'running'
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                : state.runStatus === 'completed'
                  ? 'bg-sky-100 text-sky-800 border border-sky-200'
                  : state.runStatus === 'error'
                    ? 'bg-rose-100 text-rose-800 border border-rose-200'
                    : 'bg-slate-100 text-slate-700 border border-slate-200',
            ].join(' ')}
          >
            {state.runStatus === 'idle' && 'Idle'}
            {state.runStatus === 'running' && 'Running'}
            {state.runStatus === 'completed' && 'Complete'}
            {state.runStatus === 'error' && 'Failed'}
          </span>

          <button
            type="button"
            onClick={startRun}
            disabled={isRunning}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isRunning ? 'Running…' : 'Start Run'}
          </button>
        </div>
      </div>

      {/* Tasks */}
      <div className="space-y-4">
        {state.groupOrder.length === 0 && (
          <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-xs text-slate-500">
            No tasks yet. Start a run to visualize the agent pipeline.
          </div>
        )}

        {state.groupOrder.map((groupId, idx) => {
          const groupTasks = groups[idx] ?? [];
          const isParallelGroup = !groupId.startsWith('__single_');
          const gridClass = isParallelGroup ? 'grid gap-3 md:grid-cols-2 xl:grid-cols-3' : 'grid grid-cols-1';

          return (
            <div key={groupId} className={gridClass}>
              {groupTasks.map((task) => {
                const logs = task.logs.filter((l) => {
                  if (l.type === 'tool_call' || l.type === 'tool_result') return true;
                  if (l.type === 'agent_thought') return showThoughts;
                  return false;
                });

                return (
                  <div
                    key={task.id}
                    className={[
                      'flex flex-col gap-2 rounded-lg border p-3 text-xs shadow-sm',
                      cardBorderClasses(task),
                    ].join(' ')}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="text-[11px] font-semibold text-slate-900">{task.label ?? `Task ${task.id}`}</div>
                        <div className="text-[10px] font-medium uppercase tracking-wide text-slate-500">{task.agent ?? 'Unknown agent'}</div>
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        {statusBadge(task)}
                        {task.parallel_group && (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-medium uppercase tracking-wide text-slate-500">
                            Parallel {task.parallel_group}
                          </span>
                        )}
                      </div>
                    </div>

                    {task.partial_output?.content && (
                      <div className="mt-1 rounded-md bg-slate-900/95 px-2 py-1.5 text-[11px] text-slate-50">
                        <div className="mb-0.5 flex items-center justify-between text-[9px] font-medium uppercase tracking-wide text-slate-400">
                          <span>Streaming output</span>
                          <span>{task.partial_output.is_final ? 'Final' : 'Partial'}</span>
                        </div>
                        <div className="line-clamp-4 whitespace-pre-wrap">{task.partial_output.content}</div>
                      </div>
                    )}

                    {logs.length > 0 && (
                      <details className="mt-1 rounded-md bg-slate-50 px-2 py-1.5 text-[11px] text-slate-700">
                        <summary className="cursor-pointer text-[10px] font-medium uppercase tracking-wide text-slate-500">
                          Logs ({logs.length})
                        </summary>
                        <div className="mt-1 space-y-1">
                          {logs.map((log, i) => (
                            <div key={i} className="border-l border-slate-200 pl-2">
                              {log.type === 'tool_call' && (
                                <>
                                  <div className="text-[10px] font-semibold text-slate-700">
                                    {log.tool ?? 'Tool'}
                                    <span className="ml-1 text-[9px] font-normal text-slate-500">call</span>
                                  </div>
                                  {log.input_summary && <div className="text-[10px] text-slate-600">{log.input_summary}</div>}
                                </>
                              )}

                              {log.type === 'tool_result' && (
                                <>
                                  <div className="text-[10px] font-semibold text-slate-700">
                                    {log.tool ?? 'Tool'}
                                    <span className="ml-1 text-[9px] font-normal text-slate-500">result</span>
                                  </div>
                                  {log.output_summary && <div className="text-[10px] text-slate-600">{log.output_summary}</div>}
                                  {log.error && <div className="text-[10px] text-rose-700">{log.error}</div>}
                                </>
                              )}

                              {log.type === 'agent_thought' && (
                                <>
                                  <div className="text-[10px] font-semibold text-slate-700">
                                    {log.agent ?? 'Agent'}
                                    <span className="ml-1 text-[9px] font-normal text-slate-500">thought</span>
                                  </div>
                                  <div className="text-[10px] text-slate-600 whitespace-pre-wrap">
                                    {log.thought ?? log.content ?? ''}
                                  </div>
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                      </details>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Final Result */}
      {state.runStatus === 'completed' && state.final && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-500 text-sm font-bold text-white">
              ★
            </div>
            <div className="text-sm font-semibold uppercase tracking-wide text-amber-900">Synthesized Answer</div>
          </div>

          {state.final.summary && (
            <div className="mb-3 whitespace-pre-wrap rounded-md bg-white px-3 py-2 text-xs text-slate-900">
              {state.final.summary}
            </div>
          )}

          {Array.isArray(state.final.citations) && state.final.citations.length > 0 && (
            <div className="space-y-1">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-amber-900">Citations</div>
              <ul className="list-inside list-disc text-xs text-amber-900/90">
                {state.final.citations.map((c, idx) => (
                  <li key={idx}>
                    <span>{c.title}</span>
                    {c.url && (
                      <span className="ml-1 text-[11px] text-amber-800 underline">{c.url}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {state.runStatus === 'error' && (
        <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-5 shadow-sm">
          <div className="mb-2 text-sm font-semibold text-rose-900">Run Failed</div>
          <div className="text-xs text-slate-900/80">{state.errorMessage ?? 'Unknown error.'}</div>
        </div>
      )}
    </div>
  );
};

