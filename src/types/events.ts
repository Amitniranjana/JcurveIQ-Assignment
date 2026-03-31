export type EventType =
  | "run_started"
  | "agent_thought"
  | "task_spawned"
  | "tool_call"
  | "tool_result"
  | "partial_output"
  | "task_update"
  | "run_complete"
  | "run_error";

export type TaskStatus = "running" | "complete" | "failed" | "cancelled";

export interface AgentEvent {
  type: EventType;
  timestamp: number;
  run_id?: string;
  task_id?: string | null;
  spawned_by?: string | null;
  query?: string;
  thought?: string;
  label?: string;
  agent?: string;
  parallel_group?: string | null;
  depends_on?: string[];
  tool?: string;
  input_summary?: string;
  output_summary?: string;
  content?: string;
  is_final?: boolean;
  quality_score?: number | null;
  status?: TaskStatus;
  reason?: string | null;
  message?: string | null;
  error?: string | null;
  output?: unknown;
  // run_complete specific
  duration_ms?: number;
  task_count?: number;
}

