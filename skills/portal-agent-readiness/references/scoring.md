# Scoring

Code scores five factors from the user's answers. The model does not set these numbers.

| Factor            | Weight | Mapping                                                                 |
| ----------------- | ------ | ----------------------------------------------------------------------- |
| data_out          | 0.25   | api_documented 5, csv_or_pdf_export 4, email_notifications 3, unknown 2, copy_paste_only 1, none 0 |
| data_in           | 0.15   | api_documented 5, none_needed 5, file_upload 4, web_forms_only 2, unknown 2 |
| login             | 0.25   | password_only 5, sso 4, magic_link_email 4, password_plus_authenticator 3, password_plus_sms 2, unknown 2, captcha_on_login 0 |
| terms_automation  | 0.20   | allowed 5, unsure 2, forbidden 0                                        |
| stability         | 0.15   | rarely 5, sometimes 3, unknown 2, often 1                               |

`readiness = sum(weight * score) / 5 * 100`

Tiers from readiness, then hard rules:

- A >= 75 Agent-ready (share 0.8)
- B 55-74 Ready with a workaround (share 0.6)
- C 35-54 Possible but fragile (share 0.35)
- D < 35 Not a good candidate yet (share 0)
- `terms_automation = forbidden` forces tier D
- `login = captcha_on_login` caps the tier at C

Route, hard rules first, then first match:

1. forbidden or captcha_on_login -> human (ask the vendor for sanctioned access)
2. data_out or data_in is api_documented -> api
3. data_out is csv_or_pdf_export or email_notifications -> export_email
4. otherwise -> browser

- Runs per month: daily 21, weekly 4.33, monthly 1, ad_hoc 2 (listed as an assumption)
- `hours_saved_month = monthly_minutes / 60 * share`, one decimal
- Portal URL is stored only. v1 does not fetch it.
