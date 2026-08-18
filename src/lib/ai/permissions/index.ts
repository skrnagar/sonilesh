import type { AIAgentKey, AIFeatureCode, AIScope } from "@/lib/ai/core/types";
import { FORBIDDEN_AUTONOMOUS_ACTIONS, WRITE_TOOL_NAMES } from "@/lib/ai/core/types";

export type AIAuthContext = {
  organizationId: string;
  userId: string;
  siteId: string | null;
  projectId: string | null;
  permissions: string[];
  entitlements: string[];
  isPlatformAdmin: boolean;
  scope: AIScope;
  agentKey: AIAgentKey;
};

export const TOOL_REQUIREMENTS: Record<
  string,
  { permission?: string; feature?: string; entitlement?: AIFeatureCode; write?: boolean }
> = {
  query_incidents: { permission: "incidents.view", feature: "incident_management", entitlement: "ai_copilot" },
  get_incident: { permission: "incidents.view", feature: "incident_management", entitlement: "ai_incident_investigation" },
  query_risks: { permission: "risk.view", feature: "risk_assessment", entitlement: "ai_risk_intelligence" },
  query_permits: { permission: "permits.view", feature: "permit_to_work", entitlement: "ai_copilot" },
  query_inspections: { permission: "inspections.view", feature: "inspections", entitlement: "ai_copilot" },
  query_audits: { permission: "audits.view", feature: "audits", entitlement: "ai_copilot" },
  query_findings: { permission: "findings.view", feature: "inspections", entitlement: "ai_copilot" },
  query_capa: { permission: "capa.view", feature: "capa", entitlement: "ai_capa_intelligence" },
  query_training: { permission: "training.view", feature: "training", entitlement: "ai_copilot" },
  query_certifications: { permission: "training.view", feature: "training", entitlement: "ai_copilot" },
  query_contractors: { permission: "contractors.view", feature: "contractor_management", entitlement: "ai_copilot" },
  query_compliance: { permission: "compliance.view", feature: "regulatory_compliance", entitlement: "ai_copilot" },
  query_documents: { permission: "documents.view", feature: "document_control", entitlement: "ai_document_copilot" },
  query_sds: { permission: "chemicals.view", feature: "chemical_sds", entitlement: "ai_document_copilot" },
  query_ppe: { permission: "ppe.view", feature: "ppe_management", entitlement: "ai_copilot" },
  query_moc: { permission: "moc.view", feature: "moc", entitlement: "ai_copilot" },
  analytics_query: { permission: "analytics.view", feature: "advanced_analytics", entitlement: "ai_executive_copilot" },
  search_knowledge: { entitlement: "ai_copilot" },
  draft_capa: { permission: "ai.suggest", feature: "capa", entitlement: "ai_capa_intelligence", write: true },
  draft_action: { permission: "ai.suggest", entitlement: "ai_copilot", write: true },
  draft_incident_summary: {
    permission: "ai.suggest",
    feature: "incident_management",
    entitlement: "ai_incident_investigation",
    write: true,
  },
  draft_investigation_notes: {
    permission: "ai.suggest",
    feature: "incident_management",
    entitlement: "ai_incident_investigation",
    write: true,
  },
  draft_risk_note: { permission: "ai.suggest", feature: "risk_assessment", entitlement: "ai_risk_intelligence", write: true },
  draft_document_summary: {
    permission: "ai.suggest",
    feature: "document_control",
    entitlement: "ai_document_copilot",
    write: true,
  },
};

export function conversationVisible(input: {
  organizationId: string;
  userId: string;
  scope: AIScope;
  viewer: { organizationId: string; userId: string; permissions: string[]; isPlatformAdmin: boolean };
}) {
  if (input.viewer.isPlatformAdmin) return true;
  if (input.organizationId !== input.viewer.organizationId) return false;
  if (input.scope === "field") return input.userId === input.viewer.userId;
  if (input.userId === input.viewer.userId) return true;
  return input.viewer.permissions.includes("ai.admin");
}

export function fieldSelfOnly(scope: AIScope) {
  return scope === "field";
}

export function canUseAgent(ctx: AIAuthContext) {
  if (!ctx.entitlements.includes("ai_copilot") && ctx.agentKey !== "executive") return false;
  if (ctx.agentKey === "executive") {
    return (
      ctx.entitlements.includes("ai_executive_copilot") &&
      (ctx.entitlements.includes("executive_analytics") || ctx.entitlements.includes("advanced_analytics"))
    );
  }
  if (ctx.agentKey === "incident" && !ctx.entitlements.includes("ai_incident_investigation")) return false;
  if (ctx.agentKey === "risk" && !ctx.entitlements.includes("ai_risk_intelligence")) return false;
  if (ctx.agentKey === "capa" && !ctx.entitlements.includes("ai_capa_intelligence")) return false;
  if (ctx.agentKey === "document" && !ctx.entitlements.includes("ai_document_copilot")) return false;
  if (!ctx.permissions.includes("ai.use") && !ctx.isPlatformAdmin) return false;
  return true;
}

export function toolAllowed(ctx: AIAuthContext, toolName: string) {
  if ((FORBIDDEN_AUTONOMOUS_ACTIONS as readonly string[]).includes(toolName)) {
    return { allowed: false as const, reason: "Autonomous action is not available to AI." };
  }
  const req = TOOL_REQUIREMENTS[toolName];
  if (!req) return { allowed: false as const, reason: "Unknown tool." };

  if (ctx.scope === "field" && req.write) {
    return { allowed: false as const, reason: "Field Copilot is read-only." };
  }
  if (ctx.scope === "field" && !["query_incidents", "query_capa", "query_permits", "query_training", "query_certifications", "query_ppe", "search_knowledge", "get_incident"].includes(toolName)) {
    return { allowed: false as const, reason: "Field Copilot is limited to your own records." };
  }
  if (ctx.agentKey === "executive" && !["analytics_query", "query_capa", "query_incidents", "query_compliance", "search_knowledge"].includes(toolName)) {
    return { allowed: false as const, reason: "Executive Copilot cannot open operational write tools." };
  }

  if (req.entitlement && !ctx.entitlements.includes(req.entitlement) && !ctx.entitlements.includes("ai_copilot")) {
    return { allowed: false as const, reason: `Entitlement required: ${req.entitlement}` };
  }
  if (req.feature && !ctx.entitlements.includes(req.feature) && req.feature.startsWith("ai_")) {
    return { allowed: false as const, reason: `Entitlement required: ${req.feature}` };
  }
  if (req.feature && !req.feature.startsWith("ai_") && !ctx.entitlements.includes(req.feature)) {
    return { allowed: false as const, reason: `Module not enabled: ${req.feature}` };
  }
  if (req.permission && !ctx.permissions.includes(req.permission) && !ctx.isPlatformAdmin) {
    if (req.permission === "ai.suggest" && !ctx.permissions.includes("ai.suggest")) {
      return { allowed: false as const, reason: "Missing permission: ai.suggest" };
    }
    if (req.permission !== "ai.suggest" && !ctx.permissions.includes(req.permission)) {
      return { allowed: false as const, reason: `Missing permission: ${req.permission}` };
    }
  }
  if (req.write && (WRITE_TOOL_NAMES as readonly string[]).includes(toolName)) {
    if (!ctx.permissions.includes("ai.suggest") && !ctx.isPlatformAdmin) {
      return { allowed: false as const, reason: "Missing permission: ai.suggest" };
    }
  }
  return { allowed: true as const };
}

export function allowedToolNames(ctx: AIAuthContext) {
  return Object.keys(TOOL_REQUIREMENTS).filter((name) => toolAllowed(ctx, name).allowed);
}

/** Model-supplied org/user IDs are ignored. Server context always wins. */
export function bindToolOrganization<T extends Record<string, unknown>>(ctx: AIAuthContext, args: T) {
  const next = { ...args };
  delete next.organization_id;
  delete next.organizationId;
  delete next.user_id;
  delete next.userId;
  delete next.orgId;
  return { ...next, organizationId: ctx.organizationId, userId: ctx.userId };
}
