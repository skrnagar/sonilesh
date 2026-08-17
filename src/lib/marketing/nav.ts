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
    label: "Product",
    href: "/product",
    columns: [
      {
        title: "Platform",
        links: [
          { label: "Overview", href: "/product", description: "EHS + ESG + compliance in one tenant", icon: "LayoutGrid" },
          { label: "Incident management", href: "/product/incident-management", description: "Field capture to investigation", icon: "AlertTriangle" },
          { label: "Risk & JSA", href: "/product/risk-assessment-jsa", description: "Registers, JSA, LMRA", icon: "Radar" },
          { label: "Permit to work", href: "/product/permit-to-work", description: "Authorization and isolation", icon: "FileBadge" },
        ],
      },
      {
        title: "Assure & report",
        links: [
          { label: "Inspections & audits", href: "/product/inspections-audits", description: "Findings into actions", icon: "ClipboardCheck" },
          { label: "CAPA", href: "/product/capa-tracking", description: "Owners and verification", icon: "ListChecks" },
          { label: "Compliance tracking", href: "/product/compliance-tracking", description: "Statutory obligations", icon: "Scale" },
          { label: "ESG & BRSR", href: "/product/esg-brsr-reporting", description: "Reporting on EHS data", icon: "Leaf" },
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
          { label: "Manufacturing", href: "/solutions/manufacturing", description: "Plants, shifts, Factories Act discipline", icon: "Factory" },
          { label: "Construction & EPC", href: "/solutions/construction-epc", description: "Packages, contractors, civil risk", icon: "HardHat" },
          { label: "Renewable energy", href: "/solutions/renewable-energy", description: "Solar, wind, O&M", icon: "Leaf" },
          { label: "Oil, gas & chemicals", href: "/solutions/oil-gas-chemicals", description: "Permits, SIMOPS, turnarounds", icon: "Flame" },
          { label: "Logistics & warehousing", href: "/solutions/logistics-warehousing", description: "Yards, MHE, 3PL gates", icon: "Truck" },
        ],
      },
    ],
  },
  {
    label: "Resources",
    href: "/resources",
    columns: [
      {
        title: "Learn",
        links: [
          { label: "Guides", href: "/resources", description: "Pillars as they are written", icon: "BookOpen" },
          { label: "BRSR checker", href: "/resources/brsr-applicability", description: "Same rules as the app", icon: "Scale" },
          { label: "Glossary", href: "/resources#glossary", description: "BRSR, TRIR, CAPA, EPR…", icon: "List" },
          { label: "Security", href: "/security", description: "Controls we actually run", icon: "Shield" },
          { label: "Self-hosting", href: "/self-hosting", description: "Cloud or private instance", icon: "Building2" },
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
      { label: "Renewables", href: "/solutions/renewable-energy" },
      { label: "Oil & gas", href: "/solutions/oil-gas-chemicals" },
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
      { label: "Resources", href: "/resources" },
      { label: "SONIL Buildcon", href: "https://www.sonilbuildcon.com/" },
    ],
  },
];
