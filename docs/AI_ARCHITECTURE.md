# AI architecture (Phase 14)

SONIL EHS360 Copilot is an **authorized tool layer** over existing EHS engines. It is not a ChatGPT clone and not a greenfield agent app.

## Principles

- Permissions, entitlements, and tenant scope are applied **before** context reaches a model.
- Tools receive server-side `organization_id` / `user_id`. Model-supplied IDs are stripped.
- Read tools wrap existing services (`events`, `capa`, `permits`, `risk`, `documents`, `dashboard`, …).
- Write tools create **drafts** in `ai_suggestions` with `AI_GENERATED`. Humans Approve / Edit / Reject.
- AI cannot approve its own recommendation, approve a permit, close an incident/CAPA, change a risk rating, suspend a worker, publish a policy, approve MOC, or change certification validity.

## Layout

```
src/lib/ai/
  core/          types, loop limits, auth context
  models/        AIProvider + AIModelRouter (CHAT, RAG, SUMMARIZATION, EXTRACTION,
                 CLASSIFICATION, RCA, ANALYSIS, REPORT_GENERATION, AGENT_EXECUTION)
  prompts/       versioned system prompts
  tools/         read + draft write executors
  agents/        copilot / field / executive definitions
  retrieval/     query classification + hybrid plan
  citations/     no fabricated sources
  permissions/   pre-model gating
  guardrails/    injection, rate limit, redaction
  evaluation/    lightweight probes
  audit/         tool calls + usage events
```

## Runtime

1. `/app/ai` and `/api/ai/chat` build `AIAuthContext` from the session.
2. Query classification chooses structured tools vs document search.
3. If no provider key is configured, the deterministic runner still executes authorized tools and returns records + citations.
4. If a key exists, Vercel AI SDK `streamText` + `tool()` + `stopWhen: stepCountIs(N)` is used. Secrets stay server-side.

## Provider abstraction

Business logic never imports a single vendor. `AIModelRouter` selects gateway / OpenAI / Azure (OpenAI-compatible) / Anthropic / Google from env.

## Data

See migration `20260326000050_ai_copilot_phase14.sql`. Conversations, messages, sources, tool calls, prompt templates, suggestions, RAG corpus, and `prediction_*` registry tables (language: **potential risk signal** only).
