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
  uauc: {
    short: "UA/UC/WSN",
    title: "Reported UA/UC/WSN List",
    subtitle: "Unsafe acts, unsafe conditions, and work stop notices",
  },
  siteVisits: {
    short: "Site visits",
    title: "Site visits",
    subtitle: "HSV, RSV, and TSV — create and close from the field",
  },
} as const;

export function fieldEventLabel(eventTypeCode: string | null | undefined) {
  if (eventTypeCode === "near_miss") return FIELD_LABELS.nearMiss.short;
  if (eventTypeCode === "unsafe_act") return "Unsafe act";
  if (eventTypeCode === "unsafe_condition") return "Unsafe condition";
  if (eventTypeCode === "safety_observation") return "Observation";
  if (eventTypeCode === "hazard") return "Hazard";
  return FIELD_LABELS.incident.short;
}
