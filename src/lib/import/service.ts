import type { SupabaseClient } from "@supabase/supabase-js";
import { hasFeature } from "@/lib/services/entitlements";
import { userHasPermission } from "@/lib/services/rbac";
import { writeAuditLog } from "@/lib/services/audit";
import { createOrganizationInvitation } from "@/lib/services/invitations";
import { parseCsv, sanitizeImportRow, type ImportEntityType } from "@/lib/import/pipeline";

const TABLE_FOR: Record<ImportEntityType, string | null> = {
  users: null,
  workers: "contractor_workers",
  sites: "sites",
  projects: "projects",
  contractors: "contractor_companies",
  training: "training_assignments",
  certificates: "training_assignments",
};

export async function enqueueImportJob(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    entityType: ImportEntityType;
    filename: string;
    csvText: string;
  },
) {
  const entitled = await hasFeature(supabase, input.organizationId, "integrations");
  if (!entitled) {
    const fallback = await hasFeature(supabase, input.organizationId, "hrms_integration");
    if (!fallback) throw new Error("Import requires the integrations entitlement");
  }
  const permitted = await userHasPermission(
    supabase,
    input.organizationId,
    input.userId,
    "import.manage",
  );
  if (!permitted) throw new Error("Missing permission: import.manage");

  const parsed = parseCsv(input.csvText);
  if (parsed.rows.length > 5000) {
    throw new Error("CSV exceeds 5000 rows. Split the file and retry.");
  }

  const { data: job, error } = await supabase
    .from("import_jobs")
    .insert({
      organization_id: input.organizationId,
      entity_type: input.entityType,
      filename: input.filename,
      row_count: parsed.rows.length,
      status: "queued",
      created_by: input.userId,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  if (parsed.rows.length) {
    const { error: rowError } = await supabase.from("import_job_rows").insert(
      parsed.rows.map((row, index) => {
        const sanitized = sanitizeImportRow(input.entityType, row);
        return {
          organization_id: input.organizationId,
          job_id: job.id,
          row_number: index + 1,
          payload: sanitized.payload,
          status: sanitized.error ? "failed" : "queued",
          error: sanitized.error ?? (sanitized.skippedPrivilegeFields.length
            ? `privilege fields ignored: ${sanitized.skippedPrivilegeFields.join(",")}`
            : null),
        };
      }),
    );
    if (rowError) throw new Error(rowError.message);
  }

  await writeAuditLog(supabase, {
    organizationId: input.organizationId,
    actorUserId: input.userId,
    action: "import.enqueued",
    entityType: "import_job",
    entityId: job.id,
    newValues: { entityType: input.entityType, rows: parsed.rows.length },
  });

  return job.id;
}

export async function processImportJob(
  supabase: SupabaseClient,
  input: { organizationId: string; userId: string; jobId: string; limit?: number },
) {
  const { data: job, error } = await supabase
    .from("import_jobs")
    .select("id, entity_type, status")
    .eq("id", input.jobId)
    .eq("organization_id", input.organizationId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!job) throw new Error("Import job not found");

  await supabase
    .from("import_jobs")
    .update({ status: "processing", started_at: new Date().toISOString() })
    .eq("id", job.id)
    .eq("organization_id", input.organizationId);

  const { data: rows } = await supabase
    .from("import_job_rows")
    .select("id, row_number, payload, status")
    .eq("job_id", job.id)
    .eq("organization_id", input.organizationId)
    .eq("status", "queued")
    .order("row_number")
    .limit(input.limit ?? 200);

  let success = 0;
  let failed = 0;
  const entityType = job.entity_type as ImportEntityType;
  const table = TABLE_FOR[entityType];

  for (const row of rows ?? []) {
    const payload = (row.payload ?? {}) as Record<string, string>;
    try {
      if (entityType === "users") {
        const role =
          payload.role === "viewer" || payload.role === "contractor" ? payload.role : "employee";
        await createOrganizationInvitation(supabase, {
          organizationId: input.organizationId,
          userId: input.userId,
          email: payload.email,
          fullName: payload.full_name || payload.name,
          roleCode: role,
        });
      } else if (table === "sites") {
        await supabase.from("sites").insert({
          organization_id: input.organizationId,
          name: payload.name,
          code: (payload.code || payload.name || "SITE").toUpperCase().slice(0, 32),
          country: payload.country || null,
          timezone: payload.timezone || null,
          locale: payload.locale || null,
          currency: payload.currency || null,
          created_by: input.userId,
        });
      } else if (table === "projects") {
        await supabase.from("projects").insert({
          organization_id: input.organizationId,
          name: payload.name,
          code: (payload.code || payload.name || "PRJ").toUpperCase().slice(0, 32),
          created_by: input.userId,
        });
      } else if (table === "contractor_companies") {
        await supabase.from("contractor_companies").insert({
          organization_id: input.organizationId,
          name: payload.name,
          created_by: input.userId,
        });
      } else if (entityType === "workers") {
        if (!payload.company_id) throw new Error("company_id is required for workers");
        const { data: company } = await supabase
          .from("contractor_companies")
          .select("id")
          .eq("id", payload.company_id)
          .eq("organization_id", input.organizationId)
          .maybeSingle();
        if (!company) throw new Error("contractor company not in this organization");
        await supabase.from("contractor_workers").insert({
          organization_id: input.organizationId,
          company_id: company.id,
          full_name: payload.full_name || payload.name,
          employee_number: payload.employee_number || null,
        });
      } else if (entityType === "training" || entityType === "certificates") {
        if (!payload.course_id || !payload.user_id) {
          throw new Error("course_id and user_id are required");
        }
        await supabase.from("training_assignments").insert({
          organization_id: input.organizationId,
          course_id: payload.course_id,
          user_id: payload.user_id,
          status: entityType === "certificates" ? "completed" : "assigned",
          certificate_url: payload.certificate_url || null,
        });
      }
      await supabase
        .from("import_job_rows")
        .update({ status: "written" })
        .eq("id", row.id)
        .eq("organization_id", input.organizationId);
      success += 1;
    } catch (err) {
      failed += 1;
      await supabase
        .from("import_job_rows")
        .update({
          status: "failed",
          error: err instanceof Error ? err.message : "import failed",
        })
        .eq("id", row.id)
        .eq("organization_id", input.organizationId);
    }
  }

  const { count: remaining } = await supabase
    .from("import_job_rows")
    .select("id", { count: "exact", head: true })
    .eq("job_id", job.id)
    .eq("status", "queued");

  const done = !remaining;
  await supabase
    .from("import_jobs")
    .update({
      status: done ? (failed && !success ? "failed" : "completed") : "processing",
      success_count: success,
      error_count: failed,
      finished_at: done ? new Date().toISOString() : null,
    })
    .eq("id", job.id)
    .eq("organization_id", input.organizationId);

  await writeAuditLog(supabase, {
    organizationId: input.organizationId,
    actorUserId: input.userId,
    action: done ? "import.completed" : "import.processed_batch",
    entityType: "import_job",
    entityId: job.id,
    newValues: { success, failed, remaining: remaining ?? 0 },
  });

  return { success, failed, remaining: remaining ?? 0, done };
}
