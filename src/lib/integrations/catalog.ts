import type { ConnectorDef } from "@/lib/integrations/types";

/**
 * Connector maturity is declared here so UI never implies a live vendor SDK.
 * Only csv_manual is a first-party pipeline (no external vendor).
 */
export const CONNECTOR_CATALOG: ConnectorDef[] = [
  {
    code: "csv_manual",
    name: "CSV / manual import",
    category: "csv",
    maturity: "real",
    description: "First-party CSV and mapping pipeline. No external vendor SDK.",
  },
  {
    code: "hrms_workday",
    name: "Workday HRMS",
    category: "hrms",
    maturity: "sandbox",
    description: "SANDBOX adapter only — not tested against a live Workday tenant.",
  },
  {
    code: "hrms_successfactors",
    name: "SAP SuccessFactors",
    category: "hrms",
    maturity: "sandbox",
    description: "SANDBOX adapter only — not tested against a live SuccessFactors tenant.",
  },
  {
    code: "hrms_bamboohr",
    name: "BambooHR",
    category: "hrms",
    maturity: "sandbox",
    description: "SANDBOX adapter only — not tested against a live BambooHR account.",
  },
  {
    code: "idp_oidc",
    name: "OIDC / SAML identity",
    category: "idp",
    maturity: "architecture",
    description: "Architecture stub for SSO/IdP. Not a certified identity provider.",
  },
  {
    code: "erp_sap",
    name: "SAP ERP",
    category: "erp",
    maturity: "sandbox",
    description: "SANDBOX adapter only — not tested against a live SAP system.",
  },
  {
    code: "iot_meters",
    name: "IoT / meters",
    category: "iot",
    maturity: "architecture",
    description: "Architecture stub. Does not emit live or simulated meter readings.",
  },
  {
    code: "dms_sharepoint",
    name: "SharePoint / DMS",
    category: "dms",
    maturity: "sandbox",
    description: "SANDBOX adapter only — not tested against a live SharePoint tenant.",
  },
  {
    code: "notify_slack",
    name: "Slack notifications",
    category: "notify",
    maturity: "sandbox",
    description: "SANDBOX adapter only — not tested against a live Slack workspace.",
  },
  {
    code: "notify_teams",
    name: "Microsoft Teams",
    category: "notify",
    maturity: "sandbox",
    description: "SANDBOX adapter only — not tested against a live Teams tenant.",
  },
  {
    code: "calendar_google",
    name: "Google Calendar",
    category: "calendar",
    maturity: "sandbox",
    description: "SANDBOX adapter only — not tested against Google Calendar.",
  },
];

export function connectorByCode(code: string) {
  return CONNECTOR_CATALOG.find((row) => row.code === code) ?? null;
}

export function isProductionReadyConnector(code: string) {
  return connectorByCode(code)?.maturity === "real";
}
