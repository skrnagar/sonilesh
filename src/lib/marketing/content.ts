/**
 * Primary wordmark is SONIL EHS360.
 * EHS = Environment, Health & Safety (industry acronym). The typed “ESH” maps to EHS, not a different product name.
 */
export const brand = {
  name: "SONIL EHS360",
  legalName: "SONIL",
  product: "EHS360",
  tagline: "One Platform. Complete EHS Control.",
  supporting: "From the field to the boardroom.",
  description:
    "Unify incidents, risk, permits, inspections, CAPA, training, and analytics in one multi-tenant EHS SaaS platform.",
} as const;

export const industries = [
  {
    slug: "construction",
    name: "Construction",
    summary:
      "Control high-risk work across projects, contractors, and changing site conditions.",
    challenges: [
      "Fragmented incident capture across multiple contractors",
      "Permit and toolbox talk discipline under schedule pressure",
      "Weak visibility from site to program leadership",
    ],
    modules: ["incidents", "permit-to-work", "inspections", "contractor-management", "capa"],
  },
  {
    slug: "epc",
    name: "EPC",
    summary:
      "Standardize EHS execution across engineering, procurement, and construction packages.",
    challenges: [
      "Multi-site package handoffs with inconsistent controls",
      "Contractor onboarding and competency gaps",
      "CAPA closure lag across joint venture interfaces",
    ],
    modules: ["risk-management", "permit-to-work", "audits", "contractor-management", "analytics"],
  },
  {
    slug: "power-energy",
    name: "Power & Energy",
    summary:
      "Protect people and assets across generation, transmission, and maintenance windows.",
    challenges: [
      "High-energy isolation and permit rigor",
      "Aging asset inspection programs",
      "Board-level risk and incident reporting",
    ],
    modules: ["permit-to-work", "risk-management", "inspections", "incidents", "analytics"],
  },
  {
    slug: "renewable-energy",
    name: "Renewable Energy",
    summary:
      "Scale safety systems for wind, solar, and storage portfolios without spreadsheet sprawl.",
    challenges: [
      "Distributed sites and remote field teams",
      "Contractor-heavy construction and O&M phases",
      "Inconsistent reporting standards across geographies",
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
      "Govern safety across corridors, facilities, and long-running capital programs.",
    challenges: [
      "Multi-contractor interfaces on live assets",
      "Inspection backlog visibility",
      "Document control across agencies and partners",
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
    summary: "Assess and prioritize risk with matrices, JSA/JHA linkage, and residual tracking.",
    capabilities: [
      "Risk assessments with matrix visualization",
      "JSA / JHA support paths",
      "Residual risk and control ownership",
      "Links into permits and CAPA",
    ],
  },
  {
    slug: "permit-to-work",
    name: "Permit to Work",
    summary: "Authorize high-risk work with structured permits and clear accountability.",
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
    body: "Fast capture for incidents, LMRA, permits, and inspections where work happens.",
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
  { title: "Report", detail: "Capture events and hazards with structured context." },
  { title: "Investigate", detail: "Establish facts, causes, and accountable owners." },
  { title: "CAPA", detail: "Define corrective and preventive actions with due dates." },
  { title: "Verify", detail: "Confirm effectiveness before declaring control restored." },
  { title: "Close", detail: "Complete the record with an auditable trail." },
] as const;

export const trustIndustries = industries.map((i) => i.name);

export const resources = [
  {
    title: "Implementation overview",
    body: "How organizations structure sites, roles, and module rollout.",
    status: "Coming soon",
  },
  {
    title: "Field adoption guide",
    body: "Patterns for getting supervisors and crews to report in the moment.",
    status: "Coming soon",
  },
  {
    title: "Closed-loop CAPA playbook",
    body: "From finding to verified effectiveness without spreadsheet drift.",
    status: "Coming soon",
  },
  {
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
      "Core incident and CAPA workflows",
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
      "Contractor and permit depth",
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
