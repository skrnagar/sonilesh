export const FORBIDDEN_IMPORT_FIELDS = [
  "is_owner",
  "is_platform_admin",
  "platform_role",
  "platformRole",
  "role_id",
  "roleId",
  "member_roles",
  "permissions",
] as const;

export const ALLOWED_IMPORT_ROLES = new Set(["employee", "viewer", "contractor"]);

export type ImportEntityType =
  | "users"
  | "workers"
  | "sites"
  | "projects"
  | "contractors"
  | "training"
  | "certificates";

export function parseCsv(text: string) {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim().length);
  if (!lines.length) return { headers: [] as string[], rows: [] as Record<string, string>[] };
  const headers = splitCsvLine(lines[0]).map((h) => h.trim());
  const rows = lines.slice(1).map((line) => {
    const cells = splitCsvLine(line);
    const row: Record<string, string> = {};
    headers.forEach((header, i) => {
      row[header] = (cells[i] ?? "").trim();
    });
    return row;
  });
  return { headers, rows };
}

function splitCsvLine(line: string) {
  const out: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      out.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  out.push(current);
  return out;
}

export type SanitizedImportRow = {
  payload: Record<string, string>;
  skippedPrivilegeFields: string[];
  error?: string;
};

export function sanitizeImportRow(
  entityType: ImportEntityType,
  row: Record<string, string>,
): SanitizedImportRow {
  const skippedPrivilegeFields: string[] = [];
  const payload: Record<string, string> = {};

  for (const [rawKey, value] of Object.entries(row)) {
    const key = rawKey.trim();
    if (!key) continue;
    if ((FORBIDDEN_IMPORT_FIELDS as readonly string[]).includes(key)) {
      skippedPrivilegeFields.push(key);
      continue;
    }
    payload[key] = value;
  }

  if (entityType === "users") {
    const role = (payload.role || payload.role_code || "employee").toLowerCase();
    if (!ALLOWED_IMPORT_ROLES.has(role)) {
      skippedPrivilegeFields.push("role");
      payload.role = "employee";
    } else {
      payload.role = role;
    }
    delete payload.is_owner;
    delete payload.owner;
  }

  if (entityType === "users" && !payload.email) {
    return { payload, skippedPrivilegeFields, error: "email is required" };
  }
  if (entityType === "sites" && !payload.name) {
    return { payload, skippedPrivilegeFields, error: "name is required" };
  }
  if (entityType === "projects" && !payload.name) {
    return { payload, skippedPrivilegeFields, error: "name is required" };
  }
  if (entityType === "contractors" && !payload.name) {
    return { payload, skippedPrivilegeFields, error: "name is required" };
  }
  if (entityType === "workers" && !payload.full_name && !payload.name) {
    return { payload, skippedPrivilegeFields, error: "full_name is required" };
  }

  return { payload, skippedPrivilegeFields };
}

export function cannotEscalatePrivileges(row: SanitizedImportRow) {
  return !row.payload.is_owner && !row.payload.is_platform_admin && !row.payload.platform_role;
}
