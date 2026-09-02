import type { FieldServiceModule } from "./types";

export const permitsService: FieldServiceModule = {
  key: "permits",
  label: "WORK PERMIT",
  routes: ["/field/permits/*", "/field/permits"],
  fieldAction: "my_permits",
  description: "Permit to work requests, active permits, and countdown.",
};

export { permitCountdown } from "@/lib/field/permit-countdown";
