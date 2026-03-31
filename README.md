## JcurveIQ Agent Run Panel

This is the assessment implementation for the JcurveIQ Agent Run Panel. It uses **Next.js (App Router)**, **React hooks**, and **Tailwind CSS** to visualise a multi-agent run in real time from local fixtures.

### Run locally

```bash
npm install
npm run dev
```

Then open `http://localhost:3000` in your browser.

### Fixtures and mock stream

- Fixture files live in **`src/fixtures`**:
  - `run_success.json`
  - `run_error.json`
- The same fixtures are mirrored under **`mock/fixtures`** to match the folder layout suggested in the PDF.
- The hook `src/hooks/useAgentStream.ts` replays a given fixture with realistic timing using `setTimeout` and a reducer-based state machine in `src/state/agentReducer.ts`.

### Switching fixtures in the UI

On the home page:

- Use the **“Success fixture / Error fixture”** toggle at the top of the panel to switch between `run_success` and `run_error`.
- Click **“Start Run”** inside the panel to watch the stream play out.

### Agent thoughts visibility

- At the top of the page there is a **“Show agent thoughts”** checkbox.
- When checked, `agent_thought` events appear inside the collapsible **Logs** section for each task as a “collapsible trace”.
- When unchecked, only tool calls/results are shown, keeping the view focused for analysts.
