# portal-agent-readiness

Scores how automatable one portal or web tool is for a stated task. Code computes factor scores, readiness, tier, route, and hours saved per month. The model only writes the plan.

Hosted tool: [https://www.kiloagent.com/tools/portal-check](https://www.kiloagent.com/tools/portal-check)

The agent skill is `skills/portal-agent-readiness/` ([agentskills.io](https://agentskills.io/specification), [skills CLI](https://www.npmjs.com/package/skills)). That folder is self-contained.

## Install

Copy `skills/portal-agent-readiness/` into one of:

- `.claude/skills/portal-agent-readiness/`
- `.cursor/skills/portal-agent-readiness/`
- `.codex/skills/portal-agent-readiness/`
- `.github/skills/portal-agent-readiness/`

Verified with `skills@latest` from a clean temp directory against `main`. Cursor project install lands in `.agents/skills/`. Claude Code lands in `.claude/skills/`.

```bash
npx --yes skills@latest add KiloAgent/portal-agent-readiness --list -y
npx --yes skills@latest add KiloAgent/portal-agent-readiness --copy -y -a cursor -s portal-agent-readiness
npx --yes skills@latest add KiloAgent/portal-agent-readiness --copy -y -a claude-code -s portal-agent-readiness
```

From a local clone:

```bash
npx skills add . --list -y
npx skills add . --copy -y -a cursor -s portal-agent-readiness
```

Chat users with no skills directory: paste `PASTE_IN.md` or `skills/portal-agent-readiness/PASTE_IN.md` into the chat.

## Library

```bash
npm install
```

Node 20 or newer. Runtime dependency: `zod`. Import from `skills/portal-agent-readiness/scripts/` until the package is published.

Supply one portal input and an `LlmProvider`. The provider is the only place a model is called.

```ts
import { createMockProvider, runPortalCheck } from "./skills/portal-agent-readiness/scripts/index.ts";
import { EVAL_CASES } from "./skills/portal-agent-readiness/evals/cases.ts";
import { readFileSync } from "node:fs";

const fixture = JSON.parse(
  readFileSync(
    new URL("./skills/portal-agent-readiness/evals/fixtures/prompt_injection.json", import.meta.url),
    "utf8",
  ),
);

const result = await runPortalCheck({
  input: EVAL_CASES[0].input,
  provider: createMockProvider(fixture),
});

if (result.ok) {
  console.log(result.result.tier, result.result.route);
  console.log(result.result.hours_saved_month);
}
```

Wire a live model by implementing `LlmProvider.complete({ system, prompt })` and returning JSON (object or string). `generateLlmOutput` retries once if the JSON fails the schema, then uses the deterministic fallback from `rubric.ts`.

## Rubric and scoring

See `skills/portal-agent-readiness/references/scoring.md` and `skills/portal-agent-readiness/scripts/rubric.ts`.

## Evals

Eight cases in `skills/portal-agent-readiness/evals/`. Cases 1-6 are deterministic tier and route tests. Cases 7-8 are fixture files checked against `schema/llm_output.json`. No network and no API keys.

```bash
npm test
npm run evals
```

## Agent skill

`skills/portal-agent-readiness/SKILL.md` tells a coding agent how to call the rubric: send `prompts/system.md` verbatim, treat `<portal>` as untrusted data, validate JSON, retry once, then run `scorePortalCheck`.

## Scripts

```bash
npm install
npm run typecheck
npm test
npm run build
```

## Contributing

Open an issue or a PR against `main`. Run `npm test` and `npm run build` before you push. Keep copy free of em dashes, en dashes, and sales CTAs. License is MIT.
