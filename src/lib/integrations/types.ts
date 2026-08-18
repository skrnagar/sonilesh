export type ConnectorMaturity = "real" | "sandbox" | "architecture";
export type ConnectorCategory =
  | "hrms"
  | "idp"
  | "erp"
  | "iot"
  | "dms"
  | "notify"
  | "calendar"
  | "csv"
  | "other";

export type SyncMode = "full" | "incremental" | "manual" | "scheduled";
export type ConnectionStatus = "available" | "connected" | "needs_attention" | "failed" | "disabled";

export type MappingEntityExternal = "employee" | "department" | "location" | "project" | "other";
export type MappingEntityInternal = "worker" | "department" | "site" | "project" | "member" | "other";

export type ConnectorDef = {
  code: string;
  name: string;
  category: ConnectorCategory;
  maturity: ConnectorMaturity;
  description: string;
};

export type ExternalRecord = {
  externalSystem: string;
  externalId: string;
  entityType: MappingEntityExternal;
  updatedAt?: string | null;
  fields: Record<string, string | number | boolean | null>;
};

export type MappingRule = {
  entityType: MappingEntityExternal;
  externalField: string;
  internalEntity: MappingEntityInternal;
  internalField: string;
};

export type TransformedRecord = {
  externalSystem: string;
  externalId: string;
  internalEntity: MappingEntityInternal;
  fields: Record<string, string>;
};

export type SyncCursor = {
  updatedAt?: string | null;
  externalId?: string | null;
};

export interface IntegrationProvider {
  code: string;
  maturity: ConnectorMaturity;
  fetch(input: {
    mode: SyncMode;
    cursor: SyncCursor;
    config: Record<string, unknown>;
  }): Promise<{ records: ExternalRecord[]; nextCursor: SyncCursor; note?: string }>;
}

export const OUTBOUND_WEBHOOK_EVENTS = [
  "incident.created",
  "incident.updated",
  "capa.created",
  "capa.closed",
  "permit.issued",
  "training.completed",
] as const;

export type OutboundWebhookEvent = (typeof OUTBOUND_WEBHOOK_EVENTS)[number];
