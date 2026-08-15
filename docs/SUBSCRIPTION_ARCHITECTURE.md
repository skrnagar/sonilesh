# Subscription & Entitlement Architecture

## Principle

Plans, features, and limits are **database-driven**. Application code never switches on hard-coded plan names.

## Resolution order

For feature/limit `X` on organization `O`:

1. Active temporary override (if any)
2. Permanent organization feature override
3. Current subscription → plan_features
4. Default deny / zero

## Entitlement service API

```ts
hasFeature(organizationId, featureCode): Promise<boolean>
getLimit(organizationId, limitCode): Promise<number | null> // null = unlimited
checkLimit(organizationId, limitCode, requestedUsage): Promise<{ allowed: boolean; remaining: number | null }>
```

## Limit codes

`max_users`, `max_sites`, `max_projects`, `max_storage_mb`, `max_contractors`,
`max_documents`, `max_monthly_reports`, `max_api_calls`

## Feature codes

Include `incident_management`, `near_miss`, `hazard_reporting`, `risk_assessment`,
`jsa`, `jha`, `permit_to_work`, `inspections`, `audits`, `capa`, `training`,
`contractor_management`, `ppe_management`, `chemical_sds`, `document_control`,
`moc`, `toolbox_talks`, `advanced_reports`, `scheduled_reports`, `api_access`,
`sso`, `hrms_integration`, `whatsapp_notifications`, `sms_notifications`,
`ai_copilot`, `advanced_analytics`, `custom_branding`, `multi_business_unit`,
`multi_site`, `custom_workflows`

## UX

Disabled features show a professional upgrade/unavailable state — never broken pages.
