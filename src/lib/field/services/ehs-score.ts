import type { FieldServiceModule } from "./types";

export const ehsScoreService: FieldServiceModule = {
  key: "ehs-score",
  label: "EHS SCORE CARD",
  routes: ["/field/ehs-score"],
  fieldAction: "ehs_score",
  description: "BU/region EHS score dashboard and trends.",
};

export {
  defaultEhsScoreBiFilters,
  loadEhsScoreBiDashboard,
} from "@/lib/services/ehs-score-bi";
