import type { FieldServiceModule } from "./types";

export const bbsService: FieldServiceModule = {
  key: "bbs",
  label: "BBS",
  routes: ["/field/bbs"],
  fieldAction: "bbs",
  description: "Behaviour-based safety observations.",
};
