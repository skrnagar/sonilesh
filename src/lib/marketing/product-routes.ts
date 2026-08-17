export type ProductPageDef = {
  slug: string;
  moduleSlug: string | null;
  extraModuleSlug?: string;
  name: string;
};

export const PRODUCT_PAGES: ProductPageDef[] = [
  { slug: "incident-management", moduleSlug: "incidents", name: "Incident management" },
  { slug: "permit-to-work", moduleSlug: "permit-to-work", name: "Permit to work" },
  { slug: "risk-assessment-jsa", moduleSlug: "risk-management", name: "Risk assessment & JSA" },
  {
    slug: "inspections-audits",
    moduleSlug: "inspections",
    extraModuleSlug: "audits",
    name: "Inspections & audits",
  },
  { slug: "capa-tracking", moduleSlug: "capa", name: "CAPA tracking" },
  { slug: "training-competency", moduleSlug: "training", name: "Training & competency" },
  { slug: "contractor-management", moduleSlug: "contractor-management", name: "Contractor management" },
  { slug: "compliance-tracking", moduleSlug: null, name: "Compliance tracking" },
  { slug: "esg-brsr-reporting", moduleSlug: null, name: "ESG & BRSR reporting" },
];

export type ProductSlug = (typeof PRODUCT_PAGES)[number]["slug"];

export function getProductPage(slug: string) {
  return PRODUCT_PAGES.find((page) => page.slug === slug);
}

export function productHrefForModule(moduleSlug: string) {
  const found = PRODUCT_PAGES.find(
    (page) => page.moduleSlug === moduleSlug || page.extraModuleSlug === moduleSlug,
  );
  return found ? `/product/${found.slug}` : "/product";
}
