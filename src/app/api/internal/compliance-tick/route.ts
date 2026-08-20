import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { evaluateApplicability, processComplianceReminders } from "@/lib/services/compliance";
import { authorizeCron } from "@/lib/http/cron-auth";

export async function POST(request: Request) {
  const denied = authorizeCron(request);
  if (denied) return denied;

  const supabase = createAdminClient();
  const { data: profiles, error } = await supabase
    .from("org_compliance_profile")
    .select("organization_id");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let evaluated = 0;
  for (const row of profiles ?? []) {
    await evaluateApplicability(supabase, row.organization_id);
    evaluated += 1;
  }
  const reminders = await processComplianceReminders(supabase);
  return NextResponse.json({ evaluated, reminders });
}
