/**
 * Primary wordmark is SONIL EHS360.
 * EHS = Environment, Health & Safety (industry acronym). The typed “ESH” maps to EHS, not a different product name.
 */
export const brand = {
  name: "SONIL EHS360",
  wordmark: "SONIL",
  legalName: "SONIL BUILDCON PRIVATE LIMITED",
  product: "EHS360",
  tagline: "EHS control from the workfront to the control room.",
  supporting: "Built for how infrastructure gets executed — LMRA on site, investigations and CAPA in the office.",
  description:
    "Multi-tenant EHS SaaS for incidents, risk, permits, inspections, CAPA, training, and analytics — shaped by SONIL Buildcon’s civil EPC execution culture.",
} as const;

/** Public facts from sonilbuildcon.com. Do not invent awards or customer logos. */
export const company = {
  parent: "SONIL Buildcon",
  legalEntity: "SONIL BUILDCON PRIVATE LIMITED",
  hq: "Indore, Madhya Pradesh, India",
  pin: "452016",
  phone: "+91 93405 83565",
  email: "info@sonilbuildcon.com",
  hours: "Monday–Saturday, 9 AM – 7 PM IST",
  website: "https://www.sonilbuildcon.com/",
  positioning:
    "Specialized civil and foundation EPC subcontracting — transmission, substations, renewables, telecom, and industrial civil — headquartered in Indore, MP.",
  sectors: [
    "Transmission",
    "Substations",
    "Solar & renewables",
    "Civil construction",
    "Telecom infrastructure",
    "Operation & maintenance",
  ],
  operatingStates: [
    "Madhya Pradesh",
    "Rajasthan",
    "Gujarat",
    "Maharashtra",
    "Chhattisgarh",
    "Uttar Pradesh",
    "Karnataka",
  ],
} as const;

/** Real product facts — not invented program metrics. */
export const productFacts = [
  { value: "11", label: "EHS modules", detail: "From incidents to analytics, entitled per tenant." },
  { value: "3", label: "Work surfaces", detail: "Field app, operations workspace, and platform admin." },
  { value: "1", label: "System of record", detail: "Capture, CAPA, and leadership views on the same data." },
  { value: "SaaS", label: "Multi-tenant", detail: "Organization isolation, sites, RBAC, and plan entitlements." },
] as const;

export const executionPillars = [
  {
    title: "Safety first",
    body: "Zero-harm language from the workfront: LMRA, toolbox talks, PPE, permits, and incident capture before the shift moves on.",
  },
  {
    title: "Execution discipline",
    body: "Same seriousness SONIL Buildcon brings to packages — structured ownership, due dates, and verification instead of inbox trails.",
  },
  {
    title: "Technical depth",
    body: "Risk, isolation, inspections, and CAPA designed for transmission, solar civil, substations, plants, and contractor-heavy sites.",
  },
  {
    title: "Full transparency",
    body: "Audit-oriented records and leadership dashboards — no invented certifications, logos, or case studies on this site.",
  },
] as const;

export const buyerAudiences = [
  "HSE & EHS leads",
  "EPC package managers",
  "Power & utility operators",
  "Renewable developers",
  "Plant & industrial EHS",
  "Infrastructure owners",
] as const;

export const industries = [
  {
    slug: "construction",
    name: "Construction",
    summary:
      "Control high-risk civil and building work across projects, contractors, and changing site conditions — including LMRA before the task starts.",
    challenges: [
      "Fragmented incident and near-miss capture across multiple contractors",
      "Permit, toolbox talk, and LMRA discipline under schedule pressure",
      "Weak visibility from site execution to program leadership",
    ],
    modules: ["incidents", "permit-to-work", "inspections", "contractor-management", "capa"],
  },
  {
    slug: "epc",
    name: "EPC",
    summary:
      "Standardize EHS execution across engineering, procurement, and construction packages — the same interfaces SONIL Buildcon works every day.",
    challenges: [
      "Multi-site package handoffs with inconsistent controls",
      "Contractor onboarding, induction, and competency gaps",
      "CAPA closure lag across owner, EPC, and subcontractor interfaces",
    ],
    modules: ["risk-management", "permit-to-work", "audits", "contractor-management", "analytics"],
  },
  {
    slug: "power-energy",
    name: "Power & Energy",
    summary:
      "Protect people and assets across generation, transmission corridors, substations, and maintenance windows.",
    challenges: [
      "High-energy isolation and permit-to-work rigor",
      "Inspection programs across yards, towers, and live assets",
      "Leadership reporting that matches package and site reality",
    ],
    modules: ["permit-to-work", "risk-management", "inspections", "incidents", "analytics"],
  },
  {
    slug: "renewable-energy",
    name: "Renewable Energy",
    summary:
      "Scale safety systems for utility-scale solar, wind, and storage — construction through O&M — without spreadsheet sprawl.",
    challenges: [
      "Distributed sites and remote field teams",
      "Contractor-heavy piling, MMS, BOP, and O&M phases",
      "Inconsistent reporting standards across parks and states",
    ],
    modules: ["incidents", "inspections", "training", "contractor-management", "document-control"],
  },
  {
    slug: "manufacturing",
    name: "Manufacturing",
    summary:
      "Connect plant-floor hazards to investigations, CAPA, and operational learning.",
    challenges: [
      "Near-miss under-reporting",
      "Shift-based training and PPE compliance",
      "Audit readiness without binder culture",
    ],
    modules: ["incidents", "risk-management", "capa", "ppe", "audits"],
  },
  {
    slug: "oil-gas",
    name: "Oil & Gas",
    summary:
      "Operate critical controls for upstream, midstream, and downstream environments.",
    challenges: [
      "Permit-to-work and simultaneous operations risk",
      "Contractor density in turnaround windows",
      "Investigation quality and verification of effectiveness",
    ],
    modules: ["permit-to-work", "risk-management", "incidents", "capa", "contractor-management"],
  },
  {
    slug: "infrastructure",
    name: "Infrastructure",
    summary:
      "Govern safety across corridors, substations, industrial campuses, and long-running capital programs.",
    challenges: [
      "Multi-contractor interfaces on live assets",
      "Inspection backlog visibility across linear works",
      "Document control across agencies, EPCs, and partners",
    ],
    modules: ["inspections", "audits", "document-control", "incidents", "analytics"],
  },
  {
    slug: "mining",
    name: "Mining",
    summary:
      "Strengthen critical risk management from pit to plant with closed-loop actions.",
    challenges: [
      "Critical risk and fatigue-related exposure",
      "Field reporting in harsh environments",
      "Assurance of control effectiveness",
    ],
    modules: ["risk-management", "incidents", "inspections", "capa", "training"],
  },
  {
    slug: "logistics",
    name: "Logistics",
    summary:
      "Reduce warehouse, yard, and fleet EHS friction with faster field capture.",
    challenges: [
      "High-velocity near-miss and hazard volume",
      "Contractor and visitor control at gates",
      "Training currency across distributed hubs",
    ],
    modules: ["incidents", "ppe", "training", "contractor-management", "analytics"],
  },
] as const;

export type IndustrySlug = (typeof industries)[number]["slug"];

export const modules = [
  {
    slug: "incidents",
    name: "Incidents",
    summary: "Capture, classify, investigate, and close events with a full audit trail.",
    field: "Crews log incidents, near misses, and hazards from the job — including LMRA context when the task is live.",
    dashboard: "HSE classifies severity, runs investigations, and watches open events by site and contractor.",
    capabilities: [
      "Configurable event categories and severity",
      "Investigation workflows linked to CAPA",
      "Attachments, witnesses, and timeline evidence",
      "Tenant-scoped notifications and ownership",
    ],
  },
  {
    slug: "risk-management",
    name: "Risk Management",
    summary: "Assess and prioritize risk with matrices, JSA/JHA linkage, residual tracking, and LMRA at the workfront.",
    field: "Supervisors complete LMRA (last minute risk assessment) before high-risk tasks proceed.",
    dashboard: "Risk registers, matrices, and residual scores stay visible to HSE and package leadership.",
    capabilities: [
      "Risk assessments with matrix visualization",
      "JSA / JHA support paths",
      "LMRA capture in the field experience",
      "Residual risk, control ownership, and links into permits and CAPA",
    ],
  },
  {
    slug: "permit-to-work",
    name: "Permit to Work",
    summary: "Authorize high-risk work with structured permits and clear accountability.",
    field: "Issuers and receivers complete condition checks where the work is happening.",
    dashboard: "Operations see active, expired, and overdue permits across sites and packages.",
    capabilities: [
      "Permit types and authorization steps",
      "Isolation and condition checks",
      "Printable permit views",
      "Contractor and site scoping",
    ],
  },
  {
    slug: "inspections",
    name: "Inspections",
    summary: "Run planned and ad-hoc inspections with findings that drive action.",
    field: "Inspectors walk the site with checklists, photos, and finding capture on a phone.",
    dashboard: "Open findings, severity, and overdue actions roll up by site for HSE review.",
    capabilities: [
      "Checklist-driven inspections",
      "Finding severity and ownership",
      "CAPA / action item linkage",
      "Field-friendly capture",
    ],
  },
  {
    slug: "audits",
    name: "Audits",
    summary: "Plan assurance activities and evidence gaps without binder sprawl.",
    field: "Auditors collect observations and evidence on site, not after the visit.",
    dashboard: "Audit plans, findings, and follow-up status stay in one governed record.",
    capabilities: [
      "Audit planning and scoping",
      "Finding and observation tracking",
      "Evidence attachments",
      "Follow-up verification",
    ],
  },
  {
    slug: "capa",
    name: "CAPA",
    summary: "Close the loop from finding to verified effectiveness.",
    field: "Action owners update status from the field when the control is actually in place.",
    dashboard: "Due dates, overdue CAPA, and verification of effectiveness are leadership-visible.",
    capabilities: [
      "Corrective and preventive actions",
      "Due dates, owners, and escalation visibility",
      "Verification of effectiveness",
      "Links from incidents, audits, and inspections",
    ],
  },
  {
    slug: "training",
    name: "Training",
    summary: "Track required learning, completions, and competency signals by role.",
    field: "Toolbox talks and assigned learning sit next to the work, not in a separate binder.",
    dashboard: "Completion and currency by role and site support induction and assurance reviews.",
    capabilities: [
      "Training assignments and records",
      "Role and site relevance",
      "Completion visibility",
      "Toolbox talk adjacency",
    ],
  },
  {
    slug: "contractor-management",
    name: "Contractor Management",
    summary: "Bring contractors into the same control system as your workforce.",
    field: "Contractor crews report and work under the same permits, LMRA, and incident paths.",
    dashboard: "Onboarding, activity, and HSE performance signals stay scoped to each tenant.",
    capabilities: [
      "Contractor profiles and site access context",
      "Activity linkage to permits and incidents",
      "Onboarding visibility",
      "Performance signals for HSE review",
    ],
  },
  {
    slug: "ppe",
    name: "PPE",
    summary: "Manage PPE expectations, issuance context, and compliance signals.",
    field: "Expectations are clear at the workfront; issues and gaps can be recorded on site.",
    dashboard: "Issuance and compliance records support inspections and incident reviews.",
    capabilities: [
      "PPE catalogs and requirements",
      "Site and role relevance",
      "Issue / compliance records",
      "Links to inspections and incidents",
    ],
  },
  {
    slug: "document-control",
    name: "Document Control",
    summary: "Keep procedures and controlled documents current where work happens.",
    field: "Crews retrieve the current procedure instead of a photocopied revision.",
    dashboard: "Version-aware libraries support audits and handover documentation.",
    capabilities: [
      "Controlled document library",
      "Version awareness",
      "Site and module relevance",
      "Audit-friendly retrieval",
    ],
  },
  {
    slug: "analytics",
    name: "Analytics",
    summary: "Turn operational EHS data into leadership-ready visibility.",
    field: "What gets captured on site is what leadership can actually see.",
    dashboard: "Leading and lagging signals — open incidents, overdue CAPA, active permits — by site.",
    capabilities: [
      "Dashboards for leading and lagging signals",
      "Filters by site, severity, and status",
      "Trend and distribution views",
      "Export-oriented reporting paths",
    ],
  },
] as const;

export type ModuleSlug = (typeof modules)[number]["slug"];

export const platformPillars = [
  {
    title: "Field",
    body: "Fast capture for incidents, LMRA, permits, toolbox talks, and inspections where work happens.",
  },
  {
    title: "Operations",
    body: "High-density workspace for investigation, ownership, and day-to-day control.",
  },
  {
    title: "Risk",
    body: "Assessments, permits, and critical controls connected to real work packages.",
  },
  {
    title: "Assurance",
    body: "Inspections, audits, CAPA, and verification in one closed loop.",
  },
  {
    title: "Leadership",
    body: "Analytics and status visibility from site execution to the boardroom.",
  },
] as const;

export const lifecycleSteps = [
  { title: "Report", detail: "Capture events, hazards, and LMRA with structured site context." },
  { title: "Investigate", detail: "Establish facts, causes, and accountable owners." },
  { title: "CAPA", detail: "Define corrective and preventive actions with due dates." },
  { title: "Verify", detail: "Confirm effectiveness before declaring control restored." },
  { title: "Close", detail: "Complete the record with an auditable trail." },
] as const;

export const trustIndustries = industries.map((i) => i.name);

export const resources = [
  {
    id: "implementation",
    title: "Implementation overview",
    body: "How organizations structure sites, roles, and module rollout.",
    status: "Coming soon",
  },
  {
    id: "field-adoption",
    title: "Field adoption guide",
    body: "Patterns for getting supervisors and crews to report — including LMRA — in the moment.",
    status: "Coming soon",
  },
  {
    id: "capa-playbook",
    title: "Closed-loop CAPA playbook",
    body: "From finding to verified effectiveness without spreadsheet drift.",
    status: "Coming soon",
  },
  {
    id: "analytics-leadership",
    title: "Analytics for HSE leadership",
    body: "Which signals matter from site operations to executive review.",
    status: "Coming soon",
  },
] as const;

export const pricingTiers = [
  {
    name: "Team",
    audience: "Growing EHS programs",
    points: [
      "Core incident, LMRA, and CAPA workflows",
      "Site-scoped operations",
      "Standard analytics",
      "Email support",
    ],
    cta: "Contact Sales",
    href: "/contact",
  },
  {
    name: "Business",
    audience: "Multi-site operators",
    points: [
      "Expanded module entitlements",
      "Contractor, permit-to-work, and inspection depth",
      "Advanced reporting paths",
      "Onboarding guidance",
    ],
    cta: "Contact Sales",
    href: "/contact",
    featured: true,
  },
  {
    name: "Enterprise",
    audience: "Complex portfolios",
    points: [
      "Custom entitlement packaging",
      "Advanced tenancy and admin controls",
      "Security review support",
      "Dedicated commercial engagement",
    ],
    cta: "Custom",
    href: "/request-demo",
  },
] as const;

export function getIndustry(slug: string) {
  return industries.find((i) => i.slug === slug);
}

export function getModule(slug: string) {
  return modules.find((m) => m.slug === slug);
}

export function moduleBySlug(slug: string) {
  return modules.find((m) => m.slug === slug);
}
