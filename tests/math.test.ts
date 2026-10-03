import { describe, expect, it } from "vitest";
import {
  AD_HOC_ASSUMPTION,
  collectAssumptions,
  decideRoute,
  monthlyMinutes,
  readinessFromScores,
  scorePortal,
} from "../skills/portal-agent-readiness/scripts/index.js";

const base = {
  portal_name: "Test portal",
  task: "download weekly files and check they arrived",
  frequency: "weekly" as const,
  minutes_per_run: 60,
  can_ask_vendor: true,
};

describe("portal readiness math", () => {
  it("weights five factors onto a 0-100 scale", () => {
    expect(
      readinessFromScores({
        data_out: 5,
        data_in: 5,
        login: 5,
        terms_automation: 5,
        stability: 5,
      }),
    ).toBe(100);
  });

  it("scores documented API both ways as tier A and api", () => {
    const scored = scorePortal({
      ...base,
      login: "password_only",
      data_out: "api_documented",
      data_in: "api_documented",
      terms_automation: "allowed",
      ui_change_frequency: "rarely",
    });
    expect(scored.readiness).toBe(100);
    expect(scored.tier).toBe("A");
    expect(scored.route).toBe("api");
    expect(scored.hours_saved_month).toBe(3.5);
  });

  it("counts ad_hoc as 2 runs and lists the assumption", () => {
    expect(monthlyMinutes("ad_hoc", 30)).toBe(60);
    const assumptions = collectAssumptions({
      ...base,
      frequency: "ad_hoc",
      login: "unknown",
      data_out: "unknown",
      data_in: "unknown",
      terms_automation: "unsure",
      ui_change_frequency: "unknown",
    });
    expect(assumptions).toContain(AD_HOC_ASSUMPTION);
  });

  it("lets forbidden override an API tree match", () => {
    const scored = scorePortal({
      ...base,
      login: "password_only",
      data_out: "api_documented",
      data_in: "api_documented",
      terms_automation: "forbidden",
      ui_change_frequency: "rarely",
    });
    expect(scored.tier).toBe("D");
    expect(scored.route).toBe("human");
    expect(decideRoute(scored && {
      ...base,
      login: "password_only",
      data_out: "api_documented",
      data_in: "api_documented",
      terms_automation: "forbidden",
      ui_change_frequency: "rarely",
    })).toBe("human");
  });

  it("lets captcha override an API tree match and cap at C", () => {
    const scored = scorePortal({
      ...base,
      login: "captcha_on_login",
      data_out: "api_documented",
      data_in: "api_documented",
      terms_automation: "allowed",
      ui_change_frequency: "rarely",
    });
    expect(scored.readiness).toBe(75);
    expect(scored.tier).toBe("C");
    expect(scored.route).toBe("human");
  });

  it("does not raise a low captcha score to C", () => {
    const scored = scorePortal({
      ...base,
      login: "captcha_on_login",
      data_out: "none",
      data_in: "web_forms_only",
      terms_automation: "unsure",
      ui_change_frequency: "often",
    });
    expect(scored.tier).toBe("D");
    expect(scored.route).toBe("human");
  });
});
