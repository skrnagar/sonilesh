import type { FieldAction } from "@/lib/auth/field-roles";

/** Stable keys for field microservice modules — one per launchpad tile group. */
export type FieldServiceKey =
  | "home"
  | "reports"
  | "uauc"
  | "incident"
  | "site-visits"
  | "utilities"
  | "training"
  | "ehs-mis"
  | "ehs-score"
  | "nc"
  | "checklist"
  | "lmra"
  | "permits"
  | "bbs"
  | "actions";

export type FieldServiceModule = {
  key: FieldServiceKey;
  /** Display label (launchpad / section title). */
  label: string;
  /** Route prefixes owned by this service. */
  routes: string[];
  fieldAction: FieldAction;
  description: string;
};

export function fieldServiceMatchesRoute(
  service: FieldServiceModule,
  pathname: string,
): boolean {
  return service.routes.some((prefix) => {
    if (prefix.endsWith("/*")) {
      return pathname.startsWith(prefix.slice(0, -2));
    }
    return pathname === prefix || pathname.startsWith(`${prefix}/`);
  });
}
