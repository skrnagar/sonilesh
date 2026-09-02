import type { FieldServiceModule } from "./types";

export const actionsService: FieldServiceModule = {
  key: "actions",
  label: "Actions",
  routes: ["/field/actions", "/field/action-list"],
  fieldAction: "my_actions",
  description: "Allocated action items and CAPA assigned to the field user.",
};

export { getFieldAllocatedActions, formatFieldActionDate } from "@/lib/field/allocated-actions";
export type { AllocatedActionRow, AllocatedActionKind } from "@/lib/field/allocated-actions";
