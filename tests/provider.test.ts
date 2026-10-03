import { describe, expect, it } from "vitest";
import { EVAL_CASES } from "../skills/portal-agent-readiness/evals/cases.js";
import {
  generateLlmOutput,
  scorePortal,
  scoringInputFromParsed,
  type LlmProvider,
} from "../skills/portal-agent-readiness/scripts/index.js";

const fixture = {
  summary: "Answers point to a documented API for this weekly certificate job.",
  why_this_route: "Software chose the API route because data in or data out is a documented API.",
  setup_steps: [
    "Ask for a dedicated service account.",
    "Map the task to one endpoint.",
    "Run a supervised pilot on last week.",
    "Keep a person on the first live week.",
  ],
  risks: [
    {
      risk: "The documented API may not cover expiry checks.",
      mitigation: "Ask the vendor which endpoint covers expiry before building.",
    },
  ],
  human_checkpoints: ["Approve the first live run"],
  pilot: "Call one read-only endpoint and compare to a manual run.",
  questions_for_vendor: [
    "Which endpoints cover this task?",
    "Can we have a dedicated service account?",
    "What are the rate limits?",
  ],
  vendor_message_draft:
    "Hello,\n\nWe use this portal to download COI certificates and check expiry. Is API access available?\n\nThank you,\n[Your name]",
};

describe("generateLlmOutput", () => {
  const input = scoringInputFromParsed(EVAL_CASES[0].input);

  it("retries once when the first JSON fails validation", async () => {
    let calls = 0;
    const provider: LlmProvider = {
      async complete() {
        calls += 1;
        if (calls === 1) return { summary: "bad" };
        return fixture;
      },
    };
    const generated = await generateLlmOutput(input, provider);
    expect(calls).toBe(2);
    expect(generated.ok).toBe(true);
    if (!generated.ok) return;
    expect(generated.fallback).toBe(false);
    expect(generated.llm.summary).toContain("documented API");
  });

  it("falls back when the provider throws", async () => {
    const provider: LlmProvider = {
      async complete() {
        throw new Error("network");
      },
    };
    const generated = await generateLlmOutput(input, provider);
    expect(generated.ok).toBe(true);
    if (!generated.ok) return;
    expect(generated.fallback).toBe(true);
    const scored = scorePortal(input);
    expect(generated.llm.why_this_route.toLowerCase()).toContain("api");
    expect(scored.route).toBe("api");
  });

  it("falls back after two invalid payloads", async () => {
    const provider: LlmProvider = {
      async complete() {
        return { summary: "still bad" };
      },
    };
    const generated = await generateLlmOutput(input, provider);
    expect(generated.ok).toBe(true);
    if (!generated.ok) return;
    expect(generated.fallback).toBe(true);
  });
});
