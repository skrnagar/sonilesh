import { actionsService } from "./actions";
import { bbsService } from "./bbs";
import { checklistService } from "./checklist";
import { ehsMisService } from "./ehs-mis";
import { ehsScoreService } from "./ehs-score";
import { homeService } from "./home";
import { incidentService } from "./incident";
import { lmraService } from "./lmra";
import { permitsService } from "./permits";
import { reportsService } from "./reports";
import { siteVisitsService } from "./site-visits";
import { trainingService } from "./training";
import { uaucService } from "./uauc";
import { utilitiesService } from "./utilities";
import { fieldServiceMatchesRoute, type FieldServiceKey, type FieldServiceModule } from "./types";

export const FIELD_SERVICE_REGISTRY: FieldServiceModule[] = [
  homeService,
  reportsService,
  uaucService,
  incidentService,
  siteVisitsService,
  utilitiesService,
  trainingService,
  ehsMisService,
  ehsScoreService,
  checklistService,
  lmraService,
  permitsService,
  bbsService,
  actionsService,
];

const byKey = new Map<FieldServiceKey, FieldServiceModule>(
  FIELD_SERVICE_REGISTRY.map((service) => [service.key, service]),
);

export function getFieldService(key: FieldServiceKey): FieldServiceModule | undefined {
  return byKey.get(key);
}

export function resolveFieldService(pathname: string): FieldServiceModule | undefined {
  return FIELD_SERVICE_REGISTRY.find((service) => fieldServiceMatchesRoute(service, pathname));
}
