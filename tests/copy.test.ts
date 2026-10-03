import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const skill = join(root, "skills/portal-agent-readiness");

function walk(dir: string, acc: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === "dist" || name === ".git") continue;
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, acc);
    else acc.push(path);
  }
  return acc;
}

const textFiles = walk(root).filter((path) => {
  if (path.includes(`${root}/tests/`)) return false;
  return /\.(md|ts|json|html|txt|yml|tmpl)$/.test(path);
});

describe("copy constraints", () => {
  it("uses hyphen-minus only", () => {
    for (const path of textFiles) {
      const text = readFileSync(path, "utf8");
      expect(text, path).not.toMatch(/[—–]/);
    }
  });

  it("has no Book or Cal link and no begehr.me", () => {
    for (const path of textFiles) {
      const text = readFileSync(path, "utf8");
      expect(text, path).not.toMatch(/cal\.com|calendly|book a call|begehr\.me/i);
    }
  });

  it("keeps scoring files free of package imports", () => {
    const rubric = readFileSync(join(skill, "scripts/rubric.ts"), "utf8");
    const score = readFileSync(join(skill, "scripts/score.ts"), "utf8");
    expect(rubric).not.toMatch(/^import /m);
    expect(score).toMatch(/^import \{[\s\S]*\} from "\.\/rubric\.js";/m);
    expect(score).not.toMatch(/from ["'](?!\.)/);
  });

  it("keeps email unsubscribe placeholders", () => {
    const html = readFileSync(join(skill, "email/delivery.html"), "utf8");
    const txt = readFileSync(join(skill, "email/delivery.txt"), "utf8");
    expect(html).toContain("{unsubscribe_link}");
    expect(txt).toContain("{unsubscribe_link}");
    expect(txt).toContain("List-Unsubscribe");
    expect(html).not.toMatch(/cal\.com|calendly|book a call|pricing/i);
    expect(txt).not.toMatch(/cal\.com|calendly|book a call|pricing/i);
  });
});
