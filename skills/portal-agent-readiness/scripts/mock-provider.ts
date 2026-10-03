/** Deterministic provider for evals and local runs. No network. */

import type { LlmOutput } from "./schemas.js";
import type { LlmProvider } from "./provider.js";

export function createMockProvider(llm: LlmOutput): LlmProvider {
  return {
    async complete() {
      return llm;
    },
  };
}

export function createMockProviderFromLookup(
  lookup: (prompt: string) => LlmOutput,
): LlmProvider {
  return {
    async complete({ prompt }) {
      return lookup(prompt);
    },
  };
}
