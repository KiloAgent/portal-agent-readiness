import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts", "skills/portal-agent-readiness/evals/**/*.test.ts"],
    environment: "node",
  },
});
