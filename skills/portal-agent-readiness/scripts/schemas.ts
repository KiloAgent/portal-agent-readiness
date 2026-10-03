/** Zod schemas for Portal Readiness input, LLM output, and scored results. No app imports. */

import { z } from "zod";
import {
  DATA_IN,
  DATA_OUT,
  FREQUENCY,
  HUMAN_CHECKPOINTS_MAX,
  LOGIN,
  MINUTES_PER_RUN_MAX,
  MINUTES_PER_RUN_MIN,
  MITIGATION_MAX,
  PILOT_MAX,
  PORTAL_NAME_MAX,
  PORTAL_NAME_MIN,
  QUESTIONS_MAX,
  QUESTIONS_MIN,
  RISK_MAX,
  ROUTES,
  SETUP_STEPS_MAX,
  SETUP_STEPS_MIN,
  SUMMARY_MAX,
  TASK_MAX,
  TASK_MIN,
  TERMS_AUTOMATION,
  TIERS,
  TIER_LABEL,
  UI_CHANGE_FREQUENCY,
  VENDOR_MESSAGE_MAX,
  WHY_ROUTE_MAX,
} from "./rubric.js";
import { cleanOptionalText, cleanText } from "./sanitize.js";

export const frequencySchema = z.enum(FREQUENCY);
export const loginSchema = z.enum(LOGIN);
export const dataOutSchema = z.enum(DATA_OUT);
export const dataInSchema = z.enum(DATA_IN);
export const termsSchema = z.enum(TERMS_AUTOMATION);
export const uiChangeSchema = z.enum(UI_CHANGE_FREQUENCY);
export const tierSchema = z.enum(TIERS);
export const routeSchema = z.enum(ROUTES);

const httpsUrl = z
  .string()
  .trim()
  .refine((value) => value === "" || /^https:\/\/.+/i.test(value), "portal_url must be an https URL")
  .transform((value) => (value === "" ? undefined : value));

export const portalCheckInputSchema = z.object({
  email: z.email(),
  portal_name: z
    .string()
    .transform((value) => cleanText(value, PORTAL_NAME_MAX))
    .pipe(z.string().min(PORTAL_NAME_MIN).max(PORTAL_NAME_MAX)),
  portal_url: httpsUrl.optional(),
  task: z
    .string()
    .transform((value) => cleanText(value, TASK_MAX))
    .pipe(z.string().min(TASK_MIN).max(TASK_MAX)),
  frequency: frequencySchema,
  minutes_per_run: z.coerce.number().int().min(MINUTES_PER_RUN_MIN).max(MINUTES_PER_RUN_MAX),
  login: loginSchema,
  data_out: dataOutSchema,
  data_in: dataInSchema,
  terms_automation: termsSchema,
  ui_change_frequency: uiChangeSchema,
  can_ask_vendor: z.boolean(),
  newsletter_optin: z.boolean().optional().default(false),
  honeypot: z
    .unknown()
    .optional()
    .transform((value) => (value == null ? "" : String(value)))
    .pipe(z.literal("")),
});

const shortStep = z.string().trim().min(1).max(160);

export const llmRiskSchema = z.object({
  risk: z
    .string()
    .transform((value) => cleanText(value, RISK_MAX))
    .pipe(z.string().min(1).max(RISK_MAX)),
  mitigation: z
    .string()
    .transform((value) => cleanText(value, MITIGATION_MAX))
    .pipe(z.string().min(1).max(MITIGATION_MAX)),
});

export const llmOutputSchema = z.object({
  summary: z
    .string()
    .transform((value) => cleanText(value, SUMMARY_MAX))
    .pipe(z.string().min(1).max(SUMMARY_MAX)),
  why_this_route: z
    .string()
    .transform((value) => cleanText(value, WHY_ROUTE_MAX))
    .pipe(z.string().min(1).max(WHY_ROUTE_MAX)),
  setup_steps: z.array(shortStep).min(SETUP_STEPS_MIN).max(SETUP_STEPS_MAX),
  risks: z.array(llmRiskSchema).min(0),
  human_checkpoints: z.array(shortStep).min(0).max(HUMAN_CHECKPOINTS_MAX),
  pilot: z
    .string()
    .transform((value) => cleanText(value, PILOT_MAX))
    .pipe(z.string().min(1).max(PILOT_MAX)),
  questions_for_vendor: z.array(shortStep).min(QUESTIONS_MIN).max(QUESTIONS_MAX),
  vendor_message_draft: z
    .string()
    .transform((value) => cleanText(value, VENDOR_MESSAGE_MAX))
    .pipe(z.string().min(1).max(VENDOR_MESSAGE_MAX)),
});

export const factorScoresSchema = z.object({
  data_out: z.number().int().min(0).max(5),
  data_in: z.number().int().min(0).max(5),
  login: z.number().int().min(0).max(5),
  terms_automation: z.number().int().min(0).max(5),
  stability: z.number().int().min(0).max(5),
});

export const portalCheckResultSchema = z.object({
  id: z.string().min(1),
  created_at: z.string().min(1),
  email_hash: z.string().min(1),
  portal_name: z.string().min(PORTAL_NAME_MIN).max(PORTAL_NAME_MAX),
  task: z.string().min(TASK_MIN).max(TASK_MAX),
  readiness: z.number().min(0).max(100),
  tier: tierSchema,
  tier_label: z.enum([TIER_LABEL.A, TIER_LABEL.B, TIER_LABEL.C, TIER_LABEL.D]),
  route: routeSchema,
  factor_scores: factorScoresSchema,
  hours_saved_month: z.number().nonnegative(),
  assumptions: z.array(z.string()),
  summary: z.string().min(1).max(SUMMARY_MAX),
  why_this_route: z.string().min(1).max(WHY_ROUTE_MAX),
  setup_steps: z.array(z.string()).min(SETUP_STEPS_MIN).max(SETUP_STEPS_MAX),
  risks: z.array(llmRiskSchema),
  human_checkpoints: z.array(z.string()).max(HUMAN_CHECKPOINTS_MAX),
  pilot: z.string().min(1).max(PILOT_MAX),
  questions_for_vendor: z.array(z.string()).min(QUESTIONS_MIN).max(QUESTIONS_MAX),
  vendor_message_draft: z.string().min(1).max(VENDOR_MESSAGE_MAX),
  model: z.string().min(1),
  cost_usd: z.number().nonnegative(),
});

export type PortalCheckInput = z.infer<typeof portalCheckInputSchema>;
export type LlmOutput = z.infer<typeof llmOutputSchema>;
export type PortalCheckResult = z.infer<typeof portalCheckResultSchema>;

export function parsePortalCheckInput(raw: unknown) {
  return portalCheckInputSchema.safeParse(raw);
}

export function parseLlmOutput(raw: unknown) {
  return llmOutputSchema.safeParse(raw);
}

export function parsePortalCheckResult(raw: unknown) {
  return portalCheckResultSchema.safeParse(raw);
}

export function formatZodError(error: z.ZodError): string {
  return error.issues
    .map((issue) => `${issue.path.join(".") || "root"}: ${issue.message}`)
    .join("; ");
}

export function scoringInputFromParsed(input: PortalCheckInput) {
  return {
    portal_name: input.portal_name,
    portal_url: input.portal_url,
    task: input.task,
    frequency: input.frequency,
    minutes_per_run: input.minutes_per_run,
    login: input.login,
    data_out: input.data_out,
    data_in: input.data_in,
    terms_automation: input.terms_automation,
    ui_change_frequency: input.ui_change_frequency,
    can_ask_vendor: input.can_ask_vendor,
  };
}
