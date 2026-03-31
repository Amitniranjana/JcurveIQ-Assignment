### Agent Thoughts

**Decision**: I chose to show agent thoughts as a collapsible trace within each task card (via expandable sections), collapsed by default.

**Reasoning**: Analysts primarily care about the final synthesized answer, but being able to drill into the chain of reasoning and intermediate thoughts builds trust that the AI is following a sensible process rather than hallucinating. Keeping this view opt‑in also preserves a clean, low‑noise surface for day‑to‑day analysis.

### Parallel Layout

**Decision**: I used a horizontal flex/grid layout for tasks that share a `parallel_group`, with single tasks rendered in the standard vertical flow.

**Reasoning**: Grouping parallel tasks side‑by‑side visually breaks the vertical timeline and signals that the work is happening concurrently, while still preserving top‑to‑bottom temporal ordering of groups. This makes it obvious which work is parallel fan‑out versus sequential follow‑up, without forcing users to learn a complex DAG visualization.

### Partial Outputs

**Decision**: Partial outputs are streamed inline inside each task card and updated in place when the final `is_final: true` output arrives.

**Reasoning**: Inline streaming provides immediate feedback and “perceived speed” so analysts see progress even before synthesis completes, which is important for trust and UX in latency‑sensitive workflows. Replacing the partial content with the final answer avoids duplicate text and makes it clear which content is authoritative.

### Cancelled State

**Decision**: Tasks cancelled with `reason: "sufficient_data"` are labeled as “System Optimized” and styled with a neutral blue/gray treatment rather than an error color.

**Reasoning**: In this case cancellation is evidence of the coordinator’s efficiency, not a failure, so it should not trigger the same visual alarm as an error. A neutral but distinct style lets users see that the task was intentionally skipped due to redundancy, reinforcing that the system is optimizing for cost and latency while still completing its obligations.

### Dependencies

**Decision**: Dependencies are resolved implicitly in the main view (e.g., a synthesis task only appears as running/complete after its prerequisites have fired), with optional textual hints when tasks depend on others.

**Reasoning**: For most analysts, it’s enough to know that synthesis completed successfully; that implicitly guarantees dependency resolution even if a sub‑task was optimized away. This keeps the primary UI lightweight while still allowing power users to infer or inspect dependencies via task ordering, parallel grouping, and optional trace/log details.

