# AI security

## Tenant isolation

- RLS on every `ai_*` table uses `is_org_member(organization_id)`.
- Field conversations (`scope = field`) are **owner-only**, including vs org `ai.admin`.
- Tools always bind `organizationId` from the session. Cross-tenant phrasing is classified as `forbidden_cross_tenant` and never executed.

## Authorization order

1. Session + org membership  
2. Feature entitlements (`ai_copilot`, specialist codes) — no plan-name checks  
3. RBAC (`ai.use`, `ai.suggest`, `ai.approve`, `ai.evaluate`, `ai.admin`) plus module permissions on wrapped engines  
4. Tool allow-list for the agent/persona  
5. Model / deterministic runner  

The LLM does not enforce the org boundary.

## Write path

- Drafts insert as `status = pending`, `ai_generated = true`.
- RLS insert check requires `status = pending`.
- Updates require `ai.approve`.
- Application code rejects `actorType = agent`. There is no `approve_suggestion` tool.

## Untrusted retrieval

Retrieved document text is wrapped in `<untrusted_document>` and labeled as data. System prompts are assembled separately and never concatenated *from* retrieved text.

## Secrets

Provider keys are server-only (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_GENERATIVE_AI_API_KEY`, `AZURE_OPENAI_*`, `AI_GATEWAY_API_KEY`). Nothing is `NEXT_PUBLIC_`.

## Observability

`/admin/ai/observability` is platform-admin only (`saas.ai.observability`). Customer org admins use `ai.admin` inside their tenant.
