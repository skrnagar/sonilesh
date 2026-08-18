export type MarketplaceKind = "template" | "connector" | "app";

export type MarketplaceItem = {
  code: string;
  kind: MarketplaceKind;
  name: string;
  description: string;
  featureCode: string;
};

export const MARKETPLACE_CATALOG: MarketplaceItem[] = [
  {
    code: "tpl_incident_investigation",
    kind: "template",
    name: "Incident investigation pack",
    description: "Checklist and terminology template. No payment.",
    featureCode: "incident_management",
  },
  {
    code: "tpl_capa_workflow",
    kind: "template",
    name: "CAPA workflow starter",
    description: "Metadata-only CAPA stages. Does not replace the CAPA engine.",
    featureCode: "capa",
  },
  {
    code: "conn_csv_manual",
    kind: "connector",
    name: "CSV connector",
    description: "Attaches the first-party CSV connector. No vendor fees.",
    featureCode: "integrations",
  },
  {
    code: "app_search_saved_views",
    kind: "app",
    name: "Saved search views",
    description: "Architecture metadata for saved enterprise search views.",
    featureCode: "enterprise_search",
  },
];

export function marketplaceItemByCode(code: string) {
  return MARKETPLACE_CATALOG.find((row) => row.code === code) ?? null;
}

/** Install is entitlement/template attach. Payments are out of scope. */
export function canInstallMarketplaceItem(input: {
  entitledFeatures: string[];
  item: MarketplaceItem;
}) {
  return input.entitledFeatures.includes(input.item.featureCode) || input.item.featureCode === "integrations";
}
