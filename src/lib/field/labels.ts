/** Field-facing copy. Backend event type remains `hazard` / `hazard_reporting`. */
export const FIELD_LABELS = {
  incident: {
    short: "Incident",
    title: "New incident",
    subtitle: "What happened, photo, and location",
  },
  nearMiss: {
    short: "Near miss",
    title: "Near miss",
    subtitle: "A close call that did not cause harm",
  },
  lmra: {
    short: "LMRA",
    title: "LMRA",
    subtitle: "Last minute risk assessment — stop, think, control before the task",
  },
  inspection: { short: "Inspection", title: "Inspection" },
  actions: { short: "Actions", title: "My actions" },
  permits: { short: "Permits", title: "My permits" },
  training: { short: "Training", title: "My training" },
  toolbox: { short: "Toolbox", title: "Toolbox talk" },
} as const;

export function fieldEventLabel(eventTypeCode: string | null | undefined) {
  if (eventTypeCode === "near_miss") return FIELD_LABELS.nearMiss.short;
  if (
    eventTypeCode === "hazard" ||
    eventTypeCode === "unsafe_act" ||
    eventTypeCode === "unsafe_condition"
  ) {
    return FIELD_LABELS.lmra.short;
  }
  return FIELD_LABELS.incident.short;
}
