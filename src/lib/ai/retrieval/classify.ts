export type QueryClass =
  | "structured_lookup"
  | "document_search"
  | "analytics"
  | "draft_request"
  | "mixed"
  | "conversational"
  | "forbidden_cross_tenant";

const STRUCTURED: Array<{ re: RegExp; tools: string[] }> = [
  { re: /\b(incident|near[- ]miss|injury|accident)\b/i, tools: ["query_incidents"] },
  { re: /\b(capa|corrective|preventive|action item)\b/i, tools: ["query_capa"] },
  { re: /\b(permit|ptw|hot work|confined)\b/i, tools: ["query_permits"] },
  { re: /\b(risk|jsa|jha|hazard)\b/i, tools: ["query_risks"] },
  { re: /\b(inspection|audit|finding)\b/i, tools: ["query_inspections", "query_findings", "query_audits"] },
  { re: /\b(training|certif|competenc)\b/i, tools: ["query_training", "query_certifications"] },
  { re: /\b(contractor)\b/i, tools: ["query_contractors"] },
  { re: /\b(compliance|license|consent|legal register)\b/i, tools: ["query_compliance"] },
  { re: /\b(ppe|helmet|harness)\b/i, tools: ["query_ppe"] },
  { re: /\b(moc|management of change)\b/i, tools: ["query_moc"] },
  { re: /\b(sds|msds|chemical|cas number)\b/i, tools: ["query_sds"] },
  { re: /\b(policy|procedure|sop|document)\b/i, tools: ["query_documents", "search_knowledge"] },
  { re: /\b(trir|ltifr|dashboard|trend|kpi|analytics)\b/i, tools: ["analytics_query"] },
];

const DRAFT = /\b(draft|suggest|recommend|propose)\b.+\b(capa|action|summary|investigation)\b/i;
const CROSS_TENANT =
  /\b(all customers|every (org|organization|tenant|company)|other (org|organization|tenant)s?|show all incidents across)\b/i;

export function classifyQuery(text: string): { class: QueryClass; tools: string[]; reason: string } {
  if (CROSS_TENANT.test(text)) {
    return {
      class: "forbidden_cross_tenant",
      tools: [],
      reason: "Cross-tenant or all-customer requests are refused before any tool runs.",
    };
  }
  if (DRAFT.test(text)) {
    const tools = ["draft_capa", "draft_action", "draft_incident_summary"].filter((t) =>
      text.toLowerCase().includes(t.replace("draft_", "")),
    );
    return {
      class: "draft_request",
      tools: tools.length ? tools : ["draft_capa"],
      reason: "User asked for a draft that requires human approval.",
    };
  }

  const tools: string[] = [];
  for (const row of STRUCTURED) {
    if (row.re.test(text)) tools.push(...row.tools);
  }
  const unique = Array.from(new Set(tools));
  const wantsDocs = unique.includes("query_documents") || unique.includes("search_knowledge") || unique.includes("query_sds");
  const wantsStructured = unique.some((t) => t.startsWith("query_") && t !== "query_documents" && t !== "query_sds");
  const wantsAnalytics = unique.includes("analytics_query");

  if (wantsAnalytics && !wantsStructured && !wantsDocs) {
    return { class: "analytics", tools: unique, reason: "Analytics / KPI phrasing." };
  }
  if (wantsDocs && wantsStructured) {
    return { class: "mixed", tools: unique, reason: "Structured records plus documents." };
  }
  if (wantsDocs && !wantsStructured) {
    return { class: "document_search", tools: unique, reason: "Document / SDS phrasing." };
  }
  if (unique.length) {
    return { class: "structured_lookup", tools: unique, reason: "Operational record lookup." };
  }
  return { class: "conversational", tools: ["search_knowledge"], reason: "No structured intent detected." };
}
