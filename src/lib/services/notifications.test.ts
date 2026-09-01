import { describe, expect, it } from "vitest";
import {
  EHS_NOTIFICATION_ROLES,
  incidentAlertsEnabled,
  recipientsAfterPreferences,
} from "@/lib/services/notifications";

describe("notification preferences", () => {
  it("treats missing org config as incident alerts on", () => {
    expect(incidentAlertsEnabled(null)).toBe(true);
    expect(incidentAlertsEnabled({})).toBe(true);
  });

  it("honors incident_alerts = false", () => {
    expect(incidentAlertsEnabled({ incident_alerts: false })).toBe(false);
    expect(incidentAlertsEnabled({ incident_alerts: true })).toBe(true);
  });

  it("keeps all recipients when no per-user prefs exist", () => {
    expect(recipientsAfterPreferences(["a", "b"], [])).toEqual(["a", "b"]);
  });

  it("drops users who disabled the event in-app", () => {
    expect(
      recipientsAfterPreferences(
        ["a", "b", "c"],
        [
          { user_id: "b", enabled: false },
          { user_id: "c", enabled: true },
        ],
      ),
    ).toEqual(["a", "c"]);
  });

  it("includes tenant admins in EHS alert fan-out roles", () => {
    expect(EHS_NOTIFICATION_ROLES).toContain("tenant_admin");
    expect(EHS_NOTIFICATION_ROLES).toContain("ehs_admin");
    expect(EHS_NOTIFICATION_ROLES).toContain("supervisor");
  });
});
