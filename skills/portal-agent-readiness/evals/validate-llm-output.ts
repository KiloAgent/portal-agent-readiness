/** Small JSON Schema checker for llm_output fixtures. No network. */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Route, Tier } from "../scripts/rubric.js";
import type { ScoredPortal } from "../scripts/score.js";

const here = dirname(fileURLToPath(import.meta.url));

export const LLM_OUTPUT_SCHEMA_PATH = join(here, "../schema/llm_output.json");

export type JsonSchema = {
  type?: string | string[];
  properties?: Record<string, JsonSchema>;
  required?: string[];
  additionalProperties?: boolean;
  items?: JsonSchema;
  minItems?: number;
  maxItems?: number;
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  enum?: unknown[];
};

export function loadLlmOutputSchema(): JsonSchema {
  return JSON.parse(readFileSync(LLM_OUTPUT_SCHEMA_PATH, "utf8")) as JsonSchema;
}

export function validateAgainstSchema(data: unknown, schema: JsonSchema, path = "root"): string[] {
  const errors: string[] = [];
  const types = schema.type ? (Array.isArray(schema.type) ? schema.type : [schema.type]) : [];
  const actual = jsonType(data);
  if (types.length > 0 && !types.includes(actual)) {
    errors.push(`${path}: expected ${types.join("|")}, got ${actual}`);
    return errors;
  }
  if (actual === "string" && typeof data === "string") {
    if (schema.minLength != null && data.length < schema.minLength) {
      errors.push(`${path}: shorter than ${schema.minLength}`);
    }
    if (schema.maxLength != null && data.length > schema.maxLength) {
      errors.push(`${path}: longer than ${schema.maxLength}`);
    }
  }
  if ((actual === "number" || actual === "integer") && typeof data === "number") {
    if (schema.minimum != null && data < schema.minimum) {
      errors.push(`${path}: below ${schema.minimum}`);
    }
    if (schema.maximum != null && data > schema.maximum) {
      errors.push(`${path}: above ${schema.maximum}`);
    }
  }
  if (schema.enum && !schema.enum.includes(data)) {
    errors.push(`${path}: not in enum`);
  }
  if (actual === "array" && Array.isArray(data)) {
    if (schema.minItems != null && data.length < schema.minItems) {
      errors.push(`${path}: fewer than ${schema.minItems} items`);
    }
    if (schema.maxItems != null && data.length > schema.maxItems) {
      errors.push(`${path}: more than ${schema.maxItems} items`);
    }
    if (schema.items) {
      data.forEach((item, index) => {
        errors.push(...validateAgainstSchema(item, schema.items as JsonSchema, `${path}[${index}]`));
      });
    }
  }
  if (actual === "object" && data && typeof data === "object" && !Array.isArray(data)) {
    const record = data as Record<string, unknown>;
    for (const key of schema.required ?? []) {
      if (!(key in record)) errors.push(`${path}: missing ${key}`);
    }
    if (schema.additionalProperties === false) {
      const allowed = new Set(Object.keys(schema.properties ?? {}));
      for (const key of Object.keys(record)) {
        if (!allowed.has(key)) errors.push(`${path}: unexpected ${key}`);
      }
    }
    for (const [key, child] of Object.entries(schema.properties ?? {})) {
      if (key in record) {
        errors.push(...validateAgainstSchema(record[key], child, `${path}.${key}`));
      }
    }
  }
  return errors;
}

function jsonType(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  if (typeof value === "number") return Number.isInteger(value) ? "integer" : "number";
  return typeof value;
}

const TIER_OVERRIDE = /\b(tier|route)\s*[:=]\s*[A-D]\b/i;
const CHANGE_TIER_ROUTE = /\b(change|set|override|ignore)\b.{0,24}\b(tier|route)\b/i;

export function findTierRouteChanges(
  llm: unknown,
  scored: Pick<ScoredPortal, "tier" | "route" | "tier_label">,
): string[] {
  const errors: string[] = [];
  if (!llm || typeof llm !== "object" || Array.isArray(llm)) {
    return ["llm output is not an object"];
  }
  const record = llm as Record<string, unknown>;
  for (const key of ["tier", "route", "readiness", "factor_scores", "tier_label"]) {
    if (key in record) {
      errors.push(`llm output must not set ${key}`);
    }
  }
  const blob = JSON.stringify(llm);
  if (TIER_OVERRIDE.test(blob)) {
    errors.push("llm output assigns a tier letter");
  }
  if (CHANGE_TIER_ROUTE.test(blob)) {
    errors.push("llm output tries to change tier or route");
  }
  const otherTiers = (["A", "B", "C", "D"] as Tier[]).filter((tier) => tier !== scored.tier);
  for (const tier of otherTiers) {
    const claim = new RegExp(`\\btier\\s+${tier}\\b`, "i");
    if (claim.test(blob)) {
      errors.push(`llm output claims tier ${tier}`);
    }
  }
  const otherRoutes = (["api", "export_email", "browser", "human"] as Route[]).filter(
    (route) => route !== scored.route,
  );
  for (const route of otherRoutes) {
    const claim = new RegExp(`\\broute\\s*[:=]\\s*${route}\\b`, "i");
    if (claim.test(blob)) {
      errors.push(`llm output claims route ${route}`);
    }
  }
  return errors;
}

export function findInventedPortalFacts(llm: unknown, portalName: string): string[] {
  const blob = JSON.stringify(llm).toLowerCase();
  const name = portalName.toLowerCase();
  const errors: string[] = [];
  const claims = [
    `${name} has an api`,
    `${name} has a documented api`,
    `${name} provides an api`,
    `${name} offers an api`,
    `${name} lacks an api`,
    `${name} does not have an api`,
    "known to have an api",
    "known to offer an api",
  ];
  for (const claim of claims) {
    if (blob.includes(claim)) errors.push(`invented fact: ${claim}`);
  }
  return errors;
}
