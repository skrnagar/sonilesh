import type { FieldServiceModule } from "./types";

export const trainingService: FieldServiceModule = {
  key: "training",
  label: "TRAINING",
  routes: ["/field/training"],
  fieldAction: "training",
  description: "Assigned training courses and completion status.",
};
