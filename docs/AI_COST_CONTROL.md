# AI cost control

- Loop caps: 6 iterations, 8 tool calls, 8k output-token budget, 45s timeout.  
- Rate limits per user/org hour.  
- Cheaper models for CLASSIFICATION / SUMMARIZATION via `AIModelRouter` + `AI_MODEL_*` env.  
- Usage written to `ai_usage_events` (tokens in/out, provider, model).  
- Platform observability: `/admin/ai/observability`.  
- Deterministic fallback avoids spend when keys are missing.

Estimated cost cents are reserved on the usage table; live price tables are not hard-coded.
