# Workflow Architecture

## Generic state machine

Each module defines states and transitions in configuration (and for Phase 5, `ehs_events.status` with enforced transitions in the service layer).

## EHS Event workflow (Phase 5)

```
Draft → Submitted → Triage → Investigation → CAPA → Verification → Approval → Closed
                                                                    ↘ Reopened
```

Transitions check:
1. Permission (`incidents.transition` / role-specific)
2. Feature entitlement
3. Business rules (e.g. BR-001 CAPA closure gate)
4. Write audit + activity history
5. Fire notifications

## Business rules (initial)

- **BR-001:** Cannot close incident while required CAPA items remain unresolved unless EHS Manager accepts "No Action Required"
- **BR-002:** Severity ≥ threshold requires investigation
- **BR-003:** CAPA overdue escalation (scheduled job)
