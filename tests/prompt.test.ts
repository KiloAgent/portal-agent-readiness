import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  SYSTEM_PROMPT,
  USER_PROMPT_TEMPLATE,
  buildUserPrompt,
  scorePortal,
} from "../skills/portal-agent-readiness/scripts/index.js";

const here = dirname(fileURLToPath(import.meta.url));
const skill = join(here, "../skills/portal-agent-readiness");

describe("system prompt", () => {
  it("keeps the system prompt file in sync", () => {
    const md = readFileSync(join(skill, "prompts/system.md"), "utf8").trim();
    expect(md).toBe(SYSTEM_PROMPT.trim());
  });

  it("keeps the user template file in sync", () => {
    const tmpl = readFileSync(join(skill, "prompts/user.md.tmpl"), "utf8").trim();
    expect(tmpl).toBe(USER_PROMPT_TEMPLATE.trim());
  });

  it("uses hyphen-minus only in the prompt", () => {
    expect(SYSTEM_PROMPT).not.toMatch(/[—–]/);
    expect(USER_PROMPT_TEMPLATE).not.toMatch(/[—–]/);
  });

  it("puts scored facts outside the untrusted portal block", () => {
    const input = {
      portal_name: "Supplier docs portal",
      task: "download COI certificates and check expiry",
      frequency: "weekly" as const,
      minutes_per_run: 60,
      login: "password_only" as const,
      data_out: "api_documented" as const,
      data_in: "api_documented" as const,
      terms_automation: "allowed" as const,
      ui_change_frequency: "rarely" as const,
      can_ask_vendor: true,
    };
    const prompt = buildUserPrompt(input, scorePortal(input));
    expect(prompt).toContain("tier: A");
    expect(prompt).toContain("route: api");
    expect(prompt).toContain("<portal>");
    expect(prompt).toContain("download COI certificates");
  });
});
