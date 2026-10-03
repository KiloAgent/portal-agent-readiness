/** Pure scoring: this file does the math. No package imports. */

import {
  AD_HOC_ASSUMPTION,
  TIER_LABEL,
  applyTierHardRules,
  automationShare,
  decideRoute,
  factorScores,
  hoursSavedMonth,
  monthlyMinutes,
  readinessFromScores,
  round1,
  tierFromReadiness,
  type FactorScores,
  type Route,
  type ScoringInput,
  type Tier,
} from "./rubric.js";

export type ScoredPortal = {
  readiness: number;
  tier: Tier;
  tier_label: string;
  route: Route;
  factor_scores: FactorScores;
  hours_saved_month: number;
  assumptions: string[];
};

export type LlmPlan = {
  summary: string;
  why_this_route: string;
  setup_steps: string[];
  risks: Array<{ risk: string; mitigation: string }>;
  human_checkpoints: string[];
  pilot: string;
  questions_for_vendor: string[];
  vendor_message_draft: string;
};

export type BuiltPortalResult = {
  id: string;
  created_at: string;
  email_hash: string;
  portal_name: string;
  task: string;
  readiness: number;
  tier: Tier;
  tier_label: string;
  route: Route;
  factor_scores: FactorScores;
  hours_saved_month: number;
  assumptions: string[];
  summary: string;
  why_this_route: string;
  setup_steps: string[];
  risks: Array<{ risk: string; mitigation: string }>;
  human_checkpoints: string[];
  pilot: string;
  questions_for_vendor: string[];
  vendor_message_draft: string;
  model: string;
  cost_usd: number;
};

export type ScorePortalCheckArgs = {
  id: string;
  created_at: string;
  email_hash: string;
  input: ScoringInput;
  llm: LlmPlan;
  model: string;
  cost_usd: number;
};

export function collectAssumptions(input: ScoringInput): string[] {
  const assumptions = [
    "Estimates only, based on your inputs",
    "We did not test the portal",
    "Daily frequency is counted as 21 runs per month",
    "Weekly frequency is counted as 4.33 runs per month",
    "Hours use share by tier: A 0.8, B 0.6, C 0.35, D 0",
  ];
  if (input.frequency === "ad_hoc") {
    assumptions.push(AD_HOC_ASSUMPTION);
  }
  return assumptions;
}

export function scorePortal(input: ScoringInput): ScoredPortal {
  const scores = factorScores(input);
  const readiness = round1(readinessFromScores(scores));
  const rawTier = tierFromReadiness(readiness);
  const tier = applyTierHardRules(rawTier, input);
  const route = decideRoute(input);
  const minutes = monthlyMinutes(input.frequency, input.minutes_per_run);
  const share = automationShare(tier);
  return {
    readiness,
    tier,
    tier_label: TIER_LABEL[tier],
    route,
    factor_scores: scores,
    hours_saved_month: hoursSavedMonth(minutes, share),
    assumptions: collectAssumptions(input),
  };
}

export function scorePortalCheck(args: ScorePortalCheckArgs): BuiltPortalResult {
  const scored = scorePortal(args.input);
  return {
    id: args.id,
    created_at: args.created_at,
    email_hash: args.email_hash,
    portal_name: args.input.portal_name,
    task: args.input.task,
    readiness: scored.readiness,
    tier: scored.tier,
    tier_label: scored.tier_label,
    route: scored.route,
    factor_scores: scored.factor_scores,
    hours_saved_month: scored.hours_saved_month,
    assumptions: scored.assumptions,
    summary: args.llm.summary,
    why_this_route: args.llm.why_this_route,
    setup_steps: args.llm.setup_steps,
    risks: args.llm.risks,
    human_checkpoints: args.llm.human_checkpoints,
    pilot: args.llm.pilot,
    questions_for_vendor: args.llm.questions_for_vendor,
    vendor_message_draft: args.llm.vendor_message_draft,
    model: args.model,
    cost_usd: args.cost_usd,
  };
}
