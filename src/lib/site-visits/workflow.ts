export type VisitType = "hsv" | "rsv" | "tsv";
export type VisitStatus = "draft" | "submitted" | "allocated" | "closed" | "final_closed" | "cancelled";

/** Valid forward transitions enforced in service + DB trigger. */
export const SITE_VISIT_TRANSITIONS: Record<VisitStatus, VisitStatus[]> = {
  draft: ["submitted", "cancelled"],
  submitted: ["allocated", "cancelled"],
  allocated: ["closed", "cancelled"],
  closed: ["final_closed"],
  final_closed: [],
  cancelled: [],
};

export function canTransitionSiteVisit(from: VisitStatus, to: VisitStatus) {
  return SITE_VISIT_TRANSITIONS[from]?.includes(to) ?? false;
}
