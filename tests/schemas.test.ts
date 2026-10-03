import { describe, expect, it } from "vitest";
import { cleanText, parsePortalCheckInput } from "../skills/portal-agent-readiness/scripts/index.js";

const valid = {
  email: "ops@company.test",
  portal_name: "Supplier docs portal",
  task: "download COI certificates and check expiry",
  frequency: "weekly",
  minutes_per_run: 30,
  login: "password_only",
  data_out: "csv_or_pdf_export",
  data_in: "file_upload",
  terms_automation: "allowed",
  ui_change_frequency: "rarely",
  can_ask_vendor: true,
};

describe("portal check schemas", () => {
  it("rejects a short task after trim", () => {
    const parsed = parsePortalCheckInput({ ...valid, task: "too short" });
    expect(parsed.success).toBe(false);
  });

  it("rejects a filled honeypot", () => {
    const parsed = parsePortalCheckInput({ ...valid, honeypot: "bot" });
    expect(parsed.success).toBe(false);
  });

  it("rejects a non-https portal URL", () => {
    const parsed = parsePortalCheckInput({ ...valid, portal_url: "http://example.test" });
    expect(parsed.success).toBe(false);
  });

  it("accepts a valid payload and strips HTML", () => {
    const parsed = parsePortalCheckInput({
      ...valid,
      portal_name: "<b>Supplier docs portal</b>",
      task: "<i>download COI certificates and check expiry</i>",
      portal_url: "https://portal.example.test/app",
      honeypot: "",
    });
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(parsed.data.portal_name).toBe("Supplier docs portal");
    expect(parsed.data.task).toContain("download COI certificates");
    expect(parsed.data.task).not.toContain("<i>");
    expect(parsed.data.newsletter_optin).toBe(false);
    expect(parsed.data.portal_url).toBe("https://portal.example.test/app");
  });

  it("trims cleaned text to the max length", () => {
    expect(cleanText("  hello   world  ", 7)).toBe("hello w");
  });
});
