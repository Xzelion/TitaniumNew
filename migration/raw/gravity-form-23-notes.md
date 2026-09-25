# Gravity Form 23 — Customer Satisfaction Questionnaire (2026-09-24)

- Export: `titanium-gf23-export.json`
- Public page: https://titanium.com/customer-satisfaction-survey/
- Linked from Quality Systems as **Customer Satisfaction Survey** button
- Model schema in Payload; **do not enable live public submit** without human OK (same rule as Form 20)
- Draft `/customer-satisfaction-survey/` private page to host the modeled form
- Update FLAGS: Form 23 export received; submit still off

## Model
- Saved as `migration/raw/gravity-form-23.json` and modeled at `migration/forms/gravity-form-23.model.json`.
- 26 fields, 3 notifications, 1 confirmation. Submit label is Submit.
- Public submit stays off until a person says to turn it on.
- The export has no hCaptcha field. Honeypot is off. There is no file upload.
- Notification delivery is recorded and marked needs_keys. Nothing is emailed.
- The private draft `/customer-satisfaction-survey/` locks the form. It does not submit it.
