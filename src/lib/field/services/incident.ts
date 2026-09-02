import type { FieldServiceModule } from "./types";

export const incidentService: FieldServiceModule = {
  key: "incident",
  label: "INCIDENT",
  routes: ["/field/incident", "/field/near-miss", "/field/report/incident", "/field/report/near-miss"],
  fieldAction: "report_incident",
  description: "Incident and near-miss reporting from the field.",
};
