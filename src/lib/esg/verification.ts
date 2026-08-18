export const ESG_VERIFICATION_STATES = [
  "draft",
  "submitted",
  "in_review",
  "verified",
  "published",
] as const;

export type EsgVerificationStatus = (typeof ESG_VERIFICATION_STATES)[number];

const ALLOWED: Record<EsgVerificationStatus, EsgVerificationStatus[]> = {
  draft: ["submitted"],
  submitted: ["in_review", "verified"],
  in_review: ["verified", "draft"],
  verified: ["published"],
  published: [],
};

export function canAdvanceEsgVerification(
  from: EsgVerificationStatus | string,
  to: EsgVerificationStatus | string,
) {
  const allowed = ALLOWED[from as EsgVerificationStatus];
  return Boolean(allowed?.includes(to as EsgVerificationStatus));
}

/** Status-only transition. Historical metric values/units are copied, never rewritten. */
export function applyEsgVerification<T extends { value?: number | null; unit?: string | null }>(
  row: T,
  toStatus: EsgVerificationStatus,
) {
  return {
    ...row,
    verification_status: toStatus,
  };
}

export const ESG_PERIOD_STATES = [
  "open",
  "data_collection",
  "review",
  "approved",
  "published",
  "closed",
  "locked",
] as const;

export type EsgPeriodStatus = (typeof ESG_PERIOD_STATES)[number];
