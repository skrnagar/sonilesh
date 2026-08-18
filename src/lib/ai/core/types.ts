export const AI_FEATURE_CODES = [
  "ai_copilot",
  "ai_incident_investigation",
  "ai_risk_intelligence",
  "ai_capa_intelligence",
  "ai_document_copilot",
  "ai_executive_copilot",
] as const;

export type AIFeatureCode = (typeof AI_FEATURE_CODES)[number];

export const AI_MODEL_TASKS = [
  "CHAT",
  "RAG",
  "SUMMARIZATION",
  "EXTRACTION",
  "CLASSIFICATION",
  "RCA",
  "ANALYSIS",
  "REPORT_GENERATION",
  "AGENT_EXECUTION",
] as const;

export type AIModelTask = (typeof AI_MODEL_TASKS)[number];

export const AI_PROVIDERS = ["gateway", "openai", "azure", "anthropic", "google"] as const;
export type AIProviderName = (typeof AI_PROVIDERS)[number];

export const AI_AGENT_KEYS = [
  "copilot",
  "incident",
  "risk",
  "capa",
  "document",
  "executive",
  "field",
] as const;
export type AIAgentKey = (typeof AI_AGENT_KEYS)[number];

export const AI_SCOPES = ["workspace", "field", "executive", "admin"] as const;
export type AIScope = (typeof AI_SCOPES)[number];

export const WRITE_TOOL_NAMES = [
  "draft_capa",
  "draft_action",
  "draft_incident_summary",
  "draft_investigation_notes",
  "draft_risk_note",
  "draft_document_summary",
] as const;
export type WriteToolName = (typeof WRITE_TOOL_NAMES)[number];

export const FORBIDDEN_AUTONOMOUS_ACTIONS = [
  "approve_permit",
  "close_incident",
  "close_capa",
  "change_risk_rating",
  "suspend_worker",
  "suspend_contractor",
  "approve_compliance",
  "publish_policy",
  "approve_moc",
  "change_certification_validity",
  "approve_suggestion",
] as const;

export type AICitation = {
  sourceType: string;
  sourceId?: string | null;
  title: string;
  excerpt?: string | null;
  href?: string | null;
  confidence?: number | null;
  isCurrent?: boolean;
};

export type AIToolResult = {
  ok: boolean;
  tool: string;
  denied?: boolean;
  error?: string;
  data?: unknown;
  citations?: AICitation[];
  insufficientEvidence?: boolean;
};

export type DeterministicAnswer = {
  mode: "deterministic" | "unavailable";
  text: string;
  confidence: number | null;
  citations: AICitation[];
  toolResults: AIToolResult[];
  suggestionsCreated: Array<{ id: string; type: string; title: string }>;
};
