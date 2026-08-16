export type NavLink = {
  label: string;
  href: string;
  description?: string;
  icon?: string;
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
            icon: "LayoutGrid",
          },
          {
            label: "Features",
            href: "/features",
            description: "Capabilities across the EHS lifecycle",
            icon: "ListChecks",
          },
          {
            label: "Field",
            href: "/field-experience",
            description: "LMRA and mobile capture for crews",
            icon: "Smartphone",
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
            icon: "BarChart3",
          },
          {
            label: "Security",
            href: "/security",
            description: "Isolation, auth, and auditability",
            icon: "Shield",
          },
          {
            label: "AI-ready",
            href: "/platform#ai-ready",
            description: "Assistive potential — no overclaim",
            icon: "Sparkles",
          },
          {
            label: "Enterprise",
            href: "/enterprise",
            description: "Org isolation, sites, entitlements",
            icon: "Building2",
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
          {
            label: "Construction",
            href: "/solutions/construction",
            description: "Projects, contractors, high-risk work",
            icon: "HardHat",
          },
          {
            label: "EPC",
            href: "/solutions/epc",
            description: "Packages, handoffs, joint ventures",
            icon: "Building2",
          },
          {
            label: "Power & Energy",
            href: "/solutions/power-energy",
            description: "Generation, outages, permits",
            icon: "Zap",
          },
          {
            label: "Renewable Energy",
            href: "/solutions/renewable-energy",
            description: "Wind, solar, and construction risk",
            icon: "Leaf",
          },
          {
            label: "Manufacturing",
            href: "/solutions/manufacturing",
            description: "Lines, contractors, and CAPA",
            icon: "Factory",
          },
        ],
      },
      {
        title: "More",
        links: [
          {
            label: "Oil & Gas",
            href: "/solutions/oil-gas",
            description: "Upstream to downstream control",
            icon: "Flame",
          },
          {
            label: "Infrastructure",
            href: "/solutions/infrastructure",
            description: "Linear projects and public works",
            icon: "Landmark",
          },
          {
            label: "Mining",
            href: "/solutions/mining",
            description: "Pit, plant, and contractor safety",
            icon: "Mountain",
          },
          {
            label: "Logistics",
            href: "/solutions/logistics",
            description: "Yards, fleets, and warehouses",
            icon: "Truck",
          },
          {
            label: "All solutions",
            href: "/solutions",
            description: "Browse every vertical",
            icon: "ArrowRight",
          },
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
          {
            label: "Incidents",
            href: "/modules/incidents",
            description: "Capture, investigate, close",
            icon: "AlertTriangle",
          },
          {
            label: "Risk Management",
            href: "/modules/risk-management",
            description: "Registers, heat maps, residual risk",
            icon: "Radar",
          },
          {
            label: "Permit to Work",
            href: "/modules/permit-to-work",
            description: "Authorization and isolation",
            icon: "FileBadge",
          },
          {
            label: "Inspections",
            href: "/modules/inspections",
            description: "Checklists and findings",
            icon: "ClipboardCheck",
          },
          {
            label: "Audits",
            href: "/modules/audits",
            description: "Program assurance",
            icon: "FileSearch",
          },
          {
            label: "CAPA",
            href: "/modules/capa",
            description: "Actions with verification",
            icon: "ListChecks",
          },
        ],
      },
      {
        title: "Enablement",
        links: [
          {
            label: "Training",
            href: "/modules/training",
            description: "Assignments and competency",
            icon: "GraduationCap",
          },
          {
            label: "Contractors",
            href: "/modules/contractor-management",
            description: "Onboarding and scores",
            icon: "Users",
          },
          {
            label: "PPE",
            href: "/modules/ppe",
            description: "Issue and compliance",
            icon: "HardHat",
          },
          {
            label: "Document Control",
            href: "/modules/document-control",
            description: "Controlled procedures",
            icon: "FolderOpen",
          },
          {
            label: "Analytics",
            href: "/modules/analytics",
            description: "Leading and lagging signals",
            icon: "BarChart3",
          },
          {
            label: "All modules",
            href: "/modules",
            description: "Compose the program you need",
            icon: "Puzzle",
          },
        ],
      },
    ],
  },
  {
    label: "Resources",
    href: "/resources",
    columns: [
      {
        title: "Library",
        links: [
          {
            label: "Resources",
            href: "/resources",
            description: "Guides as the library grows — no fabricated papers",
            icon: "BookOpen",
          },
          {
            label: "Implementation",
            href: "/resources#implementation",
            description: "Sites, roles, and module rollout",
            icon: "Layers3",
          },
          {
            label: "Field adoption",
            href: "/resources#field-adoption",
            description: "LMRA and reporting in the moment",
            icon: "Smartphone",
          },
        ],
      },
      {
        title: "Company",
        links: [
          {
            label: "About SONIL",
            href: "/about",
            description: "EHS360 and SONIL Buildcon",
            icon: "Building2",
          },
          {
            label: "Contact",
            href: "/contact",
            description: "Sales and product conversations",
            icon: "Mail",
          },
          {
            label: "Security",
            href: "/security",
            description: "Controls without fake certifications",
            icon: "Shield",
          },
        ],
      },
    ],
  },
  {
    label: "Pricing",
    href: "/pricing",
    columns: [
      {
        title: "Packaging",
        links: [
          {
            label: "Plans overview",
            href: "/pricing",
            description: "Team, Business, Enterprise — Contact Sales",
            icon: "Layers3",
          },
          {
            label: "Compare packages",
            href: "/pricing#compare",
            description: "Capability direction, not fake price tags",
            icon: "ListChecks",
          },
          {
            label: "Contact sales",
            href: "/contact",
            description: "Commercial terms for your sites",
            icon: "Mail",
          },
        ],
      },
    ],
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
      { label: "SONIL Buildcon", href: "https://www.sonilbuildcon.com/" },
      { label: "Resources", href: "/resources" },
      { label: "Contact", href: "/contact" },
      { label: "Request demo", href: "/request-demo" },
    ],
  },
];
