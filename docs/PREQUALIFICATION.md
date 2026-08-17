# Prequalification

Prequalification is a **checklist assignment** with `checklist_type = contractor`. Create templates in `/app/settings/ehs/checklists`. Conduct them in the existing checklist runner.

Scoring uses `evaluatePrequalOutcome(score, { passPercent, conditionalPercent })`. If either threshold is unset, outcome is `unconfigured` — the engine will not assume 80/60.

Versions are stored on `contractor_prequalification_versions`. Status: draft → in_progress → passed | conditional | failed.
