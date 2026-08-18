import type {
  ExternalRecord,
  MappingEntityExternal,
  MappingEntityInternal,
  MappingRule,
  TransformedRecord,
} from "@/lib/integrations/types";

export const DEFAULT_MAPPINGS: MappingRule[] = [
  { entityType: "employee", externalField: "employee_id", internalEntity: "worker", internalField: "employee_number" },
  { entityType: "employee", externalField: "full_name", internalEntity: "worker", internalField: "full_name" },
  { entityType: "employee", externalField: "email", internalEntity: "member", internalField: "invited_email" },
  { entityType: "department", externalField: "code", internalEntity: "department", internalField: "code" },
  { entityType: "department", externalField: "name", internalEntity: "department", internalField: "name" },
  { entityType: "location", externalField: "code", internalEntity: "site", internalField: "code" },
  { entityType: "location", externalField: "name", internalEntity: "site", internalField: "name" },
  { entityType: "project", externalField: "code", internalEntity: "project", internalField: "code" },
  { entityType: "project", externalField: "name", internalEntity: "project", internalField: "name" },
];

const ENTITY_MAP: Record<MappingEntityExternal, MappingEntityInternal> = {
  employee: "worker",
  department: "department",
  location: "site",
  project: "project",
  other: "other",
};

export function resolveInternalEntity(entityType: MappingEntityExternal): MappingEntityInternal {
  return ENTITY_MAP[entityType];
}

export function transformRecord(
  record: ExternalRecord,
  rules: MappingRule[],
): TransformedRecord {
  const applicable = rules.filter((rule) => rule.entityType === record.entityType);
  const fields: Record<string, string> = {};
  for (const rule of applicable) {
    const value = record.fields[rule.externalField];
    if (value == null || value === "") continue;
    fields[rule.internalField] = String(value).trim();
  }
  return {
    externalSystem: record.externalSystem,
    externalId: record.externalId,
    internalEntity: resolveInternalEntity(record.entityType),
    fields,
  };
}

export function validateExternalRecord(record: ExternalRecord) {
  if (!record.externalSystem?.trim()) return "external_system is required";
  if (!record.externalId?.trim()) return "external_id is required";
  if (!record.entityType) return "entity_type is required";
  return null;
}
