import type { FieldServiceModule } from "./types";

export const siteVisitsService: FieldServiceModule = {
  key: "site-visits",
  label: "Site Visits",
  routes: ["/field/site-visits/*", "/field/site-visits"],
  fieldAction: "site_visit",
  description: "HSV, RSV, and TSV safety visit capture and register.",
};

export { listSiteVisits } from "@/lib/services/site-visits";
