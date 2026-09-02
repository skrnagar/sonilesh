import type { FieldServiceModule } from "./types";

export const utilitiesService: FieldServiceModule = {
  key: "utilities",
  label: "UTILITIES",
  routes: ["/field/utilities"],
  fieldAction: "utilities",
  description: "Quick links to org settings and utilities.",
};
