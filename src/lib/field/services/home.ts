import type { FieldServiceModule } from "./types";

export const homeService: FieldServiceModule = {
  key: "home",
  label: "MY ZONE",
  routes: ["/field", "/field/home", "/field/my-zone"],
  fieldAction: "my_zone",
  description: "Field launchpad, pending actions, permits, training, and recent submissions.",
};
