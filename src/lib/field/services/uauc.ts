import type { FieldServiceModule } from "./types";

export const uaucService: FieldServiceModule = {
  key: "uauc",
  label: "UA/UC/WSN",
  routes: ["/field/ualist", "/field/ua-uc/*", "/field/ua-uc"],
  fieldAction: "report_hazard",
  description: "Unsafe acts, unsafe conditions, and work stop notices.",
};

export { listUaucEvents } from "@/lib/services/uauc-list";
export type { UaucListFilters, UaucListRow } from "@/lib/services/uauc-list";
