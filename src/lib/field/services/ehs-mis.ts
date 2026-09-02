import type { FieldServiceModule } from "./types";

export const ehsMisService: FieldServiceModule = {
  key: "ehs-mis",
  label: "EHS MIS REPORT",
  routes: ["/field/mis"],
  fieldAction: "ehs_mis",
  description: "Monthly EHS MIS submission and status.",
};
