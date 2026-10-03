/** Single source of truth for Portal Readiness scoring. No package imports. */

export const SCORE_MIN = 0;
export const SCORE_MAX = 5;

export const FACTORS = {
  data_out: { weight: 0.25 },
  data_in: { weight: 0.15 },
  login: { weight: 0.25 },
  terms_automation: { weight: 0.2 },
  stability: { weight: 0.15 },
} as const;

export type ScoreFactor = keyof typeof FACTORS;

export const FREQUENCY = ["daily", "weekly", "monthly", "ad_hoc"] as const;
export type Frequency = (typeof FREQUENCY)[number];

/** Runs counted in a typical working month. ad_hoc is an assumption. */
export const RUNS_PER_MONTH: Record<Frequency, number> = {
  daily: 21,
  weekly: 4.33,
  monthly: 1,
  ad_hoc: 2,
};

export const AD_HOC_ASSUMPTION = "ad_hoc frequency is counted as 2 runs per month";

export const DATA_OUT = [
  "api_documented",
  "csv_or_pdf_export",
  "email_notifications",
  "copy_paste_only",
  "none",
  "unknown",
] as const;
export type DataOut = (typeof DATA_OUT)[number];

export const DATA_IN = [
  "api_documented",
  "file_upload",
  "web_forms_only",
  "none_needed",
  "unknown",
] as const;
export type DataIn = (typeof DATA_IN)[number];

export const LOGIN = [
  "password_only",
  "sso",
  "password_plus_sms",
  "password_plus_authenticator",
  "magic_link_email",
  "captcha_on_login",
  "unknown",
] as const;
export type Login = (typeof LOGIN)[number];

export const TERMS_AUTOMATION = ["allowed", "unsure", "forbidden"] as const;
export type TermsAutomation = (typeof TERMS_AUTOMATION)[number];

export const UI_CHANGE_FREQUENCY = ["rarely", "sometimes", "often", "unknown"] as const;
export type UiChangeFrequency = (typeof UI_CHANGE_FREQUENCY)[number];

export const DATA_OUT_SCORE: Record<DataOut, number> = {
  api_documented: 5,
  csv_or_pdf_export: 4,
  email_notifications: 3,
  copy_paste_only: 1,
  none: 0,
  unknown: 2,
};

export const DATA_IN_SCORE: Record<DataIn, number> = {
  api_documented: 5,
  file_upload: 4,
  none_needed: 5,
  web_forms_only: 2,
  unknown: 2,
};

export const LOGIN_SCORE: Record<Login, number> = {
  password_only: 5,
  sso: 4,
  magic_link_email: 4,
  password_plus_authenticator: 3,
  password_plus_sms: 2,
  captcha_on_login: 0,
  unknown: 2,
};

export const TERMS_SCORE: Record<TermsAutomation, number> = {
  allowed: 5,
  unsure: 2,
  forbidden: 0,
};

export const STABILITY_SCORE: Record<UiChangeFrequency, number> = {
  rarely: 5,
  sometimes: 3,
  often: 1,
  unknown: 2,
};

export const DATA_OUT_READ: Record<DataOut, string> = {
  api_documented: "Documented API for data out",
  csv_or_pdf_export: "CSV or PDF export",
  email_notifications: "Notification emails",
  copy_paste_only: "Copy and paste only",
  none: "No outbound data path",
  unknown: "Outbound path unknown",
};

export const DATA_IN_READ: Record<DataIn, string> = {
  api_documented: "Documented API for data in",
  file_upload: "File upload",
  none_needed: "No inbound data needed",
  web_forms_only: "Web forms only",
  unknown: "Inbound path unknown",
};

export const LOGIN_READ: Record<Login, string> = {
  password_only: "Password only",
  sso: "Single sign-on",
  magic_link_email: "Magic link by email",
  password_plus_authenticator: "Password plus authenticator",
  password_plus_sms: "Password plus SMS",
  captcha_on_login: "CAPTCHA on login",
  unknown: "Login method unknown",
};

export const TERMS_READ: Record<TermsAutomation, string> = {
  allowed: "Automation allowed",
  unsure: "Terms status unsure",
  forbidden: "Automation forbidden",
};

export const STABILITY_READ: Record<UiChangeFrequency, string> = {
  rarely: "UI changes rarely",
  sometimes: "UI changes sometimes",
  often: "UI changes often",
  unknown: "UI change frequency unknown",
};

export const TIERS = ["A", "B", "C", "D"] as const;
export type Tier = (typeof TIERS)[number];

export const TIER_LABEL: Record<Tier, string> = {
  A: "Agent-ready",
  B: "Ready with a workaround",
  C: "Possible but fragile",
  D: "Not a good candidate yet",
};

export const TIER_THRESHOLDS = {
  A: 75,
  B: 55,
  C: 35,
} as const;

export const ROUTES = ["api", "export_email", "browser", "human"] as const;
export type Route = (typeof ROUTES)[number];

export const ROUTE_LABEL: Record<Route, string> = {
  api: "API",
  export_email: "export and email",
  browser: "browser",
  human: "ask the vendor for sanctioned access",
};

export const ROUTE_PLAIN: Record<Route, string> = {
  api: "connect through its API",
  export_email: "work from its exports and notification emails",
  browser: "drive the web interface (the most fragile route)",
  human: "keep a person in the loop and ask the vendor for access",
};

export const AUTOMATION_SHARE: Record<Tier, number> = {
  A: 0.8,
  B: 0.6,
  C: 0.35,
  D: 0,
};

export const PORTAL_NAME_MIN = 2;
export const PORTAL_NAME_MAX = 80;
export const TASK_MIN = 15;
export const TASK_MAX = 300;
export const MINUTES_PER_RUN_MIN = 1;
export const MINUTES_PER_RUN_MAX = 480;
export const SUMMARY_MAX = 240;
export const WHY_ROUTE_MAX = 240;
export const SETUP_STEPS_MIN = 3;
export const SETUP_STEPS_MAX = 6;
export const HUMAN_CHECKPOINTS_MAX = 3;
export const PILOT_MAX = 160;
export const RISK_MAX = 120;
export const MITIGATION_MAX = 140;
export const QUESTIONS_MIN = 3;
export const QUESTIONS_MAX = 5;
export const VENDOR_MESSAGE_MAX = 900;

export type ScoringInput = {
  portal_name: string;
  portal_url?: string;
  task: string;
  frequency: Frequency;
  minutes_per_run: number;
  login: Login;
  data_out: DataOut;
  data_in: DataIn;
  terms_automation: TermsAutomation;
  ui_change_frequency: UiChangeFrequency;
  can_ask_vendor: boolean;
};

export type FactorScores = Record<ScoreFactor, number>;

export function monthlyMinutes(frequency: Frequency, minutesPerRun: number): number {
  return RUNS_PER_MONTH[frequency] * minutesPerRun;
}

export function factorScores(input: ScoringInput): FactorScores {
  return {
    data_out: DATA_OUT_SCORE[input.data_out],
    data_in: DATA_IN_SCORE[input.data_in],
    login: LOGIN_SCORE[input.login],
    terms_automation: TERMS_SCORE[input.terms_automation],
    stability: STABILITY_SCORE[input.ui_change_frequency],
  };
}

export function readinessFromScores(scores: FactorScores): number {
  const sum =
    FACTORS.data_out.weight * scores.data_out +
    FACTORS.data_in.weight * scores.data_in +
    FACTORS.login.weight * scores.login +
    FACTORS.terms_automation.weight * scores.terms_automation +
    FACTORS.stability.weight * scores.stability;
  return (sum / SCORE_MAX) * 100;
}

export function tierFromReadiness(readiness: number): Tier {
  if (readiness >= TIER_THRESHOLDS.A) return "A";
  if (readiness >= TIER_THRESHOLDS.B) return "B";
  if (readiness >= TIER_THRESHOLDS.C) return "C";
  return "D";
}

/** Hard rules override the score band. Forbidden forces D. CAPTCHA caps at C. */
export function applyTierHardRules(tier: Tier, input: ScoringInput): Tier {
  if (input.terms_automation === "forbidden") return "D";
  if (input.login === "captcha_on_login" && (tier === "A" || tier === "B")) return "C";
  return tier;
}

/**
 * Hard rules run first and win.
 * forbidden -> human (ask the vendor for sanctioned access).
 * captcha_on_login -> human.
 * Then the first matching tree step.
 */
export function decideRoute(input: ScoringInput): Route {
  if (input.terms_automation === "forbidden") return "human";
  if (input.login === "captcha_on_login") return "human";
  if (input.data_out === "api_documented" || input.data_in === "api_documented") return "api";
  if (input.data_out === "csv_or_pdf_export" || input.data_out === "email_notifications") {
    return "export_email";
  }
  return "browser";
}

export function automationShare(tier: Tier): number {
  return AUTOMATION_SHARE[tier];
}

export function hoursSavedMonth(monthlyMinutesValue: number, share: number): number {
  return round1((monthlyMinutesValue / 60) * share);
}

export function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

export function fallbackLlmOutput(input: ScoringInput, route: Route) {
  return fallbackByRoute(input, route);
}

function fallbackByRoute(input: ScoringInput, route: Route) {
  const task = input.task;
  const name = input.portal_name;
  if (route === "api") {
    return {
      summary: `Your answers point to a documented API for ${name}. Use that path for: ${task}.`,
      why_this_route:
        "Code chose the API route because data in or data out was marked as a documented API.",
      setup_steps: [
        "Ask the vendor for a dedicated service account and API credentials.",
        "Write down the one task the first job will do.",
        "Map that task to the documented endpoints or export calls.",
        "Run a supervised pilot on last week's work.",
        "Keep a person on the first week of live runs.",
      ],
      risks: [
        {
          risk: "The documented API may not cover this task.",
          mitigation: "Ask the vendor which endpoints cover it before building.",
        },
      ],
      human_checkpoints: ["Approve the first live run"],
      pilot: "Call one read-only endpoint for last week's items and compare to a manual run.",
      questions_for_vendor: [
        "Which endpoints cover this task?",
        "Can we have a dedicated service account?",
        "What are the rate limits and audit logs?",
        "Is file export still available if an endpoint is missing?",
      ],
      vendor_message_draft: vendorDraft(name, task, "API access or a documented export"),
    };
  }
  if (route === "export_email") {
    return {
      summary: `Your answers point to exports or notification emails for ${name}. Use those for: ${task}.`,
      why_this_route:
        "Code chose the export and email route because outbound data is an export or a notification email.",
      setup_steps: [
        "Turn on a scheduled CSV or PDF export, or a notification mailbox.",
        "Create a dedicated inbox or folder for those files.",
        "Write the rules for what the agent should do with each file.",
        "Act through an upload or a human step when the portal needs input.",
        "Run a supervised pilot on last week's export.",
      ],
      risks: [
        {
          risk: "An export format change would break the parse step.",
          mitigation: "Pin the export name and check the header row each run.",
        },
      ],
      human_checkpoints: ["Review the first parsed export"],
      pilot: "Parse last week's export and list the actions a person would take.",
      questions_for_vendor: [
        "Can we schedule a CSV or PDF export for this task?",
        "Can notification emails go to a dedicated mailbox?",
        "Is there a service account for exports?",
        "Do you offer an API we should use instead?",
      ],
      vendor_message_draft: vendorDraft(name, task, "a scheduled export or notification emails"),
    };
  }
  if (route === "browser") {
    return {
      summary: `Your answers point to driving the web UI of ${name}. That is the most fragile route for: ${task}.`,
      why_this_route:
        "Code chose the browser route because there is no documented API or export path in the answers.",
      setup_steps: [
        "Create a dedicated login used only for this job.",
        "Record the exact clicks for one run of the task.",
        "Flag any CAPTCHA, 2FA prompt, or layout change as a stop.",
        "Keep a person next to the first week of runs.",
        "Ask the vendor for a sanctioned API or export while the pilot runs.",
      ],
      risks: [
        {
          risk: "A UI change can break the run without warning.",
          mitigation: "Stop on unexpected screens and fall back to a person.",
        },
      ],
      human_checkpoints: ["Watch the first three live runs"],
      pilot: "Drive one supervised run of last week's work and write the stop rules.",
      questions_for_vendor: [
        "Is automation of this login allowed in the terms?",
        "Can we get a service account?",
        "Is there an API or scheduled export for this task?",
        "How often does the UI change?",
      ],
      vendor_message_draft: vendorDraft(name, task, "sanctioned API, export, or service-account access"),
    };
  }
  const captchaOnly = input.login === "captcha_on_login" && input.terms_automation !== "forbidden";
  return {
    summary: captchaOnly
      ? `Login uses a CAPTCHA, so keep a person on ${name} for: ${task}.`
      : `Your answers say ${name} is not a good candidate to drive yet. Keep a person on: ${task}.`,
    why_this_route: captchaOnly
      ? "Code chose the human-in-loop route because login uses a CAPTCHA."
      : "Code chose the human and vendor-request route because terms forbid automation.",
    setup_steps: [
      "Leave the live task with a person.",
      "Check the portal terms for automation and access rules.",
      "Ask the vendor for sanctioned API, export, or service-account access.",
      "Leave CAPTCHA, 2FA, and access controls in place.",
      "Re-run this check if the vendor grants a supported path.",
    ],
    risks: [
      {
        risk: "Driving the UI against the terms or a CAPTCHA would be unsanctioned.",
        mitigation: "Wait for vendor access and keep the work with a person.",
      },
    ],
    human_checkpoints: ["A person keeps the live task"],
    pilot: "Send the vendor message and keep this week's run manual.",
    questions_for_vendor: [
      "Is a dedicated service account available?",
      "Do you offer an API or scheduled export for this task?",
      "What access is allowed under the current terms?",
      "Who should we write to about sanctioned automation?",
    ],
    vendor_message_draft: vendorDraft(name, task, "sanctioned API, export, or service-account access"),
  };
}

function vendorDraft(portalName: string, task: string, ask: string): string {
  return [
    `Hello,`,
    ``,
    `We use ${portalName} to ${task}.`,
    ``,
    `Could you tell us whether ${ask} is available for this work? A dedicated service account and an audit trail would help us keep a person in review.`,
    ``,
    `Thank you,`,
    `[Your name]`,
  ].join("\n");
}
