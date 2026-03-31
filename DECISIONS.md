### Agent Thoughts

**Decision**: I chose to show agent thoughts as a collapsible trace within each task card (via expandable sections), collapsed by default.

**Reasoning**: Analysts primarily care about the final synthesized answer, but being able to drill into the chain of reasoning and intermediate thoughts builds trust that the AI is following a sensible process rather than hallucinating. Keeping this view opt‑in also preserves a clean, low‑noise surface for day‑to‑day analysis.

**Reconsider if**: Analysts report that “thoughts” distract from outcomes or raise compliance concerns, or if the content is too verbose/noisy to be useful. In that case I would hide thoughts behind a top-level “Developer/Trace Mode” toggle (or role-based access) and/or show only high-level planning steps instead of raw scratchpad text.

### Parallel Layout

**Decision**: I used a horizontal flex/grid layout for tasks that share a `parallel_group`, with single tasks rendered in the standard vertical flow.

**Reasoning**: Grouping parallel tasks side‑by‑side visually breaks the vertical timeline and signals that the work is happening concurrently, while still preserving top‑to‑bottom temporal ordering of groups. This makes it obvious which work is parallel fan‑out versus sequential follow‑up, without forcing users to learn a complex DAG visualization.

**Reconsider if**: The number of parallel tasks regularly exceeds the screen width (e.g., 6–12 tasks per group) or users misread side-by-side cards as a strict left-to-right sequence. If that happens I would switch to a dedicated “Parallel Block” container with a single group header, compact list rows, and an explicit “fan-out/fan-in” affordance to keep the reading order unambiguous.

### Partial Outputs

**Decision**: Partial outputs are streamed inline inside each task card and updated in place when the final `is_final: true` output arrives.

**Reasoning**: Inline streaming provides immediate feedback and “perceived speed” so analysts see progress even before synthesis completes, which is important for trust and UX in latency‑sensitive workflows. Replacing the partial content with the final answer avoids duplicate text and makes it clear which content is authoritative.

**Reconsider if**: Partial outputs are frequently low-quality or misleading (e.g., early numbers that change materially), causing confusion or incorrect takeaways. In that case I would move partial output into a “Live feed” subpanel (or logs), show a stronger “Draft” label, and only surface final outputs prominently.

### Cancelled State

**Decision**: Tasks cancelled with `reason: "sufficient_data"` are labeled as “System Optimized” and styled with a neutral blue/gray treatment rather than an error color.

**Reasoning**: In this case cancellation is evidence of the coordinator’s efficiency, not a failure, so it should not trigger the same visual alarm as an error. A neutral but distinct style lets users see that the task was intentionally skipped due to redundancy, reinforcing that the system is optimizing for cost and latency while still completing its obligations.

**Reconsider if**: Users interpret cancellations as “missing work” and lose confidence in completeness, especially when the cancelled task sounds important. If that happens I would (a) rename the label to “Skipped (Sufficient Evidence)”, (b) show a short explanation with the coordinator’s decision message, and (c) optionally link to which other tasks provided the sufficient data.

### Dependencies

**Decision**: Dependencies are resolved implicitly in the main view (e.g., a synthesis task only appears as running/complete after its prerequisites have fired), with optional textual hints when tasks depend on others.

**Reasoning**: For most analysts, it’s enough to know that synthesis completed successfully; that implicitly guarantees dependency resolution even if a sub‑task was optimized away. This keeps the primary UI lightweight while still allowing power users to infer or inspect dependencies via task ordering, parallel grouping, and optional trace/log details.

**Reconsider if**: Analysts need to audit provenance (e.g., “which filings/peers were actually used?”) or dependency-related confusion shows up in feedback (“why did synthesis start before X?”). In that case I would add a small “Waiting on: t_001, t_002…” chip while blocked, and on completion show a “Used inputs” list (including marking cancelled tasks as “not required”) to make the DAG implications explicit without drawing a full graph.

