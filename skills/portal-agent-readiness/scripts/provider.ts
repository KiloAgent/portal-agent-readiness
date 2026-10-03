/** Tiny model interface. The caller supplies the complete() implementation. */

import { appendValidationRetry, buildUserPrompt, SYSTEM_PROMPT } from "./prompts.js";
import { fallbackLlmOutput, type ScoringInput } from "./rubric.js";
import {
  formatZodError,
  parseLlmOutput,
  parsePortalCheckInput,
  scoringInputFromParsed,
  type LlmOutput,
  type PortalCheckInput,
  type PortalCheckResult,
} from "./schemas.js";
import { scorePortal, scorePortalCheck } from "./score.js";

export type LlmProvider = {
  complete(request: { system: string; prompt: string }): Promise<unknown>;
};

export type GenerateLlmOk = { ok: true; llm: LlmOutput; fallback: boolean };
export type GenerateLlmErr = { ok: false; error: "model_failed" };
export type GenerateLlmResult = GenerateLlmOk | GenerateLlmErr;

export type RunPortalCheckOk = { ok: true; result: PortalCheckResult };
export type RunPortalCheckErr = {
  ok: false;
  error: "invalid_input";
  detail?: string;
};
export type RunPortalCheckResult = RunPortalCheckOk | RunPortalCheckErr;

function coerceJson(raw: unknown): unknown {
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw);
    } catch {
      return undefined;
    }
  }
  return raw;
}

export function deterministicPlan(input: ScoringInput): LlmOutput {
  const scored = scorePortal(input);
  return fallbackLlmOutput(input, scored.route);
}

export async function generateLlmOutput(
  input: ScoringInput,
  provider: LlmProvider,
): Promise<GenerateLlmResult> {
  const scored = scorePortal(input);
  let prompt = buildUserPrompt(input, scored);
  for (let attempt = 0; attempt < 2; attempt++) {
    let raw: unknown;
    try {
      raw = await provider.complete({ system: SYSTEM_PROMPT, prompt });
    } catch {
      return { ok: true, llm: deterministicPlan(input), fallback: true };
    }
    const object = coerceJson(raw);
    if (object === undefined) {
      prompt = appendValidationRetry(prompt, "output is not valid JSON");
      continue;
    }
    const parsed = parseLlmOutput(object);
    if (parsed.success) return { ok: true, llm: parsed.data, fallback: false };
    prompt = appendValidationRetry(prompt, formatZodError(parsed.error));
  }
  return { ok: true, llm: deterministicPlan(input), fallback: true };
}

export async function runPortalCheck(args: {
  input: unknown;
  provider: LlmProvider;
  id?: string;
  created_at?: string;
  email_hash?: string;
  model?: string;
  cost_usd?: number;
}): Promise<RunPortalCheckResult> {
  const parsed = parsePortalCheckInput(args.input);
  if (!parsed.success) {
    return { ok: false, error: "invalid_input", detail: formatZodError(parsed.error) };
  }
  const scoringInput = scoringInputFromParsed(parsed.data);
  const generated = await generateLlmOutput(scoringInput, args.provider);
  if (!generated.ok) {
    return { ok: false, error: "invalid_input", detail: "model_failed" };
  }
  return {
    ok: true,
    result: scorePortalCheck({
      id: args.id ?? "local",
      created_at: args.created_at ?? new Date().toISOString(),
      email_hash: args.email_hash ?? "local",
      input: scoringInput,
      llm: generated.llm,
      model: generated.fallback ? "fallback" : (args.model ?? "user-provider"),
      cost_usd: args.cost_usd ?? 0,
    }),
  };
}

export type { PortalCheckInput };
