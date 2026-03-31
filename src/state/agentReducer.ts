import type { AgentEvent } from "@/types/events";

export type RunStatus = "idle" | "running" | "completed" | "error";

export type TaskRuntimeStatus =
  | "spawned"
  | "running"
  | "retrying"
  | "failed"
  | "complete"
  | "cancelled_sufficient_data"
  | "cancelled";

export type CancellationReason = string | null;

export type TaskState = {
  id: string;
  label?: string;
  agent?: string;
  parallel_group?: string | null;
  depends_on?: string[];
  status: TaskRuntimeStatus;
  cancellation_reason?: CancellationReason;
  failure_reason?: string | null;
  partial_output?: {
    content?: string;
    is_final?: boolean;
  };
  logs: AgentEvent[]; // tool_calls + tool_results + agent_thoughts
};

export type AgentRunState = {
  runStatus: RunStatus;
  startedAt: number | null; // wall-clock ms when run_started was received
  elapsedMs: number;

  query?: string;
  errorMessage?: string;
  final?: {
    summary?: string;
    citations?: { title: string; url?: string }[];
    output?: unknown;
  };

  tasks: Record<string, TaskState>;
  parallelGroups: Record<string, string[]>; // groupId -> taskIds
  groupOrder: string[]; // rendering order of groups
  taskOrder: string[]; // rendering order by first spawn
};

export type AgentStreamAction =
  | { type: "reset" }
  | {
      type: "event";
      event: AgentEvent;
      receivedAt: number; // wall-clock ms
    }
  | { type: "tick"; now: number };

const optimizedCancellationReason = "sufficient_data";

function isRetryReason(reason: string | null | undefined): boolean {
  if (!reason) return false;
  return reason.toLowerCase().includes("retry");
}

function groupIdForTask(taskId: string, parallel_group?: string | null) {
  if (parallel_group && parallel_group !== "") return parallel_group;
  return `__single_${taskId}`;
}

export const initialAgentRunState: AgentRunState = {
  runStatus: "idle",
  startedAt: null,
  elapsedMs: 0,
  query: undefined,
  errorMessage: undefined,
  final: undefined,
  tasks: {},
  parallelGroups: {},
  groupOrder: [],
  taskOrder: [],
};

export function agentReducer(
  state: AgentRunState,
  action: AgentStreamAction,
): AgentRunState {
  switch (action.type) {
    case "reset":
      return { ...initialAgentRunState };

    case "tick": {
      if (state.runStatus !== "running" || state.startedAt == null) return state;
      return {
        ...state,
        elapsedMs: Math.max(0, action.now - state.startedAt),
      };
    }

    case "event": {
      const e = action.event;

      if (e.type === "run_started") {
        return {
          ...state,
          runStatus: "running",
          startedAt: action.receivedAt,
          elapsedMs: 0,
          query: e.query,
          errorMessage: undefined,
          final: undefined,
          tasks: {},
          parallelGroups: {},
          groupOrder: [],
          taskOrder: [],
        };
      }

      if (e.type === "run_complete") {
        const maybeAny = e as AgentEvent & {
          summary?: string;
          citations?: { title: string; url?: string }[];
          output?: unknown;
        };

        const out = maybeAny.output;
        const outObj = out && typeof out === "object" ? (out as Record<string, unknown>) : null;
        const outSummary =
          typeof outObj?.summary === "string" ? (outObj.summary as string) : undefined;
        const outCitations = Array.isArray(outObj?.citations) ? (outObj.citations as { title: string; url?: string }[]) : undefined;

        return {
          ...state,
          runStatus: "completed",
          final: {
            summary: maybeAny.summary ?? outSummary ?? maybeAny.content,
            citations: maybeAny.citations ?? outCitations,
            output: maybeAny.output,
          },
        };
      }

      if (e.type === "run_error") {
        const maybeAny = e as AgentEvent & {
          error_message?: string;
          output?: unknown;
        };

        return {
          ...state,
          runStatus: "error",
          errorMessage: maybeAny.error_message ?? maybeAny.error ?? "Run failed.",
        };
      }

      const taskId = e.task_id ?? null;

      if (!taskId && e.type !== "task_spawned") {
        return state;
      }

      if (e.type === "task_spawned") {
        const id = e.task_id ?? null;
        if (!id) return state;

        const groupId = groupIdForTask(id, e.parallel_group);
        const nextParallelGroups = { ...state.parallelGroups };
        const nextTasks = { ...state.tasks };
        const nextGroupOrder = [...state.groupOrder];
        const nextTaskOrder = [...state.taskOrder];

        if (!nextParallelGroups[groupId]) {
          nextParallelGroups[groupId] = [];
          nextGroupOrder.push(groupId);
        }

        if (!nextTasks[id]) {
          nextTaskOrder.push(id);
        }

        const existingIds = nextParallelGroups[groupId];
        if (!existingIds.includes(id)) {
          existingIds.push(id);
        }

        nextTasks[id] = {
          id,
          label: e.label,
          agent: e.agent,
          parallel_group: e.parallel_group ?? null,
          depends_on: e.depends_on ?? [],
          status: "spawned",
          cancellation_reason: null,
          failure_reason: null,
          partial_output: undefined,
          logs: [],
        };

        return {
          ...state,
          parallelGroups: nextParallelGroups,
          groupOrder: nextGroupOrder,
          taskOrder: nextTaskOrder,
          tasks: nextTasks,
        };
      }

      if (!taskId) return state;
      const existing = state.tasks[taskId];
      if (!existing) return state;

      if (e.type === "task_update" && e.status) {
        const nextTasks = { ...state.tasks };
        const next: TaskState = { ...existing };

        const reason = e.reason ?? null;
        if (e.status === "running") {
          next.status = "running";
          next.failure_reason = null;
        } else if (e.status === "complete") {
          next.status = "complete";
          next.failure_reason = null;
        } else if (e.status === "failed") {
          if (isRetryReason(reason)) {
            next.status = "retrying";
            next.failure_reason = reason;
          } else {
            next.status = "failed";
            next.failure_reason = reason;
          }
        } else if (e.status === "cancelled") {
          if (reason === optimizedCancellationReason) {
            next.status = "cancelled_sufficient_data";
            next.cancellation_reason = reason;
          } else {
            next.status = "cancelled";
            next.cancellation_reason = reason;
          }
        }

        nextTasks[taskId] = next;
        return { ...state, tasks: nextTasks };
      }

      if (e.type === "partial_output") {
        const nextTasks = { ...state.tasks };
        const next = { ...existing };
        next.partial_output = { content: e.content, is_final: e.is_final };
        nextTasks[taskId] = next;
        return { ...state, tasks: nextTasks };
      }

      if (e.type === "agent_thought") {
        const nextTasks = { ...state.tasks };
        const next = { ...existing, logs: [...existing.logs, e] };
        nextTasks[taskId] = next;
        return { ...state, tasks: nextTasks };
      }

      if (e.type === "tool_call" || e.type === "tool_result") {
        const nextTasks = { ...state.tasks };
        const next = { ...existing, logs: [...existing.logs, e] };
        nextTasks[taskId] = next;
        return { ...state, tasks: nextTasks };
      }

      return state;
    }
    default:
      return state;
  }
}

