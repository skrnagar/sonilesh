import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { processImportJob } from "@/lib/import/service";
import { nextRetryAt, shouldRetry } from "@/lib/integrations/webhooks";
import { authorizeCron } from "@/lib/http/cron-auth";

export async function POST(request: Request) {
  const denied = authorizeCron(request);
  if (denied) return denied;

  const supabase = createAdminClient();
  const { data: imports } = await supabase
    .from("import_jobs")
    .select("id, organization_id, created_by")
    .in("status", ["queued", "processing"])
    .limit(10);

  let processed = 0;
  for (const job of imports ?? []) {
    await processImportJob(supabase, {
      organizationId: job.organization_id,
      userId: job.created_by ?? job.organization_id,
      jobId: job.id,
    });
    processed += 1;
  }

  const { data: deliveries } = await supabase
    .from("integration_webhook_deliveries")
    .select("id, attempt_count, organization_id")
    .in("status", ["pending", "retrying"])
    .lte("next_attempt_at", new Date().toISOString())
    .limit(20);

  let retried = 0;
  for (const row of deliveries ?? []) {
    const nextAttempt = (row.attempt_count ?? 0) + 1;
    await supabase
      .from("integration_webhook_deliveries")
      .update({
        attempt_count: nextAttempt,
        status: shouldRetry(nextAttempt) ? "retrying" : "failed",
        next_attempt_at: shouldRetry(nextAttempt) ? nextRetryAt(nextAttempt) : null,
        last_error: "Delivery worker is architecture-only until a signed outbound send is configured.",
      })
      .eq("id", row.id)
      .eq("organization_id", row.organization_id);
    retried += 1;
  }

  return NextResponse.json({ imports: processed, webhookRetries: retried });
}
