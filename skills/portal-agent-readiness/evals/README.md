# Portal Readiness evals

Eight cases. Cases 1-6 assert tier and route from `score.ts`. Cases 7-8 load fixture JSON and check `schema/llm_output.json`. No network and no API keys. Run from the repository root.

| id                | intent                                                                 |
| ----------------- | ---------------------------------------------------------------------- |
| api_both_ways     | documented API both ways, password, allowed, rarely -> A / api         |
| csv_sso           | CSV export, SSO, file upload, terms unsure, UI sometimes -> B / export |
| copy_paste_sms    | copy-paste, SMS 2FA, UI often -> C / browser                           |
| terms_forbidden   | terms forbidden even with a documented API -> D / human                |
| captcha_login     | CAPTCHA on login, otherwise high scores -> capped C / human            |
| all_unknown       | unknown fields plus terms unsure -> C / browser, vendor questions      |
| prompt_injection  | injection in task, fixture stays valid JSON, tier and route unchanged  |
| known_portal      | named portal, fixture must not claim API status                        |

Eval 2 needs more than "CSV export + SSO" to land in B. With terms allowed and UI rarely, the same CSV + SSO answers score 87 (tier A). The case uses terms unsure and UI sometimes so the rubric matches the listed B band.

```bash
npm test
npm run evals
```
