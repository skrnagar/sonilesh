import type { FieldServiceModule } from "./types";

export const reportsService: FieldServiceModule = {
  key: "reports",
  label: "Report",
  routes: ["/field/reports/*", "/field/reports"],
  fieldAction: "raksha_reports",
  description: "Report hub — operational registers, iQuality, and BRSR links.",
};

export {
  FIELD_REPORT_CATEGORIES,
  FIELD_REPORT_LINKS,
  filterFieldReportLinks,
  getFieldReportLink,
  getFieldReportLinksForCategory,
  resolveAccessAtLevel,
  FIELD_ROLE_LABELS,
} from "@/lib/field/report-links";

export type {
  FieldReportCategory,
  FieldReportKey,
  FieldReportLink,
} from "@/lib/field/report-links";
