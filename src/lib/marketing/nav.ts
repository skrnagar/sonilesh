export type NavLink = {
  label: string;
  href: string;
  description?: string;
};

export type MegaColumn = {
  title: string;
  links: NavLink[];
};

export const primaryNav: {
  label: string;
  href: string;
  columns?: MegaColumn[];
}[] = [
  {
    label: "Platform",
    href: "/platform",
    columns: [
      {
        title: "Overview",
        links: [
          {
            label: "Platform",
            href: "/platform",
            description: "Field to boardroom control system",
          },
          {
            label: "Features",
            href: "/features",
            description: "Capabilities across the EHS lifecycle",
          },
          {
            label: "Field",
            href: "/field-experience",
            description: "Mobile-first capture for crews",
          },
        ],
      },
      {
        title: "Depth",
        links: [
          {
            label: "Analytics",
            href: "/modules/analytics",
            description: "Operational and leadership visibility",
          },
          {
            label: "Security",
            href: "/security",
            description: "Isolation, auth, and auditability",
          },
          {
            label: "AI-ready",
            href: "/platform#ai-ready",
            description: "Assistive potential — no overclaim",
          },
        ],
      },
    ],
  },
  {
    label: "Solutions",
    href: "/solutions",
    columns: [
      {
        title: "Industries",
        links: [
          { label: "Construction", href: "/solutions/construction" },
          { label: "EPC", href: "/solutions/epc" },
          { label: "Power & Energy", href: "/solutions/power-energy" },
          { label: "Renewable Energy", href: "/solutions/renewable-energy" },
          { label: "Manufacturing", href: "/solutions/manufacturing" },
        ],
      },
      {
        title: "More",
        links: [
          { label: "Oil & Gas", href: "/solutions/oil-gas" },
          { label: "Infrastructure", href: "/solutions/infrastructure" },
          { label: "Mining", href: "/solutions/mining" },
          { label: "Logistics", href: "/solutions/logistics" },
          { label: "All solutions", href: "/solutions", description: "Browse every vertical" },
        ],
      },
    ],
  },
  {
    label: "Modules",
    href: "/modules",
    columns: [
      {
        title: "Control",
        links: [
          { label: "Incidents", href: "/modules/incidents" },
          { label: "Risk Management", href: "/modules/risk-management" },
          { label: "Permit to Work", href: "/modules/permit-to-work" },
          { label: "Inspections", href: "/modules/inspections" },
          { label: "Audits", href: "/modules/audits" },
          { label: "CAPA", href: "/modules/capa" },
        ],
      },
      {
        title: "Enablement",
        links: [
          { label: "Training", href: "/modules/training" },
          { label: "Contractors", href: "/modules/contractor-management" },
          { label: "PPE", href: "/modules/ppe" },
          { label: "Document Control", href: "/modules/document-control" },
          { label: "Analytics", href: "/modules/analytics" },
          { label: "All modules", href: "/modules" },
        ],
      },
    ],
  },
  {
    label: "Enterprise",
    href: "/enterprise",
    columns: [
      {
        title: "Enterprise",
        links: [
          {
            label: "Multi-tenant SaaS",
            href: "/enterprise",
            description: "Org isolation, sites, entitlements",
          },
          {
            label: "Security",
            href: "/security",
            description: "Controls without fake certifications",
          },
          {
            label: "Configuration",
            href: "/enterprise#configuration",
            description: "Categories, workflows, forms",
          },
        ],
      },
    ],
  },
  {
    label: "Resources",
    href: "/resources",
  },
  {
    label: "Pricing",
    href: "/pricing",
  },
];

export const footerColumns: { title: string; links: NavLink[] }[] = [
  {
    title: "Product",
    links: [
      { label: "Platform", href: "/platform" },
      { label: "Features", href: "/features" },
      { label: "Field", href: "/field-experience" },
      { label: "Modules", href: "/modules" },
      { label: "Pricing", href: "/pricing" },
    ],
  },
  {
    title: "Solutions",
    links: [
      { label: "Construction", href: "/solutions/construction" },
      { label: "Oil & Gas", href: "/solutions/oil-gas" },
      { label: "Manufacturing", href: "/solutions/manufacturing" },
      { label: "Renewables", href: "/solutions/renewable-energy" },
      { label: "All industries", href: "/solutions" },
    ],
  },
  {
    title: "Modules",
    links: [
      { label: "Incidents", href: "/modules/incidents" },
      { label: "CAPA", href: "/modules/capa" },
      { label: "Permit to Work", href: "/modules/permit-to-work" },
      { label: "Analytics", href: "/modules/analytics" },
      { label: "All modules", href: "/modules" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Resources", href: "/resources" },
      { label: "Contact", href: "/contact" },
      { label: "Request demo", href: "/request-demo" },
      { label: "Sign in", href: "/login" },
    ],
  },
];
