'use client';

import { useState } from "react";
import type { AgentEvent } from "@/types/events";
import runSuccess from "@/fixtures/run_success.json";
import runError from "@/fixtures/run_error.json";
import { AgentRunPanel } from "@/components/AgentRunPanel";

const successFixture = runSuccess as unknown as AgentEvent[];
const errorFixture = runError as unknown as AgentEvent[];

export default function Home() {
  const [variant, setVariant] = useState<"success" | "error">("success");
  const [showThoughts, setShowThoughts] = useState(true);

  const fixture = variant === "success" ? successFixture : errorFixture;

  return (
    <div className="min-h-screen bg-zinc-50 p-6 font-sans dark:bg-black">
      <div className="mx-auto w-full max-w-5xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white/80 px-4 py-3 text-xs text-slate-700">
          <div className="space-y-0.5">
            <div className="font-semibold text-slate-900">
              JcurveIQ Agent Run Panel
            </div>
            <div className="text-[11px] text-slate-500">
              Toggle between a successful run and an error run, and choose whether to show planner thoughts.
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex overflow-hidden rounded-full border border-slate-200 bg-slate-50">
              <button
                type="button"
                onClick={() => setVariant("success")}
                className={`px-3 py-1.5 text-[11px] font-medium ${
                  variant === "success"
                    ? "bg-slate-900 text-slate-50"
                    : "text-slate-600"
                }`}
              >
                Success fixture
              </button>
              <button
                type="button"
                onClick={() => setVariant("error")}
                className={`px-3 py-1.5 text-[11px] font-medium ${
                  variant === "error"
                    ? "bg-slate-900 text-slate-50"
                    : "text-slate-600"
                }`}
              >
                Error fixture
              </button>
            </div>
            <label className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-medium text-slate-700">
              <input
                type="checkbox"
                className="h-3 w-3 rounded border-slate-300 text-slate-900"
                checked={showThoughts}
                onChange={(e) => setShowThoughts(e.target.checked)}
              />
              Show agent thoughts
            </label>
          </div>
        </div>

        <AgentRunPanel fixture={fixture} showThoughts={showThoughts} />
      </div>
    </div>
  );
}
