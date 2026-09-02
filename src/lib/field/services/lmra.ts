import type { FieldServiceModule } from "./types";

export const lmraService: FieldServiceModule = {
  key: "lmra",
  label: "LMRA",
  routes: ["/field/lmra"],
  fieldAction: "lmra",
  description: "Last minute risk assessment before starting work.",
};
