# AI agents

Agents are **prompt + tool allow-list + loop limits**, not autonomous workers.

| Key | Route | Scope |
|---|---|---|
| `copilot` | `/app/ai` | Workspace, entitled `ai_copilot` |
| `incident` | same chat with `agentKey` | `ai_incident_investigation` |
| `risk` | same | `ai_risk_intelligence` |
| `capa` | same | `ai_capa_intelligence` |
| `document` | same | `ai_document_copilot` |
| `executive` | `/app/executive/copilot` | `ai_executive_copilot` + executive/advanced analytics |
| `field` | `/field/ai` | Signed-in worker’s own records only |

## Loop limits

`maxToolCalls = 8`, `maxIterations = 6`, `timeoutMs = 45s`, `tokenBudget = 8000`.

AI SDK path uses `stopWhen: stepCountIs(maxIterations)`.

## Fallback

If the model is unavailable, `runDeterministicCopilot` still runs classified tools. It never fabricates records.
