export type NavLink = {
  label: string;
  href: string;
  description?: string;
  icon?: string;
};

export type MegaColumn = {
  title: string;
  links: NavLink[];
  accent?: boolean;
};

export type PrimaryNavItem = {
  label: string;
  href: string;
  columns?: MegaColumn[];
  footer?: NavLink;
};

export function isNavPathActive(pathname: string, href: string) {
  const [path, hash] = href.split("#");
  if (!path || path === "/") return pathname === "/";
  if (hash) return pathname === path;
  return pathname === path || pathname.startsWith(`${path}/`);
}

export const primaryNav: PrimaryNavItem[] = [
  {
    label: "Product",
    href: "/product",
    footer: { label: "Explore the product", href: "/product" },
    columns: [
      {
        title: "Platform",
        links: [
          { label: "Overview", href: "/product", description: "EHS + ESG + compliance in one tenant", icon: "LayoutGrid" },
          { label: "Incident management", href: "/product/incident-management", description: "Field capture to investigation", icon: "AlertTriangle" },
          { label: "Risk & JSA", href: "/product/risk-assessment-jsa", description: "Registers, JSA, LMRA", icon: "Radar" },
          { label: "Permit to work", href: "/product/permit-to-work", description: "Authorization and isolation", icon: "FileBadge" },
          { label: "Training", href: "/product/training-competency", description: "Competency and records", icon: "GraduationCap" },
        ],
      },
      {
        title: "Assure & report",
        links: [
          { label: "Inspections & audits", href: "/product/inspections-audits", description: "Findings into actions", icon: "ClipboardCheck" },
          { label: "CAPA", href: "/product/capa-tracking", description: "Owners and verification", icon: "ListChecks" },
          { label: "Contractor management", href: "/product/contractor-management", description: "Contractors in the same tenant", icon: "Users" },
          { label: "Compliance tracking", href: "/product/compliance-tracking", description: "Statutory obligations", icon: "Scale" },
          { label: "ESG & BRSR", href: "/product/esg-brsr-reporting", description: "Reporting on EHS data", icon: "Leaf" },
        ],
      },
      {
        title: "Get started",
        accent: true,
        links: [
          { label: "Start Free", href: "/signup", description: "Create an organisation", icon: "Sparkles" },
          { label: "Book a Demo", href: "/book-a-demo", description: "Walk the workflows", icon: "Mail" },
          { label: "Pricing", href: "/pricing", description: "Plans and packaging", icon: "BarChart3" },
        ],
      },
    ],
  },
  {
    label: "Solutions",
    href: "/solutions",
    footer: { label: "All industries", href: "/solutions" },
    columns: [
      {
        title: "Industries",
        links: [
          { label: "Manufacturing", href: "/solutions/manufacturing", description: "Plants, shifts, Factories Act discipline", icon: "Factory" },
          { label: "Construction & EPC", href: "/solutions/construction-epc", description: "Packages, contractors, civil risk", icon: "HardHat" },
          { label: "Power & energy", href: "/solutions/power-energy", description: "Generation, T&D, substations", icon: "Zap" },
          { label: "Renewable energy", href: "/solutions/renewable-energy", description: "Solar, wind, O&M", icon: "Leaf" },
          { label: "Oil, gas & chemicals", href: "/solutions/oil-gas-chemicals", description: "Permits, SIMOPS, turnarounds", icon: "Flame" },
          { label: "Logistics & warehousing", href: "/solutions/logistics-warehousing", description: "Yards, MHE, 3PL gates", icon: "Truck" },
          { label: "Infrastructure", href: "/solutions/infrastructure", description: "Corridors, campuses, capital programs", icon: "Building2" },
          { label: "Mining", href: "/solutions/mining", description: "Pit to plant critical risk", icon: "Mountain" },
        ],
      },
      {
        title: "Get started",
        accent: true,
        links: [
          { label: "Start Free", href: "/signup", description: "Create an organisation", icon: "Sparkles" },
          { label: "Book a Demo", href: "/book-a-demo", description: "Walk the workflows", icon: "Mail" },
          { label: "Contact", href: "/contact", description: "Talk to the team", icon: "Mail" },
        ],
      },
    ],
  },
  {
    label: "Resources",
    href: "/resources",
    footer: { label: "All resources", href: "/resources" },
    columns: [
      {
        title: "Guides",
        links: [
          { label: "Implementation overview", href: "/resources/implementation-overview", description: "Sites, roles, rollout order", icon: "BookOpen" },
          { label: "Field adoption", href: "/resources/field-adoption", description: "Crews, LMRA, coaching", icon: "HardHat" },
          { label: "CAPA playbook", href: "/resources/closed-loop-capa-playbook", description: "Verify before close", icon: "ListChecks" },
          { label: "HSE analytics", href: "/resources/analytics-for-hse-leadership", description: "Signals leadership can use", icon: "BarChart3" },
        ],
      },
      {
        title: "Tools & docs",
        links: [
          { label: "BRSR checker", href: "/resources/brsr-applicability", description: "Same rules as the app", icon: "Scale" },
          { label: "Glossary", href: "/resources#glossary", description: "BRSR, TRIR, CAPA, EPR…", icon: "List" },
          { label: "Product documentation", href: "/resources#product-documentation", description: "Platform, field, security", icon: "LayoutGrid" },
          { label: "Security", href: "/security", description: "Controls we actually run", icon: "Shield" },
          { label: "Self-hosting", href: "/self-hosting", description: "Cloud or private instance", icon: "Building2" },
        ],
      },
      {
        title: "Company",
        accent: true,
        links: [
          { label: "About", href: "/about", description: "Who builds EHS360", icon: "Landmark" },
          { label: "Customers", href: "/customers", description: "How organisations use it", icon: "Users" },
          { label: "Contact", href: "/contact", description: "Talk to the team", icon: "Mail" },
          { label: "Book a Demo", href: "/book-a-demo", description: "Walk the workflows", icon: "Mail" },
        ],
      },
    ],
  },
  { label: "Pricing", href: "/pricing" },
];

export const footerColumns: { title: string; links: NavLink[] }[] = [
  {
    title: "Product",
    links: [
      { label: "Overview", href: "/product" },
      { label: "Incidents", href: "/product/incident-management" },
      { label: "Compliance", href: "/product/compliance-tracking" },
      { label: "ESG & BRSR", href: "/product/esg-brsr-reporting" },
      { label: "Pricing", href: "/pricing" },
    ],
  },
  {
    title: "Solutions",
    links: [
      { label: "Manufacturing", href: "/solutions/manufacturing" },
      { label: "Construction & EPC", href: "/solutions/construction-epc" },
      { label: "Power & energy", href: "/solutions/power-energy" },
      { label: "Renewables", href: "/solutions/renewable-energy" },
      { label: "Oil & gas", href: "/solutions/oil-gas-chemicals" },
      { label: "Infrastructure", href: "/solutions/infrastructure" },
      { label: "Mining", href: "/solutions/mining" },
      { label: "All industries", href: "/solutions" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Customers", href: "/customers" },
      { label: "Security", href: "/security" },
      { label: "Self-hosting", href: "/self-hosting" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Get started",
    links: [
      { label: "Book a Demo", href: "/book-a-demo" },
      { label: "Start Free", href: "/signup" },
      { label: "Sign in", href: "/login" },
      { label: "BRSR checker", href: "/resources/brsr-applicability" },
      { label: "Guides", href: "/resources" },
      { label: "SONIL Buildcon", href: "https://www.sonilbuildcon.com/" },
    ],
  },
];
