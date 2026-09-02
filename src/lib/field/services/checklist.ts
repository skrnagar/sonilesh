import type { FieldServiceModule } from "./types";

export const checklistService: FieldServiceModule = {
  key: "checklist",
  label: "CHECKLIST",
  routes: [
    "/field/inspection",
    "/field/checklist/*",
    "/field/checklist",
    "/field/nc",
  ],
  fieldAction: "inspection",
  description: "Inspection checklists, templates, and non-conformance capture.",
};
